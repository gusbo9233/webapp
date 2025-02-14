// app/layout.tsx
import './globals.css'
import { Metadata } from 'next'
import { Inter } from 'next/font/google'
import SideMenu from './components/SideMenu'

// Example: Using a Google Font
const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'World of Data',
  description: 'A sample Next.js 13 layout with Tailwind CSS',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.className}>
      <body className="min-h-screen bg-gray-100 antialiased">
        <SideMenu />
        {children}
      </body>
    </html>
  )
}
