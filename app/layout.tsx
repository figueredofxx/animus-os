import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ANIMUS OS — Athlete Dashboard',
  description: 'Controle de ciclos, peso, treinos e dieta — 100% local',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ANIMUS OS',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#05050a',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@300;400;500;600;700&family=Orbitron:wght@400;500;700;900&family=DM+Sans:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
