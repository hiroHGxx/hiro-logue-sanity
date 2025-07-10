import { NextRequest, NextResponse } from 'next/server'

/**
 * 記事内容からStable Diffusion用プロンプトを自動生成するAPI
 * ContentFlow自動画像生成システム - Phase A
 */

interface ImagePromptRequest {
  title: string
  content: string
  categories?: string[]
  style?: 'hirolog' | 'professional' | 'minimalist'
}

interface ImagePrompt {
  name: string
  prompt: string
  negative_prompt: string
  filename_prefix: string
  description: string
}

interface ImagePromptResponse {
  success: boolean
  prompts: ImagePrompt[]
  article_info: {
    title: string
    estimated_scenes: number
    style: string
    theme: string
  }
}

// ブランドスタイル定義
const BRAND_STYLES = {
  hirolog: {
    base: "warm lighting, cozy atmosphere, family-friendly, japanese minimalist style, soft colors, peaceful mood",
    color_palette: "#8B4513, #CD853F, #D2691E, #FDF5E6",
    mood: "contemplative, heartwarming, daily life"
  },
  professional: {
    base: "professional photography, clean composition, modern design, high quality",
    color_palette: "#2D3748, #4A5568, #3182CE, #F7FAFC",
    mood: "confident, sophisticated, business"
  },
  minimalist: {
    base: "minimalist design, clean lines, simple composition, elegant",
    color_palette: "#000000, #FFFFFF, #F5F5F5, #E5E5E5",
    mood: "clean, simple, focused"
  }
}

// 共通ネガティブプロンプト
const COMMON_NEGATIVE = "blurry, lowres, bad anatomy, saturated colors, extra fingers, bad hands, malformed limbs, chaotic background, watermark, signature, text overlay"

/**
 * 記事内容を分析してテーマとキーワードを抽出
 */
function analyzeArticleContent(title: string, content: string): {
  theme: string
  keywords: string[]
  mood: string
  scenes: string[]
} {
  const lowerTitle = title.toLowerCase()
  const lowerContent = content.toLowerCase()
  
  // テーマ分析
  let theme = "general"
  let mood = "neutral"
  let scenes: string[] = []
  
  // AI・技術系テーマ
  if (lowerTitle.includes('ai') || lowerContent.includes('ai') || 
      lowerTitle.includes('技術') || lowerContent.includes('プログラミング')) {
    theme = "technology"
    mood = "innovative"
    scenes = [
      "modern technology workspace with AI elements",
      "person using advanced technology thoughtfully",
      "digital innovation meeting human creativity",
      "balanced tech-life integration"
    ]
  }
  // 家族・日常系テーマ
  else if (lowerTitle.includes('家族') || lowerContent.includes('子ども') ||
           lowerTitle.includes('暮らし') || lowerContent.includes('日常')) {
    theme = "family_life"
    mood = "heartwarming"
    scenes = [
      "warm family moment at home",
      "peaceful daily life scene",
      "parent and children interaction",
      "cozy home environment"
    ]
  }
  // 仕事・効率系テーマ
  else if (lowerTitle.includes('仕事') || lowerContent.includes('効率') ||
           lowerTitle.includes('時間') || lowerContent.includes('余白')) {
    theme = "work_life_balance"
    mood = "contemplative"
    scenes = [
      "organized workspace with natural elements",
      "person taking a mindful break",
      "balanced work and life representation",
      "calm productivity environment"
    ]
  }
  // 学び・成長系テーマ
  else if (lowerTitle.includes('学び') || lowerContent.includes('成長') ||
           lowerTitle.includes('挑戦') || lowerContent.includes('経験')) {
    theme = "learning_growth"
    mood = "inspiring"
    scenes = [
      "person reading or studying peacefully",
      "growth and learning visualization",
      "new challenge or opportunity",
      "wisdom and experience representation"
    ]
  }
  
  // キーワード抽出（簡易版）
  const keywords = [
    ...lowerTitle.split(/[\s\-・]+/).filter(word => word.length > 1),
    theme, mood
  ]
  
  return { theme, keywords, mood, scenes }
}

/**
 * 分析結果からStable Diffusion用プロンプトを生成
 */
function generatePromptsFromAnalysis(
  analysis: ReturnType<typeof analyzeArticleContent>,
  style: keyof typeof BRAND_STYLES,
  title: string
): ImagePrompt[] {
  const brandStyle = BRAND_STYLES[style]
  const { theme, scenes, mood } = analysis
  
  const prompts: ImagePrompt[] = []
  
  // ヒーロー画像（記事のメイン画像）
  prompts.push({
    name: "hero",
    prompt: `${scenes[0] || "peaceful scene"}, ${brandStyle.base}, ${mood} atmosphere, cinematic lighting, high quality, professional photography, 16:9 aspect ratio`,
    negative_prompt: COMMON_NEGATIVE,
    filename_prefix: `${theme}-hero`,
    description: "記事のメイン画像（ヒーロー画像）"
  })
  
  // セクション画像1（問題提起・課題）
  prompts.push({
    name: "section1",
    prompt: `${scenes[1] || "thoughtful moment"}, ${brandStyle.base}, subtle concern or challenge, soft lighting, ${mood} mood, clean composition`,
    negative_prompt: COMMON_NEGATIVE,
    filename_prefix: `${theme}-section1`,
    description: "問題提起・課題を表現する画像"
  })
  
  // セクション画像2（解決・洞察）
  prompts.push({
    name: "section2",
    prompt: `${scenes[2] || "moment of realization"}, ${brandStyle.base}, positive insight, warm lighting, hopeful ${mood} atmosphere, inspiring composition`,
    negative_prompt: COMMON_NEGATIVE,
    filename_prefix: `${theme}-section2`,
    description: "解決策・洞察を表現する画像"
  })
  
  // セクション画像3（まとめ・未来）
  prompts.push({
    name: "section3",
    prompt: `${scenes[3] || "peaceful conclusion"}, ${brandStyle.base}, harmonious conclusion, golden hour lighting, ${mood} satisfaction, balanced composition`,
    negative_prompt: COMMON_NEGATIVE,
    filename_prefix: `${theme}-section3`,
    description: "まとめ・未来への展望を表現する画像"
  })
  
  return prompts
}

export async function POST(request: NextRequest) {
  try {
    const body: ImagePromptRequest = await request.json()
    
    if (!body.title || !body.content) {
      return NextResponse.json(
        { success: false, error: 'タイトルと内容は必須です' },
        { status: 400 }
      )
    }
    
    // デフォルトスタイルの設定
    const style = body.style || 'hirolog'
    
    // 記事内容を分析
    console.log('📝 記事内容分析開始...')
    const analysis = analyzeArticleContent(body.title, body.content)
    console.log('✅ 分析完了:', { theme: analysis.theme, mood: analysis.mood })
    
    // プロンプト生成
    console.log('🎨 プロンプト生成開始...')
    const prompts = generatePromptsFromAnalysis(analysis, style, body.title)
    console.log(`✅ ${prompts.length}個のプロンプト生成完了`)
    
    // レスポンス作成
    const response: ImagePromptResponse = {
      success: true,
      prompts,
      article_info: {
        title: body.title,
        estimated_scenes: prompts.length,
        style,
        theme: analysis.theme
      }
    }
    
    console.log('🎉 プロンプト自動生成API完了')
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('❌ プロンプト生成エラー:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'プロンプト生成中にエラーが発生しました',
        details: error instanceof Error ? error.message : '不明なエラー'
      },
      { status: 500 }
    )
  }
}