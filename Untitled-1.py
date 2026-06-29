"""
unified_options_scanner.py
==========================
ONE tool that merges your three scanners with no logic lost:

  * LEAPS brain      (from leaps_screener.py): fundamental GATE, multi-timeframe
                      RSI / price-level / IV / liquidity alignment scoring,
                      risk-based sizing scaled by alignment, and a full EXIT PLAN.
  * DAY/SWING brain  (from daily_options_screener.py): the 45/30/25
                      Technical / Catalyst / Regime confluence engine, RVOL
                      multipliers, bull-AND-bear direction picking (calls OR puts),
                      catalyst (news + earnings) and market-regime layers.
  * yfinance layer   (from options_scanner.py): auto data pull, contract picking.

MODES (pick one, or run all):
    python unified_options_scanner.py day            # short-dated, ATM, confluence brain
    python unified_options_scanner.py swing          # 30-45 DTE, ~3% OTM, confluence brain
    python unified_options_scanner.py leaps          # 365+ DTE, ~10% OTM, LEAPS brain
    python unified_options_scanner.py all            # runs all three
    python unified_options_scanner.py swing NVDA AMD # override the watchlist
    python unified_options_scanner.py day --movers   # auto-build universe from Yahoo movers

HONEST LIMITS (unchanged from the originals):
    * Yahoo gives no IV rank and no greeks. The DAY/SWING brain proxies "rich/cheap"
      via option IV vs realized vol. The LEAPS brain's IV component runs NEUTRAL and
      flags that you must supply real IV rank before the gate is real.
    * The LEAPS fundamental gate is YOUR judgment, not data. LEAPS candidates print
      as "GATE PENDING" -- the tool ranks the technical alignment but will not bless
      a LEAPS trade until you confirm the gate yourself.
    * Run on YOUR machine; a sandbox that blocks Yahoo's domains will fail the fetch.
    * Screening / education tool. NOT financial advice.
"""
from __future__ import annotations

import sys
import math
import datetime as dt
from dataclasses import dataclass, field
from typing import Optional

import numpy as np
import pandas as pd

try:
    import yfinance as yf
except ImportError:
    sys.exit("Missing dependency. Run: pip install yfinance pandas numpy")

# ===========================================================================
# CONFIG  -- edit these
# ===========================================================================
WATCHLIST = ["NVDA", "AMD", "TSLA", "AAPL", "META", "AMZN", "MSFT", "GOOGL"]

# Set this to YOUR real account size so sizing is meaningful.
ACCOUNT_SIZE = 50_000.0   # <-- CHANGE ME

# Per-mode contract gates (the "brain" is shared; only these swap per mode).
MODES = {
    "day": {
        "brain": "confluence",
        "min_dte": 7,   "max_dte": 45,  "otm_pct": 0.00,
        "min_oi": 500,  "min_vol": 100, "max_spread_pct": 0.10,
    },
    "swing": {
        "brain": "confluence",
        "min_dte": 30,  "max_dte": 45,  "otm_pct": 0.03,
        "min_oi": 100,  "min_vol": 0,   "max_spread_pct": 0.10,
    },
    "leaps": {
        "brain": "leaps",
        "min_dte": 365, "max_dte": 900, "otm_pct": 0.10,
        "min_oi": 100,  "min_vol": 0,   "max_spread_pct": 0.03,
    },
}

# Confluence-engine weights (DAY / SWING)
WEIGHTS = {"technical": 0.45, "catalyst": 0.30, "regime": 0.25}
TIER_A, TIER_B, TIER_C = 75, 60, 45

# LEAPS alignment weights (must sum to 100) + exit rules
LEAPS_W = {"rsi": 25.0, "price": 30.0, "iv": 25.0, "liquidity": 20.0}
LEAPS_MAX_LOSS_PCT = 2.0      # % of account you'll risk on one LEAP
LEAPS_MAX_POS_PCT = 10.0      # hard cap on capital in one LEAPS position
LEAPS_SCALE_OUT_PCT = 100.0   # trim at +100%
LEAPS_THETA_DTE = 60          # theta-warning window

# Indicator params
RVOL_LOOKBACK = 20
RVOL_STRONG, RVOL_GOOD, RVOL_MILD = 3.0, 2.0, 1.5
RSI_LEN = 14
RSI_OVERBOUGHT, RSI_OVERSOLD = 78, 22
STRUCT_LOOKBACK = 20
NEWS_FRESH_HRS = 36
EARN_WARN_DAYS = 7

