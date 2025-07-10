import { NextRequest, NextResponse } from 'next/server'
import { sanityImageUploader } from '@/lib/sanity-image-upload'
import { logToContentFlow, logSessionComplete, logError } from '@/lib/logger'

export async function POST(request: NextRequest) {
  let sessionId = 'unknown'
  
  try {
    const { articleId, outputDir, sessionId: reqSessionId } = await request.json()
    sessionId = reqSessionId || `integration_${articleId}`

    if (!articleId || !outputDir) {
      await logError(sessionId, 'sanity-integration', 'next-api', 
        new Error('articleId and outputDir are required'), { articleId, outputDir })
      return NextResponse.json(
        { error: 'articleId and outputDir are required' },
        { status: 400 }
      )
    }

    console.log(`🔄 API: Starting Sanity integration for article: ${articleId}`)
    console.log(`📂 API: Output directory: ${outputDir}`)

    await logToContentFlow({
      level: 'INFO',
      source: 'next-api',
      sessionId,
      phase: 'sanity-integration',
      action: 'start',
      message: `Sanity統合API開始: ${articleId}`,
      data: { articleId, outputDir }
    })

    const startTime = Date.now()
    const result = await sanityImageUploader.processImageIntegration(
      outputDir,
      articleId,
      articleId
    )
    const integrationDuration = (Date.now() - startTime) / 1000

    console.log('✅ API: Sanity integration completed successfully')
    console.log('📊 API: Integration result details:', {
      articleId: result.articleId,
      heroImage: !!result.heroImage,
      sectionImagesCount: result.sectionImages.length,
      uploadedImagesCount: result.uploadResults.length,
      heroImageId: result.heroImage?._id,
      sectionImageIds: result.sectionImages.map(img => img._id)
    })

    // 統合後の記事確認
    const { client } = await import('@/lib/sanity')
    const updatedArticle = await client.fetch(
      `*[_type == "post" && _id == $articleId][0]{
        _id, title, heroImage, sectionImages
      }`,
      { articleId }
    )
    console.log('📝 API: Updated article check:', updatedArticle)

    // セッション完了ログ
    await logSessionComplete(sessionId, {
      articleId: result.articleId,
      title: updatedArticle?.title,
      uploadedImages: result.uploadResults.length,
      heroImage: !!result.heroImage,
      sectionImages: result.sectionImages.length,
      duration: integrationDuration
    })

    return NextResponse.json({
      success: true,
      result: {
        articleId: result.articleId,
        heroImage: !!result.heroImage,
        sectionImagesCount: result.sectionImages.length,
        uploadedImagesCount: result.uploadResults.length,
        updatedArticle
      }
    })

  } catch (error) {
    console.error('❌ API: Sanity integration failed:', error)
    await logError(sessionId, 'sanity-integration', 'next-api', error as Error)
    return NextResponse.json(
      { error: 'Sanity integration failed', details: (error as Error).message },
      { status: 500 }
    )
  }
}