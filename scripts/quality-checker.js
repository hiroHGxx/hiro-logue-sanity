#!/usr/bin/env node
/**
 * ContentFlow V2 - 記事品質チェッカー
 * 既存のquality-check APIロジックをNode.jsから直接呼び出し可能にする
 */

/**
 * 記事品質チェック実行
 * @param {Object} articleData - 記事データ
 * @returns {Promise<Object>} - 品質チェック結果
 */
async function checkArticleQuality(articleData) {
  try {
    const { title, body, excerpt } = articleData;
    
    if (!title || !body) {
      throw new Error('Title and body are required for quality check');
    }
    
    console.log('🔍 記事品質チェック開始...');
    console.log(`📰 タイトル: ${title}`);
    console.log(`📏 文字数: ${body.length}文字`);
    
    const checks = {
      titleQuality: checkTitleQuality(title),
      contentStructure: checkContentStructure(body),
      hiroLogueStyle: checkHiroLogueStyle(body),
      readerEngagement: checkReaderEngagement(body),
      audioBroadcastRemoval: checkAudioBroadcastRemoval(body),
      lengthOptimization: checkLengthOptimization(body)
    };
    
    const totalScore = Object.values(checks).reduce((sum, check) => sum + check.score, 0);
    const averageScore = Math.round(totalScore / Object.keys(checks).length);
    
    const result = {
      passed: averageScore >= 80,
      overallScore: averageScore,
      maxScore: 100,
      checks,
      recommendations: generateRecommendations(checks)
    };
    
    console.log(`📊 総合スコア: ${result.overallScore}/100`);
    console.log(`🎯 品質チェック: ${result.passed ? '✅ 合格' : '❌ 不合格'}`);
    
    if (!result.passed) {
      console.log('\n💡 改善提案:');
      result.recommendations.forEach(rec => console.log(`  - ${rec}`));
    }
    
    return result;
    
  } catch (error) {
    console.error(`❌ 品質チェックエラー: ${error.message}`);
    throw error;
  }
}

/**
 * JSONファイルから記事品質をチェック
 * @param {string} filePath - JSONファイルパス
 * @returns {Promise<Object>} - 品質チェック結果
 */
async function checkArticleQualityFromFile(filePath) {
  const fs = require('fs').promises;
  
  try {
    console.log(`📄 ファイル読み込み: ${filePath}`);
    
    const rawData = await fs.readFile(filePath, 'utf-8');
    const fileData = JSON.parse(rawData);
    
    // ファイル構造に応じてデータ抽出
    let articleData;
    if (fileData.article) {
      // V2形式（metadata + article）
      articleData = fileData.article;
    } else {
      // 従来形式（直接プロパティ）
      articleData = fileData;
    }
    
    return await checkArticleQuality(articleData);
    
  } catch (error) {
    console.error(`❌ ファイル品質チェックエラー: ${error.message}`);
    throw error;
  }
}

// 以下、品質チェック関数群（API route.tsから移植）

function checkTitleQuality(title) {
  const attractivePatterns = [
    /意外な方法/, /〜のススメ/, /〜のコツ/, /〜のヒント/,
    /新しい/, /実践した/, /見つけた/, /発見/,
    /プログラマー/, /40代/, /パパ/, /父親/
  ];
  
  const hasAttractivePattern = attractivePatterns.some(pattern => pattern.test(title));
  const hasProperLength = title.length >= 15 && title.length <= 50;
  const hasSpecificWords = /〜|「|」/.test(title);
  
  let score = 0;
  const details = [];
  
  if (hasAttractivePattern) {
    score += 40;
    details.push('✅ 魅力的なタイトルパターン使用');
  } else {
    details.push('❌ 魅力的なタイトルパターンが不足');
  }
  
  if (hasProperLength) {
    score += 30;
    details.push('✅ 適切なタイトル長');
  } else {
    details.push('❌ タイトルが短すぎる/長すぎる');
  }
  
  if (hasSpecificWords) {
    score += 30;
    details.push('✅ 具体的な表現使用');
  } else {
    details.push('❌ 具体的な表現が不足');
  }
  
  return { score, details, passed: score >= 80 };
}

