import Link from 'next/link'
import { ChevronRightIcon } from '@heroicons/react/24/outline'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="パンくずナビゲーション" className="mb-6">
      <ol className="flex items-center space-x-2 text-sm" style={{color: 'var(--color-text-muted)'}}>
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <ChevronRightIcon className="w-4 h-4 mx-2" aria-hidden="true" />
            )}
            {item.href ? (
              <Link
                href={item.href}
                className="hover:opacity-80 transition-opacity"
                style={{color: 'var(--color-accent)'}}
              >
                {item.label}
              </Link>
            ) : (
              <span style={{color: 'var(--color-text-primary)'}} aria-current="page">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

// パンくずナビゲーション用の構造化データ
export function BreadcrumbStructuredData({ items }: BreadcrumbProps) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.label,
      ...(item.href && {
        "item": {
          "@type": "WebPage",
          "@id": `https://hiro-logue-sanity.vercel.app${item.href}`
        }
      })
    }))
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}