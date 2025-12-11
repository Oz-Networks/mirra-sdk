import React from 'react'
import './globals.css'
import { PrivyProviderWrapper } from '../providers/PrivyProvider'

export const metadata = {
  title: 'Product Document Manager',
  description: 'Securely manage your product documentation',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <PrivyProviderWrapper>
          {children}
        </PrivyProviderWrapper>
      </body>
    </html>
  )
}
