import Link from 'next/link'
import Image from 'next/image'
import { urlFor } from '@/lib/sanity'
import { getRelatedPosts } from '@/lib/related-posts'
import type { BlogPost } from '@/lib/sanity'
import ReadingTime from './ReadingTime'

interface RelatedPostsProps {
  currentPostId: string
  categories?: string[]
  limit?: number
}

export default async function RelatedPosts({ 
  currentPostId, 
  categories = [], 
  limit = 3 
}: RelatedPostsProps) {
  const relatedPosts = await getRelatedPosts(currentPostId, categories, limit)
  
  if (relatedPosts.length === 0) {
    return null
  }

  return (
    <section className="mt-16 pt-8 border-t" style={{borderColor: 'var(--color-surface)'}}>
      <h2 className="text-2xl font-bold mb-8" style={{color: 'var(--color-text-primary)'}}>
        関連記事
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {relatedPosts.map((post) => (
          <article 
            key={post._id} 
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            {/* 記事画像 - heroImage優先、なければmainImage */}
            {(post.heroImage || post.mainImage) && (
              <Link href={`/blog/${post.slug.current}`}>
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={urlFor(post.heroImage || post.mainImage).width(400).height(200).url()}
                    alt={(post.heroImage || post.mainImage)?.alt || `${post.title}のサムネイル画像`}
                    width={400}
                    height={200}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    loading="lazy"
                  />
                </div>
              </Link>
            )}
            
            {/* 記事内容 */}
            <div className="p-6">
              {/* カテゴリ */}
              {post.categories && post.categories.length > 0 && (
                <div className="mb-3">
                  <span 
                    className="inline-block px-3 py-1 text-xs font-semibold rounded-full"
                    style={{
                      backgroundColor: 'var(--color-accent)',
                      color: 'white'
                    }}
                  >
                    {post.categories[0]}
                  </span>
                </div>
              )}
              
              {/* タイトル */}
              <h3 className="mb-3">
                <Link 
                  href={`/blog/${post.slug.current}`}
                  className="text-lg font-semibold line-clamp-2 hover:opacity-80 transition-opacity"
                  style={{color: 'var(--color-text-primary)'}}
                >
                  {post.title}
                </Link>
              </h3>
              
              {/* 抜粋 */}
              {post.excerpt && (
                <p 
                  className="text-sm mb-4 line-clamp-3"
                  style={{color: 'var(--color-text-secondary)'}}
                >
                  {post.excerpt}
                </p>
              )}
              
              {/* メタ情報 */}
              <div className="flex items-center justify-between text-xs" style={{color: 'var(--color-text-muted)'}}>
                <time dateTime={post.publishedAt}>
                  {new Date(post.publishedAt).toLocaleDateString('ja-JP', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </time>
                
                <ReadingTime content={post.body || []} />
              </div>
            </div>
          </article>
        ))}
      </div>
      
      {/* 全記事へのリンク */}
      <div className="text-center mt-8">
        <Link
          href="/blog"
          className="inline-block text-white px-6 py-3 rounded-lg hover:opacity-90 transition-opacity font-medium"
          style={{backgroundColor: 'var(--color-accent)'}}
        >
          すべての記事を見る
        </Link>
      </div>
    </section>
  )
}

// 関連記事の構造化データ
export function RelatedPostsStructuredData({ posts }: { posts: BlogPost[] }) {
  if (posts.length === 0) return null

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "関連記事",
    "description": "この記事に関連する記事一覧",
    "numberOfItems": posts.length,
    "itemListElement": posts.map((post, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "BlogPosting",
        "@id": `https://hiro-logue-sanity.vercel.app/blog/${post.slug.current}`,
        "name": post.title,
        "description": post.excerpt || post.title,
        "url": `https://hiro-logue-sanity.vercel.app/blog/${post.slug.current}`,
        "datePublished": post.publishedAt,
        "author": {
          "@type": "Person",
          "name": post.author?.name || "ヒロ"
        }
      }
    }))
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}