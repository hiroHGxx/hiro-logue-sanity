import { NextRequest, NextResponse } from 'next/server'

// 記事品質チェック API
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, content, excerpt } = body

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      )
    }

    // 品質チェック実行
    const qualityScore = await checkArticleQuality(title, content, excerpt)

    return NextResponse.json({
      success: true,
      qualityScore,
      message: qualityScore.passed ? 
        '記事品質チェックに合格しました' : 
        '記事品質に改善が必要です'
    })

  } catch (error) {
    console.error('Error in quality check:', error)
    return NextResponse.json(
      { error: 'Failed to check article quality' },
      { status: 500 }
    )
  }
}

// 記事品質チェック関数
async function checkArticleQuality(title: string, content: string, excerpt?: string) {
  const checks = {
    titleQuality: checkTitleQuality(title),
    contentStructure: checkContentStructure(content),
    hiroLogueStyle: checkHiroLogueStyle(content),
    readerEngagement: checkReaderEngagement(content),
    audioBroadcastRemoval: checkAudioBroadcastRemoval(content),
    lengthOptimization: checkLengthOptimization(content)
  }

  const totalScore = Object.values(checks).reduce((sum, check) => sum + check.score, 0)
  const maxScore = Object.keys(checks).length * 100
  const averageScore = Math.round(totalScore / Object.keys(checks).length)

  return {
    passed: averageScore >= 80,
    overallScore: averageScore,
    maxScore: 100,
    checks,
    recommendations: generateRecommendations(checks)
  }
}

// 1. タイトル品質チェック
function checkTitleQuality(title: string) {
  const attractivePatterns = [
    /意外な方法/, /〜のススメ/, /〜のコツ/, /〜のヒント/,
    /新しい/, /実践した/, /見つけた/, /発見/,
    /プログラマー/, /40代/, /パパ/, /父親/
  ]
  
  const hasAttractivePattern = attractivePatterns.some(pattern => pattern.test(title))
  const hasProperLength = title.length >= 15 && title.length <= 50
  const hasSpecificWords = /〜|「|」/.test(title)
  
  let score = 0
  const details = []
  
  if (hasAttractivePattern) {
    score += 40
    details.push('✅ 魅力的なタイトルパターン使用')
  } else {
    details.push('❌ 魅力的なタイトルパターンが不足')
  }
  
  if (hasProperLength) {
    score += 30
    details.push('✅ 適切なタイトル長')
  } else {
    details.push('❌ タイトルが短すぎる/長すぎる')
  }
  
  if (hasSpecificWords) {
    score += 30
    details.push('✅ 具体的な表現使用')
  } else {
    details.push('❌ 具体的な表現が不足')
  }
  
  return { score, details, passed: score >= 80 }
}

// 2. コンテンツ構造チェック
function checkContentStructure(content: string) {
  const hasIntroduction = /## はじめに/.test(content)
  const hasMainContent = /## [^はおわ]/.test(content)
  const hasConclusion = /## おわりに/.test(content)
  const hasProperSections = content.split('##').length >= 3
  
  let score = 0
  const details = []
  
  if (hasIntroduction) {
    score += 25
    details.push('✅ はじめにセクション存在')
  } else {
    details.push('❌ はじめにセクションが不足')
  }
  
  if (hasMainContent) {
    score += 25
    details.push('✅ 本文セクション存在')
  } else {
    details.push('❌ 本文セクションが不足')
  }
  
  if (hasConclusion) {
    score += 25
    details.push('✅ おわりにセクション存在')
  } else {
    details.push('❌ おわりにセクションが不足')
  }
  
  if (hasProperSections) {
    score += 25
    details.push('✅ 適切なセクション分割')
  } else {
    details.push('❌ セクション分割が不十分')
  }
  
  return { score, details, passed: score >= 80 }
}

