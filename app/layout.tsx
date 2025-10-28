import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Khakhra Business Manager',
  description: 'Complete business management system for khakhra manufacturing',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
