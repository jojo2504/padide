import { LenisProvider } from '@/components/providers/LenisProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { WalletProvider } from '@/lib/wallet-context';
import type { Metadata } from 'next';
import { Inter, JetBrains_Mono, Playfair_Display, Space_Grotesk } from 'next/font/google';
import './globals.css';

// Display font - Emotional words
const displayFont = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

// Mono font - Data words
const monoFont = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

// Sans font - Body text
const sansFont = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

// Logo font - Modern geometric
const logoFont = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-logo',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'CYCLR | The Cycle of Sustainable Finance',
  description: 'Breaking the cycle. Building the future. CYCLR is where FinTech meets ecology on the XRPL.',
  keywords: ['CYCLR', 'XRPL', 'sustainable finance', 'blockchain', 'escrow', 'ecology'],
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: 'CYCLR | The Cycle of Sustainable Finance',
    description: 'Breaking the cycle. Building the future.',
    type: 'website',
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'CYCLR Logo',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html 
      lang="en" 
      suppressHydrationWarning
      className={`${displayFont.variable} ${monoFont.variable} ${sansFont.variable} ${logoFont.variable}`}
    >
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange={false}
        >
          <WalletProvider>
            <LenisProvider>
              {children}
            </LenisProvider>
          </WalletProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