SECTOR_ETF = {
    "NVDA": "SMH", "AMD": "SMH", "AVGO": "SMH", "TSM": "SMH", "MU": "SMH",
    "AAPL": "XLK", "MSFT": "XLK", "GOOGL": "XLC", "META": "XLC",
    "AMZN": "XLY", "TSLA": "XLY", "NFLX": "XLC",
    "JPM": "XLF", "BAC": "XLF", "XOM": "XLE", "CVX": "XLE",
}
POS_WORDS = {"beat", "beats", "surge", "soar", "soars", "jump", "jumps", "rally",
             "upgrade", "upgraded", "raises", "raised", "record", "strong",
             "tops", "outperform", "buy", "bullish", "approval", "wins", "deal",
             "growth", "profit", "boost", "rebound"}
NEG_WORDS = {"miss", "misses", "plunge", "plunges", "drop", "drops", "fall",
             "falls", "downgrade", "downgraded", "cuts", "cut", "lawsuit",
             "probe", "recall", "warning", "weak", "sell", "bearish", "loss",
             "slump", "slumps", "decline", "layoffs", "fraud", "halts", "delay"}


# ===========================================================================
# INDICATOR MATH  (faithful to your originals)
# ===========================================================================
def ema(s: pd.Series, span: int) -> pd.Series:
    return s.ewm(span=span, adjust=False).mean()


def rsi(close: pd.Series, n: int = RSI_LEN) -> pd.Series:
    delta = close.diff()
    gain = delta.clip(lower=0).ewm(alpha=1 / n, adjust=False).mean()
    loss = (-delta.clip(upper=0)).ewm(alpha=1 / n, adjust=False).mean()
    rs = gain / loss.replace(0, np.nan)
    return (100 - 100 / (1 + rs)).fillna(50)   # uptrend edge case handled


def macd(close: pd.Series):
    line = ema(close, 12) - ema(close, 26)
    sig = ema(line, 9)
    return line, sig, line - sig


def atr(df: pd.DataFrame, n: int = 14) -> pd.Series:
    h, l, c = df["High"], df["Low"], df["Close"]
    tr = pd.concat([h - l, (h - c.shift()).abs(), (l - c.shift()).abs()], axis=1).max(axis=1)
    return tr.ewm(alpha=1 / n, adjust=False).mean()


def intraday_vwap(intra) -> Optional[float]:
    if intra is None or intra.empty:
        return None
    tp = (intra["High"] + intra["Low"] + intra["Close"]) / 3
    vol = intra["Volume"].replace(0, np.nan)
    denom = vol.sum()
    if not denom or math.isnan(denom):
        return None
    return float((tp * vol).sum() / denom)


def realized_vol(close: pd.Series, n: int = 20) -> Optional[float]:
    rets = np.log(close / close.shift()).dropna().tail(n)
    if len(rets) < 5:
        return None
    return float(rets.std() * math.sqrt(252))


def rel_volume(volumes: pd.Series, lookback: int = RVOL_LOOKBACK) -> float:
    avg = volumes.tail(lookback + 1).iloc[:-1].mean()
    return float(volumes.iloc[-1] / avg) if avg else 0.0


# ===========================================================================
# DATA LAYER
# ===========================================================================
def build_universe(use_movers: bool) -> list[str]:
    """Watchlist by default. With --movers, try Yahoo's predefined screens.

    NOTE: This is the one piece reconstructed (not merged) because
    yahoo_day_scanner.py wasn't uploaded. If you want your exact movers logic,
    paste your build_universe() body in below; this version degrades to the
    watchlist if the screen call fails.
    """
    if not use_movers:
        return WATCHLIST
    found: list[str] = []
    for screen in ("most_actives", "day_gainers", "day_losers"):
        try:
            res = yf.screen(screen)  # newer yfinance
            quotes = res.get("quotes", []) if isinstance(res, dict) else []
            found += [q.get("symbol") for q in quotes if q.get("symbol")]
        except Exception:
            continue
    uni = sorted(set(s for s in found if s and s.isalpha()))
    if not uni:
        print("  (movers fetch failed -- falling back to WATCHLIST)")
        return WATCHLIST
    return uni[:40]


