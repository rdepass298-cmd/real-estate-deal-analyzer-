import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        gold: '#d4af37',
        'gold-light': '#e5c76b',
        'gold-dark': '#2b2205',
      },
    },
  },
  plugins: [],
};

export default config;
