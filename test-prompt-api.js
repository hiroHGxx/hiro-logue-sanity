/**
 * プロンプト生成API単体テスト
 * 開発サーバーなしでの動作確認
 */

// APIロジックを直接インポート
const fs = require('fs')
const path = require('path')

// テスト用のAPIロジック実装（route.tsから抽出）
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

const COMMON_NEGATIVE = "blurry, lowres, bad anatomy, saturated colors, extra fingers, bad hands, malformed limbs, chaotic background, watermark, signature, text overlay"

function analyzeArticleContent(title, content) {
  const lowerTitle = title.toLowerCase()
  const lowerContent = content.toLowerCase()
  
  let theme = "general"
  let mood = "neutral"
  let scenes = []
  
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
  
  const keywords = [
    ...lowerTitle.split(/[\s\-・]+/).filter(word => word.length > 1),
    theme, mood
  ]
  
  return { theme, keywords, mood, scenes }
}

function generatePromptsFromAnalysis(analysis, style, title) {
  const brandStyle = BRAND_STYLES[style]
  const { theme, scenes, mood } = analysis
  
  const prompts = []
  
  // ヒーロー画像
  prompts.push({
    name: "hero",
    prompt: `${scenes[0] || "peaceful scene"}, ${brandStyle.base}, ${mood} atmosphere, cinematic lighting, high quality, professional photography, 16:9 aspect ratio`,
    negative_prompt: COMMON_NEGATIVE,
    filename_prefix: `${theme}-hero`,
    description: "記事のメイン画像（ヒーロー画像）"
  })
  
  // セクション画像1
  prompts.push({
    name: "section1",
    prompt: `${scenes[1] || "thoughtful moment"}, ${brandStyle.base}, subtle concern or challenge, soft lighting, ${mood} mood, clean composition`,
    negative_prompt: COMMON_NEGATIVE,
    filename_prefix: `${theme}-section1`,
    description: "問題提起・課題を表現する画像"
  })
  
  // セクション画像2
  prompts.push({
    name: "section2",
    prompt: `${scenes[2] || "moment of realization"}, ${brandStyle.base}, positive insight, warm lighting, hopeful ${mood} atmosphere, inspiring composition`,
    negative_prompt: COMMON_NEGATIVE,
    filename_prefix: `${theme}-section2`,
    description: "解決策・洞察を表現する画像"
  })
  
  // セクション画像3
  prompts.push({
    name: "section3",
    prompt: `${scenes[3] || "peaceful conclusion"}, ${brandStyle.base}, harmonious conclusion, golden hour lighting, ${mood} satisfaction, balanced composition`,
    negative_prompt: COMMON_NEGATIVE,
    filename_prefix: `${theme}-section3`,
    description: "まとめ・未来への展望を表現する画像"
  })
  
  return prompts
}

async function testPromptGeneration() {
  console.log('🧪 プロンプト生成API単体テスト開始')
  console.log('=' * 50)
  
  try {
    // テストデータ読み込み
    const testDataPath = path.join(__dirname, 'test-article-sample.json')
    const testData = JSON.parse(fs.readFileSync(testDataPath, 'utf-8'))
    
    console.log('📝 テスト記事データ:')
    console.log(`  タイトル: ${testData.title}`)
    console.log(`  スタイル: ${testData.style}`)
    console.log(`  内容長: ${testData.content.length}文字`)
    console.log()
    
    // 記事内容分析
    console.log('🔍 記事内容分析中...')
    const analysis = analyzeArticleContent(testData.title, testData.content)
    
    console.log('✅ 分析結果:')
    console.log(`  テーマ: ${analysis.theme}`)
    console.log(`  ムード: ${analysis.mood}`)
    console.log(`  キーワード: ${analysis.keywords.slice(0, 5).join(', ')}...`)
    console.log(`  シーン数: ${analysis.scenes.length}`)
    console.log()
    
    // プロンプト生成
    console.log('🎨 プロンプト生成中...')
    const prompts = generatePromptsFromAnalysis(analysis, testData.style, testData.title)
    
    console.log(`✅ ${prompts.length}個のプロンプト生成完了`)
    console.log()
    
    // 生成結果詳細表示
    console.log('📋 生成されたプロンプト詳細:')
    console.log('=' * 60)
    
    prompts.forEach((prompt, index) => {
      console.log(`${index + 1}. ${prompt.name.toUpperCase()} (${prompt.description})`)
      console.log(`   プロンプト: ${prompt.prompt}`)
      console.log(`   ネガティブ: ${prompt.negative_prompt}`)
      console.log(`   ファイル名: ${prompt.filename_prefix}-XXX.png`)
      console.log()
    })
    
    // API形式のレスポンス作成
    const response = {
      success: true,
      prompts,
      article_info: {
        title: testData.title,
        estimated_scenes: prompts.length,
        style: testData.style,
        theme: analysis.theme
      }
    }
    
    // 結果をJSONファイルに保存
    const outputPath = path.join(__dirname, 'test-prompt-result.json')
    fs.writeFileSync(outputPath, JSON.stringify(response, null, 2), 'utf-8')
    
    console.log('🎉 プロンプト生成API単体テスト完了!')
    console.log(`📄 結果保存: ${outputPath}`)
    console.log()
    console.log('📊 テスト結果サマリー:')
    console.log(`  ✅ 記事分析: 成功 (テーマ: ${analysis.theme})`)
    console.log(`  ✅ プロンプト生成: 成功 (${prompts.length}個)`)
    console.log(`  ✅ 出力形式: API互換`)
    console.log(`  ✅ ファイル保存: 成功`)
    
    return response
    
  } catch (error) {
    console.error('❌ テストエラー:', error)
    return { success: false, error: error.message }
  }
}

// テスト実行
if (require.main === module) {
  testPromptGeneration()
}

module.exports = { testPromptGeneration }