class Regime:
    """Fetched once, reused for every ticker (from daily_options_screener)."""
    def __init__(self):
        self.spy_up = self.qqq_up = self.vix = None
        self.summary = "unknown"
        self.bullish_tape = None
        try:
            spy = yf.Ticker("SPY").history(period="3mo")["Close"]
            qqq = yf.Ticker("QQQ").history(period="3mo")["Close"]
            self.spy_up = bool(spy.iloc[-1] > ema(spy, 20).iloc[-1])
            self.qqq_up = bool(qqq.iloc[-1] > ema(qqq, 20).iloc[-1])
            vix = yf.Ticker("^VIX").history(period="1mo")["Close"]
            self.vix = float(vix.iloc[-1])
            self.bullish_tape = self.spy_up and self.qqq_up
            calm = self.vix < 20
            self.summary = (f"SPY {'>' if self.spy_up else '<'}20EMA, "
                            f"QQQ {'>' if self.qqq_up else '<'}20EMA, "
                            f"VIX {self.vix:.1f} ({'calm' if calm else 'elevated'})")
        except Exception as e:
            self.summary = f"regime fetch failed ({e})"

    def score_for(self, direction: str, symbol: str):
        notes, score = [], 50.0
        if self.bullish_tape is None:
            return 50.0, ["regime data unavailable"]
        want_up = direction == "CALLS"
        if self.bullish_tape == want_up:
            score += 25; notes.append("index trend confirms direction")
        else:
            score -= 25; notes.append("index trend FIGHTS direction")
        if self.vix is not None:
            if self.vix < 16:
                score += 8; notes.append(f"low VIX {self.vix:.1f}")
            elif self.vix > 26:
                score -= 8; notes.append(f"high VIX {self.vix:.1f}")
        etf = SECTOR_ETF.get(symbol)
        if etf:
            try:
                e = yf.Ticker(etf).history(period="3mo")["Close"]
                etf_up = e.iloc[-1] > ema(e, 20).iloc[-1]
                if etf_up == want_up:
                    score += 12; notes.append(f"{etf} sector confirms")
                else:
                    score -= 8; notes.append(f"{etf} sector diverges")
            except Exception:
                pass
        return float(max(0, min(100, score))), notes


def fetch_frames(tk: yf.Ticker):
    daily = tk.history(period="1y", interval="1d").dropna()
    if len(daily) < 60:
        raise ValueError("insufficient price history")
    weekly = tk.history(period="2y", interval="1wk").dropna()
    try:
        intra = tk.history(period="1d", interval="5m")
    except Exception:
        intra = None
    return daily, weekly, intra


def pick_contract(tk: yf.Ticker, spot: float, direction: str, m: dict):
    """Nearest contract to the OTM target inside the mode's DTE window."""
    try:
        exps = tk.options
    except Exception:
        return None
    if not exps:
        return None
    today = dt.date.today()
    chosen = None
    for e in exps:
        try:
            d = (dt.date.fromisoformat(e) - today).days
        except Exception:
            continue
        if m["min_dte"] <= d <= m["max_dte"]:
            chosen = e
            break
    if chosen is None:
        return None
    dte = (dt.date.fromisoformat(chosen) - today).days
    try:
        chain = tk.option_chain(chosen)
    except Exception:
        return None
    table = chain.calls if direction == "CALLS" else chain.puts
    if table is None or table.empty:
        return None
    target = spot * (1 + m["otm_pct"]) if direction == "CALLS" else spot * (1 - m["otm_pct"])
    row = table.iloc[(table["strike"] - target).abs().argsort().iloc[0]]
    bid, ask = float(row.get("bid", 0) or 0), float(row.get("ask", 0) or 0)
    mid = (bid + ask) / 2 if (bid + ask) else float(row.get("lastPrice", 0) or 0)
    spread_pct = ((ask - bid) / mid) if mid else 1.0
    return {
        "exp": chosen, "dte": dte, "strike": float(row["strike"]),
        "bid": bid, "ask": ask, "mid": round(mid, 2),
        "spread_pct": round(spread_pct, 3),
        "oi": int(row.get("openInterest", 0) or 0),
        "vol": int(row.get("volume", 0) or 0),
        "iv": float(row.get("impliedVolatility", 0) or 0),
    }