function checkContentStructure(content) {
  const hasIntroduction = /## はじめに/.test(content);
  const hasMainContent = /## [^はおわ]/.test(content);
  const hasConclusion = /## おわりに/.test(content);
  const hasProperSections = content.split('##').length >= 3;
  
  let score = 0;
  const details = [];
  
  if (hasIntroduction) {
    score += 25;
    details.push('✅ はじめにセクション存在');
  } else {
    details.push('❌ はじめにセクションが不足');
  }
  
  if (hasMainContent) {
    score += 25;
    details.push('✅ 本文セクション存在');
  } else {
    details.push('❌ 本文セクションが不足');
  }
  
  if (hasConclusion) {
    score += 25;
    details.push('✅ おわりにセクション存在');
  } else {
    details.push('❌ おわりにセクションが不足');
  }
  
  if (hasProperSections) {
    score += 25;
    details.push('✅ 適切なセクション分割');
  } else {
    details.push('❌ セクション分割が不十分');
  }
  
  return { score, details, passed: score >= 80 };
}

function checkHiroLogueStyle(content) {
  const hiroLoguePatterns = [
    /実は先日/, /ということで/, /そんな中ですね/,
    /考えてみると/, /でも、なんというか/, /例えばですね/,
    /さすがだなと思いました/, /改めて〜を感じました/,
    /皆さんも/, /〜と思います/, /〜な気がします/
  ];
  
  const familyReferences = [
    /妻/, /子ども/, /息子/, /娘/, /家族/, /ペット/
  ];
  
  const hiroLogueCount = hiroLoguePatterns.filter(pattern => pattern.test(content)).length;
  const familyCount = familyReferences.filter(pattern => pattern.test(content)).length;
  
  let score = 0;
  const details = [];
  
  if (hiroLogueCount >= 3) {
    score += 50;
    details.push(`✅ Hiro-Logueスタイル表現 ${hiroLogueCount}個使用`);
  } else {
    details.push(`❌ Hiro-Logueスタイル表現が不足 (${hiroLogueCount}個)`);
  }
  
  if (familyCount >= 1) {
    score += 50;
    details.push(`✅ 家族関連表現 ${familyCount}個使用`);
  } else {
    details.push('❌ 家族関連表現が不足');
  }
  
  return { score, details, passed: score >= 80 };
}

function checkReaderEngagement(content) {
  const questionPatterns = [
    /皆さんは/, /〜はありませんか/, /〜でしょうか/,
    /どうでしょうか/, /コメントで/, /教えてください/
  ];
  
  const questionCount = questionPatterns.filter(pattern => pattern.test(content)).length;
  const hasCommentInvitation = /コメントで|教えてください/.test(content);
  
  let score = 0;
  const details = [];
  
  if (questionCount >= 2) {
    score += 60;
    details.push(`✅ 読者への問いかけ ${questionCount}個`);
  } else {
    details.push(`❌ 読者への問いかけが不足 (${questionCount}個)`);
  }
  
  if (hasCommentInvitation) {
    score += 40;
    details.push('✅ コメント誘導あり');
  } else {
    details.push('❌ コメント誘導が不足');
  }
  
  return { score, details, passed: score >= 80 };
}

function checkAudioBroadcastRemoval(content) {
  const forbiddenPatterns = [
    /お話しました/, /お話ししていきます/, /配信/, /今回の配信/,
    /stand\.fm/, /音声/, /聞いて/, /雑談ですが/,
    /では今回の配信は以上/
  ];
  
  const foundForbidden = forbiddenPatterns.filter(pattern => pattern.test(content));
  const score = foundForbidden.length === 0 ? 100 : Math.max(0, 100 - (foundForbidden.length * 25));
  
  const details = foundForbidden.length === 0 ? 
    ['✅ 音声配信的表現なし'] : 
    foundForbidden.map(pattern => `❌ 音声配信的表現発見: ${pattern}`);
  
  return { score, details, passed: score >= 80 };
}

