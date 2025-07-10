import { client } from './sanity'
import type { BlogPost } from './sanity'

// 関連記事を取得する関数
export async function getRelatedPosts(
  currentPostId: string, 
  categories: string[] = [], 
  limit: number = 3
): Promise<BlogPost[]> {
  try {
    // カテゴリベースの関連記事検索（優先）
    if (categories && categories.length > 0) {
      const categoryQuery = `*[
        _type == "post" && 
        !(_id in path("drafts.**")) && 
        _id != $currentId && 
        count(categories[@ in $categories]) > 0
      ] | order(publishedAt desc) [0...$limit] {
        _id,
        _createdAt,
        title,
        slug,
        mainImage,
        heroImage,
        sectionImages,
        body,
        excerpt,
        publishedAt,
        categories,
        author->{
          name,
          image
        }
      }`
      
      const relatedByCategory = await client.fetch(categoryQuery, {
        currentId: currentPostId,
        categories,
        limit
      })
      
      if (relatedByCategory.length >= limit) {
        return relatedByCategory
      }
      
      // 不足分を最新記事で補完
      const remainingLimit = limit - relatedByCategory.length
      const recentQuery = `*[
        _type == "post" && 
        !(_id in path("drafts.**")) && 
        _id != $currentId &&
        !(_id in $excludeIds)
      ] | order(publishedAt desc) [0...$remainingLimit] {
        _id,
        _createdAt,
        title,
        slug,
        mainImage,
        heroImage,
        sectionImages,
        body,
        excerpt,
        publishedAt,
        categories,
        author->{
          name,
          image
        }
      }`
      
      const recentPosts = await client.fetch(recentQuery, {
        currentId: currentPostId,
        excludeIds: relatedByCategory.map((post: BlogPost) => post._id),
        remainingLimit
      })
      
      return [...relatedByCategory, ...recentPosts]
    }
    
    // カテゴリがない場合は最新記事を返す
    const recentQuery = `*[
      _type == "post" && 
      !(_id in path("drafts.**")) && 
      _id != $currentId
    ] | order(publishedAt desc) [0...$limit] {
      _id,
      _createdAt,
      title,
      slug,
      mainImage,
      heroImage,
      sectionImages,
      body,
      excerpt,
      publishedAt,
      categories,
      author->{
        name,
        image
      }
    }`
    
    return await client.fetch(recentQuery, { currentId: currentPostId, limit })
    
  } catch (error) {
    console.error('Error fetching related posts:', error)
    return []
  }
}

// 関連記事のキーワード抽出（タイトルベース）
export function extractKeywords(title: string): string[] {
  // 日本語での一般的なストップワード
  const stopWords = [
    'の', 'に', 'は', 'を', 'が', 'で', 'と', 'から', 'まで', 'より',
    'こと', 'もの', 'これ', 'それ', 'あれ', 'この', 'その', 'あの',
    '方法', '話', '話題', '記事', 'ブログ', '今回'
  ]
  
  // タイトルから単語を抽出（簡易版）
  const words = title
    .replace(/[！？。、～〜]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 1 && !stopWords.includes(word))
    .slice(0, 5) // 最大5つのキーワード
  
  return words
}