# ===========================================================================
# CONFLUENCE BRAIN  (DAY / SWING)  -- from daily_options_screener.py
# ===========================================================================
@dataclass
class Result:
    symbol: str
    mode: str
    spot: float = 0.0
    direction: str = "NONE"
    conviction: float = 0.0
    tier: str = "PASS"
    technical: float = 0.0
    catalyst: float = 0.0
    regime: float = 0.0
    rvol: float = 0.0
    contract: Optional[dict] = None
    sizing: Optional[dict] = None
    notes: list = field(default_factory=list)
    warnings: list = field(default_factory=list)
    error: str = ""


def fetch_catalyst(tk: yf.Ticker, direction_hint: str):
    notes, warns, score = [], [], 40.0
    try:
        news = tk.news or []
    except Exception:
        news = []
    fresh, pos, neg = 0, 0, 0
    now = dt.datetime.now(dt.timezone.utc)
    for item in news[:15]:
        content = item.get("content", item)
        title = (content.get("title") or item.get("title") or "").lower()
        ts = item.get("providerPublishTime")
        when = None
        if ts:
            when = dt.datetime.fromtimestamp(ts, dt.timezone.utc)
        else:
            pd_ = content.get("pubDate")
            if pd_:
                try:
                    when = dt.datetime.fromisoformat(pd_.replace("Z", "+00:00"))
                except Exception:
                    when = None
        if when and (now - when).total_seconds() / 3600 <= NEWS_FRESH_HRS:
            fresh += 1
        toks = set(title.replace(",", " ").replace(".", " ").split())
        pos += len(toks & POS_WORDS)
        neg += len(toks & NEG_WORDS)
    if fresh >= 3:
        score += 25; notes.append(f"{fresh} fresh headlines (<{NEWS_FRESH_HRS}h)")
    elif fresh >= 1:
        score += 12; notes.append(f"{fresh} fresh headline(s)")
    else:
        notes.append("no fresh catalyst")
    if pos or neg:
        lean = "positive" if pos > neg else "negative" if neg > pos else "mixed"
        notes.append(f"headline lean: {lean} (+{pos}/-{neg}) [crude]")
        want_up = direction_hint == "CALLS"
        if (lean == "positive" and want_up) or (lean == "negative" and not want_up):
            score += 15
        elif lean != "mixed":
            score -= 12; warns.append("headline sentiment conflicts with direction")
    try:
        edf = tk.get_earnings_dates(limit=8)
        if edf is not None and not edf.empty:
            future = [d for d in edf.index.to_pydatetime()
                      if d.replace(tzinfo=None) >= dt.datetime.now()]
            if future:
                days = (min(future).replace(tzinfo=None) - dt.datetime.now()).days
                if 0 <= days <= EARN_WARN_DAYS:
                    warns.append(f"earnings in ~{days}d -- binary IV-crush risk")
                    score -= 5
    except Exception:
        pass
    return float(max(0, min(100, score))), notes, warns


