import { NextRequest, NextResponse } from 'next/server'
import AutoImageManager, { ImageGenerationConfig } from '@/lib/auto-image-manager'

/**
 * ContentFlow自動画像生成統合API
 * プロンプト生成 → 画像生成 → 結果返却の一気通貫処理
 */

interface AutoGenerateRequest {
  title: string
  content: string
  slug: string
  style?: 'hirolog' | 'professional' | 'minimalist'
  variations?: number
  testMode?: boolean
}

interface AutoGenerateResponse {
  success: boolean
  message: string
  data?: {
    prompts: any[]
    outputDir: string
    imageInfo: Array<{
      name: string
      files: Array<{
        filename: string
        relativePath: string
        size: number
      }>
    }>
    stats: {
      total_images: number
      successful_generations: number
      failed_generations: number
      total_time: number
    }
    article_info: {
      title: string
      estimated_scenes: number
      style: string
      theme: string
    }
  }
  error?: string
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const body: AutoGenerateRequest = await request.json()
    
    // 必須パラメータチェック
    if (!body.title || !body.content || !body.slug) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'タイトル、内容、スラッグは必須です',
          error: 'Missing required parameters' 
        } as AutoGenerateResponse,
        { status: 400 }
      )
    }

    console.log('🚀 ContentFlow自動画像生成API開始')
    console.log(`📝 記事: ${body.title}`)
    console.log(`🔗 スラッグ: ${body.slug}`)

    // Step 1: プロンプト自動生成
    console.log('📋 Step 1: プロンプト自動生成...')
    
    const promptResponse = await fetch(`${request.nextUrl.origin}/api/generate-image-prompts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: body.title,
        content: body.content,
        style: body.style || 'hirolog'
      })
    })

    if (!promptResponse.ok) {
      throw new Error(`プロンプト生成API失敗: ${promptResponse.status}`)
    }

    const promptData = await promptResponse.json()
    
    if (!promptData.success) {
      throw new Error(`プロンプト生成失敗: ${promptData.error}`)
    }

    console.log(`✅ ${promptData.prompts.length}個のプロンプト生成完了`)

    // Step 2: 画像生成設定準備
    console.log('🔧 Step 2: 画像生成設定準備...')
    
    const imageConfig: ImageGenerationConfig = {
      title: body.title,
      slug: body.slug,
      prompts: promptData.prompts,
      article_info: promptData.article_info
    }

    // Step 3: 自動画像生成実行
    console.log('🎨 Step 3: 自動画像生成実行...')
    
    const imageManager = new AutoImageManager()
    const generationResult = await imageManager.executeCompleteWorkflow(imageConfig, {
      variations: body.variations || 1,
      testMode: body.testMode || false
    })

    if (!generationResult.success) {
      throw new Error(`画像生成失敗: ${generationResult.error}`)
    }

    // Step 4: 結果整理・レスポンス作成
    console.log('📊 Step 4: 結果整理...')
    
    const totalTime = (Date.now() - startTime) / 1000
    const responseData: AutoGenerateResponse = {
      success: true,
      message: `自動画像生成完了！ ${generationResult.stats?.successful_generations || 0}枚の画像を生成しました`,
      data: {
        prompts: promptData.prompts,
        outputDir: generationResult.outputDir || '',
        imageInfo: generationResult.imageInfo || [],
        stats: {
          ...generationResult.stats,
          total_time: totalTime
        },
        article_info: promptData.article_info
      }
    }

    console.log('🎉 ContentFlow自動画像生成API完了!')
    console.log(`📊 統計:`)
    console.log(`  - 生成画像: ${generationResult.stats?.successful_generations || 0}枚`)
    console.log(`  - 処理時間: ${totalTime.toFixed(1)}秒`)
    console.log(`  - 出力先: ${generationResult.outputDir}`)

    return NextResponse.json(responseData)

  } catch (error) {
    const totalTime = (Date.now() - startTime) / 1000
    console.error('❌ 自動画像生成API エラー:', error)
    
    const errorResponse: AutoGenerateResponse = {
      success: false,
      message: '自動画像生成中にエラーが発生しました',
      error: error instanceof Error ? error.message : '不明なエラー'
    }

    return NextResponse.json(errorResponse, { status: 500 })
  }
}

// テスト用GET エンドポイント
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const test = searchParams.get('test')

  if (test === 'true') {
    // 簡単なテストレスポンス
    return NextResponse.json({
      success: true,
      message: 'ContentFlow自動画像生成API は正常に動作しています',
      endpoints: {
        'POST /api/auto-generate-images': '自動画像生成実行',
        'POST /api/generate-image-prompts': 'プロンプト生成のみ',
        'GET /api/auto-generate-images?test=true': 'API動作確認'
      },
      timestamp: new Date().toISOString()
    })
  }

  return NextResponse.json(
    { 
      success: false, 
      message: 'この API は POST メソッドのみ対応しています',
      hint: '?test=true でテストできます'
    }, 
    { status: 405 }
  )
}