// 3. Hiro-Logueスタイルチェック
function checkHiroLogueStyle(content: string) {
  const hiroLoguePatterns = [
    /実は先日/, /ということで/, /そんな中ですね/,
    /考えてみると/, /でも、なんというか/, /例えばですね/,
    /さすがだなと思いました/, /改めて〜を感じました/,
    /皆さんも/, /〜と思います/, /〜な気がします/
  ]
  
  const familyReferences = [
    /妻/, /子ども/, /息子/, /娘/, /家族/, /ペット/
  ]
  
  const hiroLogueCount = hiroLoguePatterns.filter(pattern => pattern.test(content)).length
  const familyCount = familyReferences.filter(pattern => pattern.test(content)).length
  
  let score = 0
  const details = []
  
  if (hiroLogueCount >= 3) {
    score += 50
    details.push(`✅ Hiro-Logueスタイル表現 ${hiroLogueCount}個使用`)
  } else {
    details.push(`❌ Hiro-Logueスタイル表現が不足 (${hiroLogueCount}個)`)
  }
  
  if (familyCount >= 1) {
    score += 50
    details.push(`✅ 家族関連表現 ${familyCount}個使用`)
  } else {
    details.push('❌ 家族関連表現が不足')
  }
  
  return { score, details, passed: score >= 80 }
}

// 4. 読者エンゲージメントチェック
function checkReaderEngagement(content: string) {
  const questionPatterns = [
    /皆さんは/, /〜はありませんか/, /〜でしょうか/,
    /どうでしょうか/, /コメントで/, /教えてください/
  ]
  
  const questionCount = questionPatterns.filter(pattern => pattern.test(content)).length
  const hasCommentInvitation = /コメントで|教えてください/.test(content)
  
  let score = 0
  const details = []
  
  if (questionCount >= 2) {
    score += 60
    details.push(`✅ 読者への問いかけ ${questionCount}個`)
  } else {
    details.push(`❌ 読者への問いかけが不足 (${questionCount}個)`)
  }
  
  if (hasCommentInvitation) {
    score += 40
    details.push('✅ コメント誘導あり')
  } else {
    details.push('❌ コメント誘導が不足')
  }
  
  return { score, details, passed: score >= 80 }
}

// 5. 音声配信表現除去チェック
function checkAudioBroadcastRemoval(content: string) {
  const forbiddenPatterns = [
    /お話しました/, /お話ししていきます/, /配信/, /今回の配信/,
    /stand\.fm/, /音声/, /聞いて/, /雑談ですが/,
    /では今回の配信は以上/
  ]
  
  const foundForbidden = forbiddenPatterns.filter(pattern => pattern.test(content))
  const score = foundForbidden.length === 0 ? 100 : Math.max(0, 100 - (foundForbidden.length * 25))
  
  const details = foundForbidden.length === 0 ? 
    ['✅ 音声配信的表現なし'] : 
    foundForbidden.map(pattern => `❌ 音声配信的表現発見: ${pattern}`)
  
  return { score, details, passed: score >= 80 }
}

// 6. 文章長最適化チェック
function checkLengthOptimization(content: string) {
  const wordCount = content.length
  const paragraphCount = content.split('\n\n').length
  const averageParagraphLength = wordCount / paragraphCount
  
  let score = 0
  const details = []
  
  if (wordCount >= 800 && wordCount <= 1500) {
    score += 40
    details.push(`✅ 適切な文字数 (${wordCount}文字)`)
  } else {
    details.push(`❌ 文字数が不適切 (${wordCount}文字)`)
  }
  
  if (paragraphCount >= 8) {
    score += 30
    details.push(`✅ 適切な段落数 (${paragraphCount}段落)`)
  } else {
    details.push(`❌ 段落数が不足 (${paragraphCount}段落)`)
  }
  
  if (averageParagraphLength >= 50 && averageParagraphLength <= 150) {
    score += 30
    details.push('✅ 適切な段落長')
  } else {
    details.push('❌ 段落長が不適切')
  }
  
  return { score, details, passed: score >= 80 }
}

// 改善提案生成
function generateRecommendations(checks: any) {
  const recommendations = []
  
  if (!checks.titleQuality.passed) {
    recommendations.push('タイトルに「〜の意外な方法」「〜のススメ」等の魅力的パターンを使用')
  }
  
  if (!checks.contentStructure.passed) {
    recommendations.push('「はじめに」「本文」「おわりに」の3セクション構成を実装')
  }
  
  if (!checks.hiroLogueStyle.passed) {
    recommendations.push('「実は先日」「考えてみると」等のHiro-Logueスタイル表現を増加')
  }
  
  if (!checks.readerEngagement.passed) {
    recommendations.push('「皆さんはどうでしょうか？」等の読者への問いかけを増加')
  }
  
  if (!checks.audioBroadcastRemoval.passed) {
    recommendations.push('「お話し」→「書く」、「配信」→「記事」に変更')
  }
  
  if (!checks.lengthOptimization.passed) {
    recommendations.push('文字数800-1500文字、段落数8個以上に調整')
  }
  
  return recommendations
}