def analyze_confluence(symbol, mode, m, daily, weekly, intra, regime) -> Result:
    r = Result(symbol=symbol, mode=mode)
    close = daily["Close"]
    r.spot = float(close.iloc[-1])
    tk = yf.Ticker(symbol)

    e9, e20, e50, e200 = (ema(close, n).iloc[-1] for n in (9, 20, 50, 200))
    m_line, m_sig, m_hist = macd(close)
    rsi_now = rsi(close).iloc[-1]
    r.rvol = rel_volume(daily["Volume"])
    vwap = intraday_vwap(intra)

    sig = {}
    sig["ma"] = np.clip(
        sum([r.spot > e9, r.spot > e20, e20 > e50, e50 > e200]) / 4 * 2 - 1
        if not any(math.isnan(x) for x in (e9, e20, e50, e200)) else 0, -1, 1)
    cross_up = m_line.iloc[-1] > m_sig.iloc[-1]
    hist_rising = m_hist.iloc[-1] > m_hist.iloc[-2]
    sig["macd"] = 0.6 * (1 if cross_up else -1) + 0.4 * (1 if hist_rising else -1)
    sig["rsi"] = float(np.clip((rsi_now - 50) / 25, -1, 1))
    sig["vwap"] = 1 if (vwap and r.spot > vwap) else -1 if vwap else 0
    hh = daily["High"].iloc[-1] >= daily["High"].tail(STRUCT_LOOKBACK).max() * 0.999
    ll = daily["Low"].iloc[-1] <= daily["Low"].tail(STRUCT_LOOKBACK).min() * 1.001
    sig["struct"] = 1 if hh else -1 if ll else 0

    weighted = (0.30 * sig["ma"] + 0.25 * sig["macd"] + 0.20 * sig["rsi"]
                + 0.15 * sig["vwap"] + 0.10 * sig["struct"])
    r.direction = "CALLS" if weighted >= 0 else "PUTS"

    base = abs(weighted) * 100
    if r.rvol >= RVOL_STRONG:
        base *= 1.35; r.notes.append(f"VOLUME SPIKE {r.rvol:.1f}x (strong)")
    elif r.rvol >= RVOL_GOOD:
        base *= 1.18; r.notes.append(f"elevated volume {r.rvol:.1f}x")
    elif r.rvol >= RVOL_MILD:
        base *= 1.05; r.notes.append(f"mild volume {r.rvol:.1f}x")
    else:
        r.warnings.append(f"weak volume {r.rvol:.1f}x -- no confirmation")
    r.technical = float(min(100, base))
    r.notes.append(f"MACD {'bull' if cross_up else 'bear'} cross, "
                   f"hist {'rising' if hist_rising else 'falling'}; RSI {rsi_now:.0f}")
    if rsi_now >= RSI_OVERBOUGHT and r.direction == "CALLS":
        r.warnings.append(f"RSI {rsi_now:.0f} overbought -- chasing risk")
    if rsi_now <= RSI_OVERSOLD and r.direction == "PUTS":
        r.warnings.append(f"RSI {rsi_now:.0f} oversold -- bounce risk")

    r.catalyst, c_notes, c_warns = fetch_catalyst(tk, r.direction)
    r.notes += c_notes; r.warnings += c_warns
    r.regime, reg_notes = regime.score_for(r.direction, symbol)
    r.notes += reg_notes

    r.contract = pick_contract(tk, r.spot, r.direction, m)
    qmult = 1.0
    if r.contract is None:
        r.warnings.append("no usable contract in DTE window"); qmult = 0.6
    else:
        op = r.contract
        if op["spread_pct"] > m["max_spread_pct"]:
            qmult *= 0.80; r.warnings.append(f"wide spread {op['spread_pct']*100:.0f}%")
        if op["oi"] < m["min_oi"]:
            qmult *= 0.85; r.warnings.append(f"thin OI {op['oi']}")
        if op["vol"] < m["min_vol"]:
            qmult *= 0.92; r.warnings.append(f"low contract volume {op['vol']}")
        rv = realized_vol(close)
        if rv and op["iv"]:
            if op["iv"] / rv > 1.5:
                r.warnings.append(f"IV {op['iv']*100:.0f}% >> realized {rv*100:.0f}% (rich)")
            else:
                r.notes.append(f"IV {op['iv']*100:.0f}% vs realized {rv*100:.0f}%")
        r.sizing = size_position(op["mid"], r.technical, m)

    raw = (r.technical * WEIGHTS["technical"] + r.catalyst * WEIGHTS["catalyst"]
           + r.regime * WEIGHTS["regime"])
    r.conviction = round(raw * qmult, 1)
    r.tier = ("A" if r.conviction >= TIER_A else "B" if r.conviction >= TIER_B
              else "C" if r.conviction >= TIER_C else "PASS")
    return r


# ===========================================================================
# LEAPS BRAIN  -- from leaps_screener.py (auto-fed; gate + IV stay manual)
# ===========================================================================
def score_rsi_leaps(daily_rsi, weekly_rsi, weekly_prev):
    d = daily_rsi
    base = 100.0 if d < 30 else 70.0 if d < 40 else 40.0 if d < 50 else 15.0
    curl = weekly_rsi - weekly_prev
    if weekly_rsi < 45 and curl > 0:
        adj, note = 15.0, "weekly curling up from a low"
    elif curl > 0:
        adj, note = 5.0, "weekly rising"
    elif curl < 0:
        adj, note = -15.0, "weekly still falling"
    else:
        adj, note = 0.0, "weekly flat"
    return max(0.0, min(100.0, base + adj)), f"daily RSI {d:.0f}; {note}"


