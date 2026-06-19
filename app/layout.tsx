import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RealEstate Deal Analyzer',
  description: 'A modern real estate analysis landing page.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
