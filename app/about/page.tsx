import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'プロフィール - Hiro-Logue',
  description: 'プログラマー・3児の父・ヒロのプロフィールページ。技術と家族の両立、暮らしの気づきを追求する日々をご紹介します。',
  openGraph: {
    title: 'プロフィール - Hiro-Logue',
    description: 'プログラマー・3児の父・ヒロのプロフィールページ。技術と家族の両立、暮らしの気づきを追求する日々をご紹介します。',
  },
}

export default function AboutPage() {
  return (
    <div className="min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="relative w-32 h-32 mx-auto mb-8">
            <Image
              src="/images/profile/avatar.jpg"
              alt="ヒロのプロフィール画像"
              width={128}
              height={128}
              className="w-32 h-32 rounded-full object-cover shadow-lg"
              priority
            />
          </div>
          <h1 className="text-4xl font-bold mb-4" style={{color: 'var(--color-text-primary)'}}>
            ヒロのプロフィール
          </h1>
          <p className="text-xl" style={{color: 'var(--color-text-secondary)'}}>
            プログラマー・3児の父・暮らしの気づきを追求する人
          </p>
        </div>

        {/* About Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6" style={{color: 'var(--color-text-primary)'}}>
            はじめまして
          </h2>
          <div className="prose prose-lg max-w-none" style={{color: 'var(--color-text-secondary)'}}>
            <p>
              はじめまして、ヒロです。このブログ「Hiro-Logue」を書いています。
            </p>
            <p>
              普段はプログラマーとして働きながら、3人の子どもたちと妻との日常を大切にしています。
              このブログでは、技術の話だけでなく、家族との時間で得た気づきや、
              日常の何気ない出来事から見えてくる「なるほど」な発見を書いています。
            </p>
            <p>
              「暮らしの解像度を上げる」というのがこのブログのコンセプト。
              表面的に流れていく情報ではなく、少し立ち止まって「これってどういうことだろう？」と
              考えてみると見えてくる、新しい視点や気づきをお届けしたいと思っています。
            </p>
          </div>
        </section>

        {/* Skills & Experience */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6" style={{color: 'var(--color-text-primary)'}}>
            技術・経験
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-4" style={{color: 'var(--color-accent)'}}>
                プログラミング
              </h3>
              <ul className="space-y-2" style={{color: 'var(--color-text-secondary)'}}>
                <li>• JavaScript / TypeScript</li>
                <li>• React / Next.js</li>
                <li>• Node.js</li>
                <li>• Python</li>
                <li>• データベース設計・管理</li>
                <li>• クラウドインフラ</li>
              </ul>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-4" style={{color: 'var(--color-accent)'}}>
                その他の活動
              </h3>
              <ul className="space-y-2" style={{color: 'var(--color-text-secondary)'}}>
                <li>• 技術ブログ執筆</li>
                <li>• 音声配信（stand.fm）</li>
                <li>• 子育て・家族との時間</li>
                <li>• 地域活性化事業</li>
                <li>• 継続学習・新技術習得</li>
                <li>• ペット（犬・保護猫）の世話</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Values & Philosophy */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6" style={{color: 'var(--color-text-primary)'}}>
            大切にしていること
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-white rounded-lg shadow-md">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center text-2xl" style={{backgroundColor: 'var(--color-accent)', color: 'white'}}>
                🏠
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{color: 'var(--color-text-primary)'}}>
                家族中心
              </h3>
              <p className="text-sm" style={{color: 'var(--color-text-secondary)'}}>
                ペットも含めた家族の幸せを何より大切にしています。
              </p>
            </div>
            <div className="text-center p-6 bg-white rounded-lg shadow-md">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center text-2xl" style={{backgroundColor: 'var(--color-accent)', color: 'white'}}>
                📚
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{color: 'var(--color-text-primary)'}}>
                継続学習
              </h3>
              <p className="text-sm" style={{color: 'var(--color-text-secondary)'}}>
                新しいことへの挑戦と学び続けることを大切にしています。
              </p>
            </div>
            <div className="text-center p-6 bg-white rounded-lg shadow-md">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center text-2xl" style={{backgroundColor: 'var(--color-accent)', color: 'white'}}>
                🔄
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{color: 'var(--color-text-primary)'}}>
                適応性
              </h3>
              <p className="text-sm" style={{color: 'var(--color-text-secondary)'}}>
                変化を恐れず、流れに身を任せる柔軟性を心がけています。
              </p>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6" style={{color: 'var(--color-text-primary)'}}>
            つながり・お問い合わせ
          </h2>
          <div className="bg-white p-8 rounded-lg shadow-md">
            <p className="mb-6" style={{color: 'var(--color-text-secondary)'}}>
              ブログやstand.fmの感想、技術的なご質問、お仕事のご相談など、
              お気軽にお声がけください。家族との時間を大切にしているため、
              返信にお時間をいただく場合がありますが、必ずお返事いたします。
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a
                href="https://x.com/hsrk_g_hsrk"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center px-4 py-3 rounded-lg text-white transition-all hover:opacity-90"
                style={{backgroundColor: '#1DA1F2'}}
              >
                X (Twitter)
              </a>
              <a
                href="https://github.com/hiroHGxx"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center px-4 py-3 rounded-lg text-white transition-all hover:opacity-90"
                style={{backgroundColor: '#333'}}
              >
                GitHub
              </a>
              <a
                href="https://stand.fm/channels/6399d332df23c21009b42475"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center px-4 py-3 rounded-lg text-white transition-all hover:opacity-90"
                style={{backgroundColor: '#FF6B35'}}
              >
                stand.fm
              </a>
            </div>
          </div>
        </section>

        {/* Blog CTA */}
        <section className="text-center">
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4" style={{color: 'var(--color-text-primary)'}}>
              ブログもぜひご覧ください
            </h2>
            <p className="mb-6" style={{color: 'var(--color-text-secondary)'}}>
              日常の気づきから技術的な発見まで、暮らしの解像度を上げるヒントを
              定期的に更新しています。
            </p>
            <Link
              href="/blog"
              className="inline-block text-white px-8 py-3 rounded-lg hover:opacity-90 transition-all font-medium"
              style={{backgroundColor: 'var(--color-accent)'}}
            >
              ブログを読む
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}