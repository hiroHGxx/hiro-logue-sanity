import { NextResponse } from 'next/server'
import { deletePost } from '@/lib/sanity-mutations'

export async function POST() {
  try {
    console.log('🚀 重複記事削除API開始...')
    
    // 削除対象のドキュメントID
    const duplicateIds = [
      'B23yufD62yhoU0aT5pcAsC',  // input-1 記事（古い方）
      'drafts.sOY5WwoEBY24iuIm0D221W'  // ドラフト記事
    ]
    
    const results = []
    
    for (const id of duplicateIds) {
      try {
        console.log(`🗑️ 削除中: ${id}`)
        await deletePost(id)
        console.log(`✅ 削除完了: ${id}`)
        results.push({ id, status: 'success' })
      } catch (error) {
        console.error(`❌ 削除エラー (${id}):`, error)
        results.push({ 
          id, 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        })
      }
    }
    
    return NextResponse.json({
      success: true,
      message: '重複記事削除処理が完了しました',
      results
    })
    
  } catch (error) {
    console.error('❌ 削除処理エラー:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}