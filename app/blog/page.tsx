import Link from 'next/link'
import { getPosts } from '@/lib/sanity'
import { urlFor } from '@/lib/sanity'
import Image from 'next/image'

export default async function BlogPage() {
  const posts = await getPosts()

  return (
    <div className="min-h-screen" style={{backgroundColor: 'var(--color-background)'}}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4" style={{color: 'var(--color-text-primary)'}}>
            ブログ記事一覧
          </h1>
          <p className="text-xl" style={{color: 'var(--color-text-secondary)'}}>
            暮らしの解像度を上げるヒントをお届けします
          </p>
        </div>

        {posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <article key={post._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                {post.mainImage && (
                  <div className="relative h-48">
                    <Image
                      src={urlFor(post.mainImage).width(400).height(200).url()}
                      alt={post.mainImage.alt || post.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-center text-sm mb-2" style={{color: 'var(--color-text-muted)'}}>
                    <time dateTime={post.publishedAt}>
                      {new Date(post.publishedAt).toLocaleDateString('ja-JP')}
                    </time>
                    {post.author && (
                      <>
                        <span className="mx-2">•</span>
                        <span>{post.author.name}</span>
                      </>
                    )}
                  </div>
                  <h2 className="text-xl font-semibold mb-2" style={{color: 'var(--color-text-primary)'}}>
                    <Link 
                      href={`/blog/${post.slug.current}`}
                      className="hover:opacity-80 transition-opacity"
                      style={{color: 'var(--color-text-primary)'}}
                    >
                      {post.title}
                    </Link>
                  </h2>
                  {post.excerpt && (
                    <p className="mb-4" style={{color: 'var(--color-text-secondary)'}}>{post.excerpt}</p>
                  )}
                  <Link 
                    href={`/blog/${post.slug.current}`}
                    className="font-medium hover:opacity-80 transition-opacity"
                    style={{color: 'var(--color-accent)'}}
                  >
                    続きを読む →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-lg" style={{color: 'var(--color-text-secondary)'}}>記事はまだありません。</p>
            <p className="mt-2" style={{color: 'var(--color-text-muted)'}}>Sanity Studioで記事を作成してください。</p>
          </div>
        )}
      </div>
    </div>
  )
}