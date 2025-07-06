import { getPost, getPosts } from '@/lib/sanity'
import { urlFor } from '@/lib/sanity'
import { PortableText } from '@portabletext/react'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { BlogPostStructuredData } from '@/components/StructuredData'
import Breadcrumb, { BreadcrumbStructuredData } from '@/components/Breadcrumb'
import { ReadingTime } from '@/lib/reading-time'

interface PageProps {
  params: Promise<{
    slug: string
  }>
}

// 個別記事の動的メタデータ生成
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)

  if (!post) {
    return {
      title: '記事が見つかりません - Hiro-Logue',
      description: 'お探しの記事は見つかりませんでした。',
    }
  }

  // 記事の内容から抜粋を生成（bodyから最初の段落を取得）
  const excerpt = post.excerpt || 
    (post.body?.[0]?.children?.[0]?.text?.substring(0, 160) + '...' || 
     '暮らしの解像度を上げるヒントをお届けします。')

  // 公開日を適切にフォーマット
  const publishedTime = post.publishedAt ? new Date(post.publishedAt).toISOString() : new Date().toISOString()
  
  // 著者情報
  const authorName = post.author?.name || 'ヒロ'
  
  // OG画像URL（メイン画像がある場合はそれを使用、なければデフォルト）
  const ogImageUrl = post.mainImage 
    ? urlFor(post.mainImage).width(1200).height(630).url()
    : '/og-image.svg'

  return {
    title: `${post.title} - Hiro-Logue`,
    description: excerpt,
    keywords: [
      'ブログ', 'テクノロジー', '日常', 'プログラマー', '家族', '気づき', 
      ...(post.categories || [])
    ],
    authors: [{ name: authorName, url: 'https://hiro-logue-sanity.vercel.app/about' }],
    creator: authorName,
    publisher: 'Hiro-Logue',
    openGraph: {
      title: post.title,
      description: excerpt,
      url: `https://hiro-logue-sanity.vercel.app/blog/${slug}`,
      siteName: 'Hiro-Logue',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
      locale: 'ja_JP',
      type: 'article',
      publishedTime,
      authors: [authorName],
      section: '暮らし・テクノロジー',
      tags: post.categories || [],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: excerpt,
      images: [ogImageUrl],
      creator: '@hsrk_g_hsrk',
    },
    robots: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
    alternates: {
      canonical: `https://hiro-logue-sanity.vercel.app/blog/${slug}`,
    },
    category: '暮らし・テクノロジー',
  }
}

// Portable Text components for rendering rich text
const components = {
  types: {
    image: ({value}: any) => (
      <div className="my-8">
        <Image
          src={urlFor(value).width(800).height(400).url()}
          alt={value.alt || 'Blog image'}
          width={800}
          height={400}
          className="rounded-lg"
        />
      </div>
    ),
  },
  block: {
    h1: ({children}: any) => <h1 className="mt-8 mb-4 text-3xl font-bold" style={{color: 'var(--color-text-primary)'}}>{children}</h1>,
    h2: ({children}: any) => <h2 className="mt-6 mb-3 text-2xl font-semibold" style={{color: 'var(--color-text-primary)'}}>{children}</h2>,
    h3: ({children}: any) => <h3 className="mt-4 mb-2 text-xl font-semibold" style={{color: 'var(--color-text-primary)'}}>{children}</h3>,
    h4: ({children}: any) => <h4 className="mt-4 mb-2 text-lg font-medium" style={{color: 'var(--color-text-primary)'}}>{children}</h4>,
    normal: ({children}: any) => <p className="mb-4 text-base leading-7" style={{color: 'var(--color-text-primary)'}}>{children}</p>,
    blockquote: ({children}: any) => (
      <blockquote className="border-l-4 pl-4 my-6 italic" style={{borderColor: 'var(--color-accent)', color: 'var(--color-text-secondary)'}}>
        {children}
      </blockquote>
    ),
  },
  marks: {
    link: ({value, children}: any) => (
      <a href={value.href} className="underline hover:opacity-80 transition-opacity" style={{color: 'var(--color-accent)'}}>
        {children}
      </a>
    ),
    strong: ({children}: any) => <strong className="font-bold" style={{color: 'var(--color-text-primary)'}}>{children}</strong>,
    em: ({children}: any) => <em className="italic" style={{color: 'var(--color-text-secondary)'}}>{children}</em>,
  },
  list: {
    bullet: ({children}: any) => <ul className="list-disc list-inside mb-4 space-y-2 ml-4" style={{color: 'var(--color-text-primary)'}}>{children}</ul>,
    number: ({children}: any) => <ol className="list-decimal list-inside mb-4 space-y-2 ml-4" style={{color: 'var(--color-text-primary)'}}>{children}</ol>,
  },
  listItem: {
    bullet: ({children}: any) => <li className="leading-6" style={{color: 'var(--color-text-primary)'}}>{children}</li>,
    number: ({children}: any) => <li className="leading-6" style={{color: 'var(--color-text-primary)'}}>{children}</li>,
  },
}

