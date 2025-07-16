import Link from 'next/link'
import { getPosts } from '@/lib/sanity'
import { urlFor } from '@/lib/sanity'
import Image from 'next/image'

export default async function Home() {
  const posts = await getPosts()
  const latestPosts = posts.slice(0, 3) // 最新の3記事を表示

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20 relative overflow-hidden" style={{background: 'linear-gradient(to bottom right, var(--color-surface), #f0f0f0)'}}>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <Image
            src="/hero-bg.svg"
            alt=""
            fill
            className="object-cover object-center"
            priority
          />
        </div>
        
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-2" style={{color: 'var(--color-text-primary)'}}>
            Hiro-Logue
          </h1>
          <p className="text-lg md:text-xl mb-8" style={{color: 'var(--color-accent)'}}>
            〜暮らしの解像度を上げるノート〜
          </p>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto" style={{color: 'var(--color-text-secondary)'}}>
            テクノロジーと日常の交差点で見つけた、
            <br />
            物事をより深く、面白く捉えるためのヒントをお届けします。
          </p>
          <Link 
            href="/blog" 
            className="inline-block text-white px-8 py-3 rounded-lg hover:opacity-90 transition-all font-medium shadow-lg"
            style={{backgroundColor: 'var(--color-accent)'}}
          >
            ブログを読む
          </Link>
        </div>
      </section>

      {/* Latest Posts Section */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-8 text-center" style={{color: 'var(--color-text-primary)'}}>
            最新の気づき
          </h2>
          
          {latestPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {latestPosts.map((post) => (
                <article key={post._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  {(post.headerImage || post.heroImage || post.mainImage) && (
                    <div className="relative h-48">
                      <Image
                        src={urlFor(post.headerImage || post.heroImage || post.mainImage).width(400).height(200).url()}
                        alt={(post.headerImage?.alt || post.heroImage?.alt || post.mainImage?.alt) || post.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      <Link 
                        href={`/blog/${post.slug.current}`}
                        className="hover:text-blue-600 transition-colors"
                      >
                        {post.title}
                      </Link>
                    </h3>
                    {post.excerpt && (
                      <p className="text-gray-600 mb-4">{post.excerpt}</p>
                    )}
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <time dateTime={post.publishedAt}>
                        {new Date(post.publishedAt).toLocaleDateString('ja-JP')}
                      </time>
                      <Link 
                        href={`/blog/${post.slug.current}`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        続きを読む →
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">記事はまだありません。</p>
              <p className="text-gray-500 mt-2">Sanity Studioで記事を作成してください。</p>
            </div>
          )}

          <div className="text-center mt-12">
            <Link 
              href="/blog" 
              className="inline-block text-white px-6 py-3 rounded-lg hover:opacity-90 transition-all"
              style={{backgroundColor: 'var(--color-primary)'}}
            >
              すべての気づきを見る
            </Link>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16" style={{backgroundColor: 'var(--color-surface)'}}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6" style={{color: 'var(--color-text-primary)'}}>
            Hiro-Logueについて
          </h2>
          <p className="text-lg leading-relaxed" style={{color: 'var(--color-text-secondary)'}}>
            日常の何気ない出来事も、一度立ち止まって「これってどういうことだろう？」と考えてみると、
            新しい発見や気づきが見えてきます。このブログでは、あなたの暮らしの「解像度を上げる」ヒントを、
            深い考察とともにお届けします。
          </p>
        </div>
      </section>
    </div>
  )
}
