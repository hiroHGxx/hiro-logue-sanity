import { NextRequest, NextResponse } from 'next/server'
import { client } from '@/lib/sanity'

export async function POST(request: NextRequest) {
  try {
    const { articleId, removeHero, removeSectionIndexes } = await request.json()

    if (!articleId) {
      return NextResponse.json(
        { error: 'articleId is required' },
        { status: 400 }
      )
    }

    console.log(`🗑️ API: Removing images from article: ${articleId}`)
    console.log(`   - Remove Hero: ${removeHero}`)
    console.log(`   - Remove Section Indexes: ${removeSectionIndexes}`)

    // 現在の記事情報を取得
    const currentArticle = await client.fetch(
      `*[_type == "post" && _id == $articleId][0]{
        _id, title, heroImage, sectionImages
      }`,
      { articleId }
    )

    if (!currentArticle) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      )
    }

    const updatePatch: any = {}

    // Hero画像削除
    if (removeHero) {
      updatePatch.heroImage = null
    }

    // セクション画像削除
    if (removeSectionIndexes && Array.isArray(removeSectionIndexes) && removeSectionIndexes.length > 0) {
      const currentSectionImages = currentArticle.sectionImages || []
      const filteredSectionImages = currentSectionImages.filter(
        (image: any, index: number) => !removeSectionIndexes.includes(index)
      )
      updatePatch.sectionImages = filteredSectionImages
    }

    // 記事更新実行
    if (Object.keys(updatePatch).length > 0) {
      await client
        .patch(articleId)
        .set(updatePatch)
        .commit()

      console.log(`✅ Images removed successfully from article: ${articleId}`)
    } else {
      console.log(`⚠️ No images to remove for article: ${articleId}`)
    }

    // 更新後の記事確認
    const updatedArticle = await client.fetch(
      `*[_type == "post" && _id == $articleId][0]{
        _id, title, heroImage, sectionImages
      }`,
      { articleId }
    )

    return NextResponse.json({
      success: true,
      result: {
        articleId,
        removedHero: removeHero,
        removedSectionIndexes: removeSectionIndexes,
        updatedArticle
      }
    })

  } catch (error) {
    console.error('❌ API: Failed to remove images:', error)
    return NextResponse.json(
      { error: 'Failed to remove images', details: (error as Error).message },
      { status: 500 }
    )
  }
}