/**
 * タイムスタンプ問題デバッグ用スクリプト
 * 全記事ファイルの詳細情報を表示し、ファイル選択ロジックの問題を特定する
 */

const fs = require('fs').promises;
const path = require('path');

const ARTICLES_DIR = path.join(__dirname, '..', 'articles');

/**
 * 全記事ファイルの詳細情報を表示
 */
async function debugFileSelection() {
  try {
    console.log('🔍 デバッグ: 全記事ファイル詳細分析開始\n');
    
    const files = await fs.readdir(ARTICLES_DIR);
    const articleFiles = files.filter(file => 
      file.startsWith('article-') && 
      file.endsWith('.json') && 
      !file.includes('-status') && 
      !file.includes('-uploaded')
    );

    if (articleFiles.length === 0) {
      console.log('❌ 対象記事ファイルが見つかりません');
      return;
    }

    console.log(`📊 対象ファイル数: ${articleFiles.length}件\n`);

    const fileDetails = [];

    for (const file of articleFiles) {
      const filePath = path.join(ARTICLES_DIR, file);
      try {
        const stats = await fs.stat(filePath);
        const rawData = await fs.readFile(filePath, 'utf-8');
        const data = JSON.parse(rawData);

        const detail = {
          filename: file,
          fileCreateTime: stats.birthtime,
          fileModifyTime: stats.mtime,
          metadataCreatedAt: data.metadata?.createdAt || 'なし',
          articleTitle: data.article?.title || data.title || 'なし',
          hasCorrectFormat: !!(data.metadata && data.article && data.article.title),
          finalTimestamp: data.metadata?.createdAt || stats.mtime.toISOString(),
          parsedDate: new Date(data.metadata?.createdAt || stats.mtime.toISOString())
        };

        fileDetails.push(detail);

        console.log(`📄 ${file}`);
        console.log(`  📅 ファイル作成日時: ${stats.birthtime}`);
        console.log(`  📅 ファイル更新日時: ${stats.mtime}`);
        console.log(`  📅 メタデータ作成日時: ${detail.metadataCreatedAt}`);
        console.log(`  📅 最終使用タイムスタンプ: ${detail.finalTimestamp}`);
        console.log(`  📝 記事タイトル: ${detail.articleTitle}`);
        console.log(`  ✅ 正しい形式: ${detail.hasCorrectFormat ? 'Yes' : 'No'}`);
        console.log(`  🔢 パースされた日付: ${detail.parsedDate}`);
        console.log('');
      } catch (error) {
        console.log(`❌ ${file}: エラー - ${error.message}\n`);
      }
    }

    console.log('=' .repeat(60));
    console.log('📋 ソート結果シミュレーション\n');

    // 正しい形式のファイルのみフィルタリング
    const validFiles = fileDetails.filter(file => file.hasCorrectFormat);
    
    if (validFiles.length === 0) {
      console.log('❌ 有効なファイルが見つかりません');
      return;
    }

    // タイムスタンプでソート（現在のロジック）
    validFiles.sort((a, b) => new Date(b.finalTimestamp) - new Date(a.finalTimestamp));

    console.log('🎯 現在のロジックによる選択順序:');
    validFiles.forEach((file, index) => {
      const marker = index === 0 ? '👑 [選択される]' : `${index + 1}.`;
      console.log(`${marker} ${file.filename}`);
      console.log(`     タイムスタンプ: ${file.finalTimestamp}`);
      console.log(`     記事タイトル: ${file.articleTitle}`);
      console.log('');
    });

    console.log('=' .repeat(60));
    console.log('⚠️ タイムスタンプ形式検証\n');

    const timestampFormats = validFiles.map(file => ({
      filename: file.filename,
      timestamp: file.finalTimestamp,
      isValidDate: !isNaN(new Date(file.finalTimestamp).getTime()),
      dateSource: file.metadataCreatedAt !== 'なし' ? 'metadata' : 'file_stats'
    }));

    timestampFormats.forEach(format => {
      console.log(`📄 ${format.filename}`);
      console.log(`  タイムスタンプ: ${format.timestamp}`);
      console.log(`  有効な日付: ${format.isValidDate ? 'Yes' : 'No'}`);
      console.log(`  データソース: ${format.dateSource}`);
      console.log('');
    });

    // 問題特定の提案
    console.log('=' .repeat(60));
    console.log('💡 問題分析・推奨解決策\n');

    const metadataCount = timestampFormats.filter(f => f.dateSource === 'metadata').length;
    const fileStatsCount = timestampFormats.filter(f => f.dateSource === 'file_stats').length;

    console.log(`📊 タイムスタンプソース分析:`);
    console.log(`  - メタデータ由来: ${metadataCount}件`);
    console.log(`  - ファイル統計由来: ${fileStatsCount}件`);
    console.log('');

    if (metadataCount > 0 && fileStatsCount > 0) {
      console.log('⚠️ 混在問題検出: 異なるソースのタイムスタンプが混在しています');
      console.log('📋 推奨対策:');
      console.log('  1. ユーザー確認プロンプトの追加');
      console.log('  2. 候補ファイル一覧表示');
      console.log('  3. タイムスタンプ統一性チェック');
      console.log('');
    }

    const selectedFile = validFiles[0];
    console.log(`🎯 現在選択されるファイル: ${selectedFile.filename}`);
    console.log(`📅 選択ファイルのタイムスタンプ: ${selectedFile.finalTimestamp}`);
    console.log(`📝 選択ファイルのタイトル: ${selectedFile.articleTitle}`);

  } catch (error) {
    console.error(`❌ デバッグエラー: ${error.message}`);
  }
}

/**
 * タイムスタンプ統一性チェック
 */
function validateTimestampConsistency(articleFiles) {
  const formats = articleFiles.map(file => {
    const date = new Date(file.createdAt);
    return {
      file: file.file,
      isValid: !isNaN(date.getTime()),
      format: file.createdAt,
      parsedDate: date
    };
  });
  
  console.log('📅 タイムスタンプ検証結果:', formats);
  return formats;
}

// スクリプトを直接実行した場合
if (require.main === module) {
  debugFileSelection().catch(console.error);
}

module.exports = {
  debugFileSelection,
  validateTimestampConsistency
};