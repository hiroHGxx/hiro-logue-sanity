const { deletePost } = require('./lib/sanity-mutations.ts')

// 重複記事の削除スクリプト
async function deleteDuplicateArticles() {
  console.log('🚀 重複記事削除スクリプト開始...')
  
  // 削除対象のドキュメントID
  const duplicateIds = [
    'B23yufD62yhoU0aT5pcAsC',  // input-1 記事（古い方）
    'drafts.sOY5WwoEBY24iuIm0D221W'  // ドラフト記事
  ]
  
  console.log('📋 削除対象記事:')
  console.log('- B23yufD62yhoU0aT5pcAsC (input-1)')
  console.log('- drafts.sOY5WwoEBY24iuIm0D221W (ドラフト)')
  
  for (const id of duplicateIds) {
    try {
      console.log(`\n🗑️  削除中: ${id}`)
      await deletePost(id)
      console.log(`✅ 削除完了: ${id}`)
    } catch (error) {
      console.error(`❌ 削除エラー (${id}):`, error.message)
    }
  }
  
  console.log('\n🎉 重複記事削除処理が完了しました！')
  console.log('📊 残存記事の確認をお勧めします。')
}

// スクリプト実行
deleteDuplicateArticles().catch(console.error)