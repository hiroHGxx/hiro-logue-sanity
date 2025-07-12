import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sanity Studio',
  description: 'Content management for Hiro-Logue',
  robots: {
    index: false,
  },
}

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  )
}