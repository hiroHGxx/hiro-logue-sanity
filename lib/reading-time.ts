// PortableText コンテンツから文字数を計算
export function calculateReadingTime(content: any[]): {
  minutes: number
  wordCount: number
  text: string
} {
  if (!content || !Array.isArray(content)) {
    return { minutes: 1, wordCount: 0, text: '1分で読めます' }
  }

  // PortableText の各ブロックから文字数を抽出
  const wordCount = content.reduce((count, block) => {
    if (block._type === 'block' && block.children) {
      return count + block.children.reduce((textCount: number, child: any) => {
        return textCount + (child.text?.length || 0)
      }, 0)
    }
    return count
  }, 0)

  // 日本語での読書速度（400-600文字/分、平均500文字/分）
  const wordsPerMinute = 500
  const minutes = Math.max(1, Math.ceil(wordCount / wordsPerMinute))

  // 読了時間のテキスト生成
  const text = minutes === 1 
    ? '1分で読めます'
    : `約${minutes}分で読めます`

  return { minutes, wordCount, text }
}

// 記事の読了時間データのみを提供
export function getReadingTimeData(content: any[]) {
  return calculateReadingTime(content)
}