export default async function BlogPost({ params }: PageProps) {
  const { slug } = await params
  const post = await getPost(slug)

  if (!post) {
    notFound()
  }

  const breadcrumbItems = [
    { label: 'ホーム', href: '/' },
    { label: 'ブログ', href: '/blog' },
    { label: post.title }
  ]

  return (
    <div className="min-h-screen" style={{backgroundColor: 'var(--color-background)'}}>
      <BlogPostStructuredData post={post} />
      <BreadcrumbStructuredData items={breadcrumbItems} />
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <header className="mb-8">
          <Breadcrumb items={breadcrumbItems} />
          <div className="mb-4">
            <Link 
              href="/blog" 
              className="font-medium hover:opacity-80 transition-opacity"
              style={{color: 'var(--color-accent)'}}
            >
              ← ブログ一覧に戻る
            </Link>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-6" style={{color: 'var(--color-text-primary)'}}>
            {post.title}
          </h1>
          
          <div className="flex items-center mb-6" style={{color: 'var(--color-text-muted)'}}>
            <time dateTime={post.publishedAt} className="text-sm">
              {new Date(post.publishedAt).toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </time>
            {post.author && (
              <>
                <span className="mx-2">•</span>
                <span className="text-sm">{post.author.name}</span>
              </>
            )}
            <span className="mx-2">•</span>
            <ReadingTime content={post.body || []} />
          </div>

          {post.excerpt && (
            <p className="text-xl leading-relaxed mb-8" style={{color: 'var(--color-text-secondary)'}}>
              {post.excerpt}
            </p>
          )}
        </header>

        {/* Featured Image */}
        {post.mainImage && (
          <div className="mb-8">
            <Image
              src={urlFor(post.mainImage).width(1200).height(600).url()}
              alt={post.mainImage.alt || post.title}
              width={1200}
              height={600}
              className="w-full rounded-lg shadow-lg"
              priority
            />
          </div>
        )}

        {/* Content */}
        <div className="prose prose-lg max-w-none">
          {post.body && <PortableText value={post.body} components={components} />}
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t" style={{borderColor: 'var(--color-surface)'}}>
          <div className="flex items-center justify-between">
            <Link 
              href="/blog" 
              className="inline-block text-white px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
              style={{backgroundColor: 'var(--color-accent)'}}
            >
              他の記事を読む
            </Link>
            
            {post.author && (
              <div className="flex items-center">
                {post.author.image && (
                  <Image
                    src={urlFor(post.author.image).width(50).height(50).url()}
                    alt={post.author.name}
                    width={50}
                    height={50}
                    className="rounded-full mr-3"
                  />
                )}
                <div>
                  <p className="text-sm" style={{color: 'var(--color-text-muted)'}}>著者</p>
                  <p className="font-semibold" style={{color: 'var(--color-text-primary)'}}>{post.author.name}</p>
                </div>
              </div>
            )}
          </div>
        </footer>
      </article>
    </div>
  )
}

// Generate static params for all posts
export async function generateStaticParams() {
  const posts = await getPosts()
  
  return posts.map((post) => ({
    slug: post.slug.current,
  }))
}