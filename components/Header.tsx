import Link from 'next/link'
import Image from 'next/image'

export default function Header() {
  return (
    <header style={{backgroundColor: 'var(--color-primary)'}} className="shadow-sm border-b relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <Image
          src="/hero-bg.svg"
          alt=""
          fill
          className="object-cover object-center"
          priority
        />
      </div>
      
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="flex-shrink-0">
                <Image
                  src="/logo.svg"
                  alt="Hiro-Logue"
                  width={160}
                  height={48}
                  className="transition-transform group-hover:scale-105"
                  priority
                />
              </div>
            </Link>
          </div>
          <nav className="hidden md:flex space-x-8">
            <Link 
              href="/" 
              className="px-3 py-2 rounded-md text-sm font-medium transition-colors hover:text-white"
              style={{color: 'rgba(255, 255, 255, 0.8)'}}
            >
              ホーム
            </Link>
            <Link 
              href="/blog" 
              className="px-3 py-2 rounded-md text-sm font-medium transition-colors hover:text-white"
              style={{color: 'rgba(255, 255, 255, 0.8)'}}
            >
              ブログ
            </Link>
            <Link 
              href="/about" 
              className="px-3 py-2 rounded-md text-sm font-medium transition-colors hover:text-white"
              style={{color: 'rgba(255, 255, 255, 0.8)'}}
            >
              プロフィール
            </Link>
          </nav>
          {/* Mobile menu button */}
          <div className="md:hidden">
            <button className="text-white hover:opacity-80 transition-opacity">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}