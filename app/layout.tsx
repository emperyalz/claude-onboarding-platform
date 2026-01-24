import './globals.css'
import type { Metadata } from 'next'
import { ConvexClientProvider } from './ConvexClientProvider'

export const metadata: Metadata = {
  title: 'Claude Onboarding Platform',
  description: 'Personalize your Claude experience',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ConvexClientProvider>
          {children}
        </ConvexClientProvider>
      </body>
    </html>
  )
}