def score_price_leaps(price, recent_high, support, ma200):
    above = (price - support) / support * 100 if support > 0 else 999
    s_sc = (100 if above <= 2 else 75 if above <= 8 else 50 if above <= 15
            else 25 if above <= 25 else 5)
    pb = max(0.0, (recent_high - price) / recent_high * 100) if recent_high > 0 else 0
    p_sc = (100 if 15 <= pb <= 35 else 60 if 8 <= pb < 15 else 20 if pb < 8 else 50)
    ma_bonus, ma_note = 0.0, "no MA"
    if ma200 and not math.isnan(ma200):
        dist = abs(price - ma200) / ma200 * 100
        if dist <= 3:
            ma_bonus, ma_note = 10.0, f"within {dist:.1f}% of 200MA"
        else:
            ma_note = f"{dist:.1f}% from 200MA"
    score = min(100.0, 0.6 * s_sc + 0.4 * p_sc + ma_bonus)
    return score, f"{above:.1f}% above support, {pb:.0f}% off highs, {ma_note}"


def score_liquidity_leaps(spread_pct, oi, vol):
    sp = spread_pct * 100
    sp_sc = 100 if sp <= 1 else 70 if sp <= 3 else 35 if sp <= 6 else 5
    oi_sc = 100 if oi >= 1000 else 70 if oi >= 100 else 20
    vol_sc = 100 if vol >= 200 else 60 if vol >= 25 else 25
    return 0.5 * sp_sc + 0.3 * oi_sc + 0.2 * vol_sc, f"spread {sp:.1f}%, OI {oi}, vol {vol}"


