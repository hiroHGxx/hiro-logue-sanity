export default function Footer() {
  return (
    <footer style={{backgroundColor: 'var(--color-primary)'}} className="text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">Hirolog</h3>
            <p style={{color: 'rgba(255, 255, 255, 0.7)'}}>
              暮らしの解像度を上げるノート。テクノロジーと日常の交差点で見つけた気づきをお届けします。
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">カテゴリ</h3>
            <ul className="space-y-2" style={{color: 'rgba(255, 255, 255, 0.7)'}}>
              <li><a href="#" className="hover:text-white transition-colors">テクノロジー・AI</a></li>
              <li><a href="#" className="hover:text-white transition-colors">お仕事・働き方</a></li>
              <li><a href="#" className="hover:text-white transition-colors">趣味・遊び</a></li>
              <li><a href="#" className="hover:text-white transition-colors">家族・子育て</a></li>
              <li><a href="#" className="hover:text-white transition-colors">日常の気づき</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">お問い合わせ</h3>
            <ul className="space-y-2" style={{color: 'rgba(255, 255, 255, 0.7)'}}>
              <li><a href="#" className="hover:text-white transition-colors">Twitter</a></li>
              <li><a href="#" className="hover:text-white transition-colors">GitHub</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Email</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t mt-8 pt-8 text-center" style={{borderColor: 'rgba(255, 255, 255, 0.2)', color: 'rgba(255, 255, 255, 0.7)'}}>
          <p>&copy; 2024 Hirolog. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}