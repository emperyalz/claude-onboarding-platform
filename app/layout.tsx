import './globals.css'
import type { Metadata } from 'next'
import { ConvexClientProvider } from './ConvexClientProvider'
import { AuthProvider } from './AuthProvider'
import { Toaster } from 'react-hot-toast'

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
        <AuthProvider>
          <ConvexClientProvider>
            {children}
            <Toaster
              position="bottom-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#1A1A1A',
                  color: '#fff',
                },
                success: {
                  iconTheme: {
                    primary: '#CC785C',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </ConvexClientProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