def size_position(premium, alignment, m):
    """Risk-based sizing scaled by score, hard-capped (from leaps_screener)."""
    if not premium or premium <= 0:
        return None
    cost = premium * 100
    if m["brain"] == "leaps":
        max_loss = ACCOUNT_SIZE * LEAPS_MAX_LOSS_PCT / 100
        cap_pct = LEAPS_MAX_POS_PCT
    else:
        max_loss = ACCOUNT_SIZE * 0.02      # 2% risk
        cap_pct = 5.0                        # swing/day position cap
    budget = max_loss * max(0.0, min(1.0, alignment / 100))
    contracts = int(budget // cost)
    capped = False
    if contracts * cost / ACCOUNT_SIZE * 100 > cap_pct:
        contracts = int((ACCOUNT_SIZE * cap_pct / 100) // cost); capped = True
    capital = contracts * cost
    return {"contracts": contracts, "capital": capital,
            "capital_pct": capital / ACCOUNT_SIZE * 100,
            "max_loss": capital, "capped": capped}


def analyze_leaps(symbol, m, daily, weekly) -> Result:
    r = Result(symbol=symbol, mode="leaps")
    close = daily["Close"]
    r.spot = float(close.iloc[-1])
    tk = yf.Ticker(symbol)

    daily_rsi = rsi(close).iloc[-1]
    wk_rsi = rsi(weekly["Close"])
    weekly_rsi, weekly_prev = (float(wk_rsi.iloc[-1]), float(wk_rsi.iloc[-2])) \
        if len(wk_rsi) > 2 else (50.0, 50.0)
    recent_high = float(daily["High"].tail(252).max())
    support = float(daily["Low"].tail(120).min())
    ma200 = ema(close, 200).iloc[-1]

    rsi_sc, rsi_n = score_rsi_leaps(daily_rsi, weekly_rsi, weekly_prev)
    pr_sc, pr_n = score_price_leaps(r.spot, recent_high, support, ma200)

    r.contract = pick_contract(tk, r.spot, "CALLS", m)
    if r.contract is None:
        r.error = "no LEAPS contract in 365-900 DTE window"
        return r
    op = r.contract
    liq_sc, liq_n = score_liquidity_leaps(op["spread_pct"], op["oi"], op["vol"])
    iv_sc = 50.0  # IV rank unavailable from Yahoo -> NEUTRAL, flagged

    alignment = (LEAPS_W["rsi"] * rsi_sc + LEAPS_W["price"] * pr_sc
                 + LEAPS_W["iv"] * iv_sc + LEAPS_W["liquidity"] * liq_sc) / 100
    r.technical = round(alignment, 1)
    r.direction = "CALLS"
    r.sizing = size_position(op["mid"], alignment, m)

    r.notes += [f"RSI: {rsi_n}", f"PRICE: {pr_n}", f"LIQUIDITY: {liq_n}",
                f"strike ~{op['strike']:g} ({(op['strike']/r.spot-1)*100:+.0f}% OTM), "
                f"{op['dte']}d, mid ${op['mid']:.2f}"]
    r.warnings.append("IV component NEUTRAL -- supply real IV rank for the true gate")
    r.warnings.append("FUNDAMENTAL GATE PENDING -- confirm you'd own shares for years")
    if op["spread_pct"] > m["max_spread_pct"]:
        r.warnings.append(f"spread {op['spread_pct']*100:.1f}% over {m['max_spread_pct']*100:.0f}% gate")
    if op["oi"] < m["min_oi"]:
        r.warnings.append(f"thin OI {op['oi']}")

    # verdict uses alignment but never auto-passes the human gate
    if alignment >= 75:
        r.tier = "STRONG (gate pending)"
    elif alignment >= 60:
        r.tier = "MODERATE (gate pending)"
    else:
        r.tier = "WAIT"
    r.conviction = r.technical
    return r


# ===========================================================================
# REPORT
# ===========================================================================
def report(results, regime, mode_label):
    ranked = sorted([x for x in results if not x.error],
                    key=lambda x: x.conviction, reverse=True)
    print("\n" + "=" * 78)
    print(f"  UNIFIED SCANNER -- {mode_label.upper()} -- {dt.datetime.now():%Y-%m-%d %H:%M}")
    print(f"  Market regime: {regime.summary}")
    print("=" * 78)
    for r in ranked:
        op = r.contract
        head = (f"\n  {r.symbol}  {r.direction}  [{r.tier}]  "
                f"score {r.conviction:.0f}/100  spot ${r.spot:.2f}")
        if r.mode != "leaps":
            head += f"  (T{r.technical:.0f}/C{r.catalyst:.0f}/R{r.regime:.0f}, RVOL {r.rvol:.1f}x)"
        print(head)
        if op:
            print(f"     {op['exp']} ~{op['dte']}d  ${op['strike']:g}"
                  f"{'C' if r.direction=='CALLS' else 'P'}  mid ${op['mid']:.2f}  "
                  f"spread {op['spread_pct']*100:.0f}%  OI {op['oi']}  IV {op['iv']*100:.0f}%")
        if r.sizing:
            z = r.sizing
            cap = " (capped)" if z["capped"] else ""
            print(f"     size: {z['contracts']} contract(s)  "
                  f"${z['capital']:,.0f} ({z['capital_pct']:.1f}% of acct){cap}")
        for n in r.notes:
            print(f"     + {n}")
        for w in r.warnings:
            print(f"     ! {w}")
    errs = [x for x in results if x.error]
    if errs:
        print("\n  Skipped:", ", ".join(f"{e.symbol} ({e.error})" for e in errs))
    print("\n  Screening tool, not advice. Verify before sizing in.\n")


# ===========================================================================
# MAIN
# ===========================================================================
def run_mode(mode, tickers, regime):
    m = MODES[mode]
    results = []
    for t in tickers:
        try:
            tk = yf.Ticker(t)
            daily, weekly, intra = fetch_frames(tk)
            if m["brain"] == "leaps":
                results.append(analyze_leaps(t, m, daily, weekly))
            else:
                results.append(analyze_confluence(t, mode, m, daily, weekly, intra, regime))
        except Exception as e:
            results.append(Result(symbol=t, mode=mode, error=str(e)))
    report(results, regime, mode)


def main():
    args = [a for a in sys.argv[1:]]
    use_movers = "--movers" in args
    args = [a for a in args if a != "--movers"]

    mode = "day"
    if args and args[0].lower() in ("day", "swing", "leaps", "all"):
        mode = args.pop(0).lower()
    tickers = [t.upper() for t in args] or build_universe(use_movers)

    print(f"Fetching regime + {len(tickers)} tickers from Yahoo "
          f"(mode: {mode}){' [movers]' if use_movers else ''}...")
    regime = Regime()
    modes = ("day", "swing", "leaps") if mode == "all" else (mode,)
    for md in modes:
        run_mode(md, tickers, regime)


if __name__ == "__main__":
    main()
    