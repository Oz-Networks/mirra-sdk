import './globals.css'

export const metadata = {
  title: 'Calendar Scheduling',
  description: 'Book a meeting with ease',
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

