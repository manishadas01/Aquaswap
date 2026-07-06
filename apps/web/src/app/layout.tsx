import type { Metadata } from 'next'
import { Geist, Geist_Mono, Montserrat, Open_Sans } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { WalletProvider } from '@/context/WalletContext'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });
const _montserrat = Montserrat({ subsets: ["latin"] });
const _openSans = Open_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'AquaSwap — AMM DEX on Stellar',
  description: 'A Uniswap V2-style automated market maker DEX built on Stellar/Soroban.',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans antialiased ${_montserrat.className} ${_openSans.className}`}>
        <WalletProvider>
          {children}
          <Toaster position="bottom-right" richColors />
        </WalletProvider>
        <Analytics />
      </body>
    </html>
  )
}
