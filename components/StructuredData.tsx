interface BlogPostStructuredDataProps {
  post: {
    title: string
    excerpt?: string
    publishedAt: string
    author?: {
      name: string
    }
    mainImage?: any
    slug: {
      current: string
    }
    body?: any[]
  }
}

interface WebsiteStructuredDataProps {
  url: string
  name: string
  description: string
}

export function BlogPostStructuredData({ post }: BlogPostStructuredDataProps) {
  // 記事の文字数を計算（簡易版）
  const wordCount = post.body 
    ? post.body.reduce((count, block) => {
        if (block._type === 'block' && block.children) {
          return count + block.children.reduce((textCount: number, child: any) => {
            return textCount + (child.text?.length || 0)
          }, 0)
        }
        return count
      }, 0)
    : 0

  // 読了時間の計算（分）
  const readingTime = Math.max(1, Math.ceil(wordCount / 400)) // 400文字/分

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.excerpt || post.title,
    "datePublished": post.publishedAt,
    "dateModified": post.publishedAt,
    "author": {
      "@type": "Person",
      "name": post.author?.name || "ヒロ",
      "url": "https://hiro-logue-sanity.vercel.app/about"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Hiro-Logue",
      "url": "https://hiro-logue-sanity.vercel.app",
      "logo": {
        "@type": "ImageObject",
        "url": "https://hiro-logue-sanity.vercel.app/logo.svg"
      }
    },
    "url": `https://hiro-logue-sanity.vercel.app/blog/${post.slug.current}`,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://hiro-logue-sanity.vercel.app/blog/${post.slug.current}`
    },
    "image": post.mainImage 
      ? {
          "@type": "ImageObject",
          "url": `https://hiro-logue-sanity.vercel.app${post.mainImage}`,
          "width": 1200,
          "height": 630
        }
      : {
          "@type": "ImageObject",
          "url": "https://hiro-logue-sanity.vercel.app/og-image.svg",
          "width": 1200,
          "height": 630
        },
    "articleSection": "暮らし・テクノロジー",
    "inLanguage": "ja-JP",
    "wordCount": wordCount,
    "timeRequired": `PT${readingTime}M`,
    "about": [
      {
        "@type": "Thing",
        "name": "プログラミング"
      },
      {
        "@type": "Thing", 
        "name": "家族"
      },
      {
        "@type": "Thing",
        "name": "暮らしの気づき"
      }
    ],
    "audience": {
      "@type": "Audience",
      "audienceType": "プログラマー、父親、家族を大切にする人"
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}

export function WebsiteStructuredData({ url, name, description }: WebsiteStructuredDataProps) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": name,
    "description": description,
    "url": url,
    "publisher": {
      "@type": "Person",
      "name": "ヒロ",
      "url": "https://hiro-logue-sanity.vercel.app/about"
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${url}/blog?search={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    },
    "inLanguage": "ja-JP"
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}

export function PersonStructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "ヒロ",
    "description": "プログラマー・3児の父・暮らしの気づきを追求する人",
    "url": "https://hiro-logue-sanity.vercel.app/about",
    "image": "https://hiro-logue-sanity.vercel.app/images/profile/avatar.jpg",
    "sameAs": [
      "https://x.com/hsrk_g_hsrk",
      "https://github.com/hiroHGxx",
      "https://stand.fm/channels/6399d332df23c21009b42475"
    ],
    "jobTitle": "プログラマー",
    "knowsAbout": [
      "JavaScript",
      "TypeScript", 
      "React",
      "Next.js",
      "子育て",
      "家族",
      "テクノロジー"
    ],
    "alumniOf": {
      "@type": "Organization",
      "name": "テクノロジー業界"
    },
    "homeLocation": {
      "@type": "Place",
      "name": "日本"
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}