function checkLengthOptimization(content) {
  const wordCount = content.length;
  const paragraphCount = content.split('\n\n').length;
  const averageParagraphLength = wordCount / paragraphCount;
  
  let score = 0;
  const details = [];
  
  // V2要件に合わせて文字数基準を調整（2000-2500文字）
  if (wordCount >= 2000 && wordCount <= 2500) {
    score += 40;
    details.push(`✅ 適切な文字数 (${wordCount}文字)`);
  } else if (wordCount >= 1500 && wordCount <= 3000) {
    score += 30;
    details.push(`⚠️ 許容範囲の文字数 (${wordCount}文字)`);
  } else {
    details.push(`❌ 文字数が不適切 (${wordCount}文字、推奨: 2000-2500文字)`);
  }
  
  if (paragraphCount >= 8) {
    score += 30;
    details.push(`✅ 適切な段落数 (${paragraphCount}段落)`);
  } else {
    details.push(`❌ 段落数が不足 (${paragraphCount}段落)`);
  }
  
  if (averageParagraphLength >= 50 && averageParagraphLength <= 200) {
    score += 30;
    details.push('✅ 適切な段落長');
  } else {
    details.push('❌ 段落長が不適切');
  }
  
  return { score, details, passed: score >= 80 };
}

function generateRecommendations(checks) {
  const recommendations = [];
  
  if (!checks.titleQuality.passed) {
    recommendations.push('タイトルに「〜の意外な方法」「〜のススメ」等の魅力的パターンを使用');
  }
  
  if (!checks.contentStructure.passed) {
    recommendations.push('「はじめに」「本文」「おわりに」の3セクション構成を実装');
  }
  
  if (!checks.hiroLogueStyle.passed) {
    recommendations.push('「実は先日」「考えてみると」等のHiro-Logueスタイル表現を増加');
  }
  
  if (!checks.readerEngagement.passed) {
    recommendations.push('「皆さんはどうでしょうか？」等の読者への問いかけを増加');
  }
  
  if (!checks.audioBroadcastRemoval.passed) {
    recommendations.push('「お話し」→「書く」、「配信」→「記事」に変更');
  }
  
  if (!checks.lengthOptimization.passed) {
    recommendations.push('文字数2000-2500文字、段落数8個以上に調整');
  }
  
  return recommendations;
}

/**
 * メイン実行（CLI使用時）
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('📄 ContentFlow V2 - 記事品質チェッカー');
    console.log('');
    console.log('使用方法:');
    console.log('  node scripts/quality-checker.js [JSONファイルパス]');
    console.log('');
    console.log('例:');
    console.log('  node scripts/quality-checker.js articles/article-20250711-160000.json');
    console.log('');
    process.exit(0);
  }
  
  const filePath = args[0];
  
  try {
    console.log('🔍 記事品質チェック開始');
    console.log(`🕐 開始時刻: ${new Date().toLocaleString()}`);
    
    const result = await checkArticleQualityFromFile(filePath);
    
    console.log('\n📊 品質チェック結果');
    console.log('='.repeat(50));
    console.log(`総合スコア: ${result.overallScore}/100 ${result.passed ? '✅' : '❌'}`);
    
    // 詳細結果表示
    Object.entries(result.checks).forEach(([category, check]) => {
      const status = check.passed ? '✅' : '❌';
      console.log(`\n${category}: ${check.score}/100 ${status}`);
      check.details.forEach(detail => console.log(`  ${detail}`));
    });
    
    if (result.recommendations.length > 0) {
      console.log('\n💡 改善提案:');
      result.recommendations.forEach(rec => console.log(`  - ${rec}`));
    }
    
    console.log('\n='.repeat(50));
    console.log(`🕐 完了時刻: ${new Date().toLocaleString()}`);
    
    process.exit(result.passed ? 0 : 1);
    
  } catch (error) {
    console.error('\n🚨 品質チェック失敗');
    console.error(`エラー: ${error.message}`);
    process.exit(1);
  }
}

// Node.js環境でのみ実行
if (require.main === module) {
  main();
}

module.exports = { 
  checkArticleQuality, 
  checkArticleQualityFromFile 
};