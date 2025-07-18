/**
 * ファイル選択ロジックのテスト用スクリプト
 * 修正したファイル選択部分のみをテスト
 */

const fs = require('fs').promises;
const path = require('path');

const ARTICLES_DIR = path.join(__dirname, '..', 'articles');

class FileSelectionTester {
  
  /**
   * タイムスタンプ検証機能
   */
  validateTimestampConsistency(articleFiles) {
    console.log('\n📅 タイムスタンプ検証実行中...');
    
    const formats = articleFiles.map(file => {
      const date = new Date(file.createdAt);
      return {
        file: file.file,
        isValid: !isNaN(date.getTime()),
        format: file.createdAt,
        parsedDate: date
      };
    });
    
    const invalidFormats = formats.filter(f => !f.isValid);
    if (invalidFormats.length > 0) {
      console.warn('⚠️ 無効なタイムスタンプ発見:');
      invalidFormats.forEach(f => {
        console.warn(`  - ${f.file}: ${f.format}`);
      });
    }
    
    console.log(`✅ タイムスタンプ検証完了: ${formats.length}件中${formats.length - invalidFormats.length}件が有効`);
    return formats;
  }

  /**
   * 最新記事ファイル検索（修正版）
   */
  async findLatestArticleFile() {
    try {
      console.log('\n📄 最新記事JSONファイル検索中...');
      
      const files = await fs.readdir(ARTICLES_DIR);
      const articleFiles = files.filter(file => 
        file.startsWith('article-') && 
        file.endsWith('.json') && 
        !file.includes('-status') && 
        !file.includes('-uploaded')
      );

      if (articleFiles.length === 0) {
        throw new Error('記事JSONファイルが見つかりません。');
      }

      // 正しいタイムスタンプベースのソート
      const validArticleFiles = [];
      
      for (const file of articleFiles) {
        const filePath = path.join(ARTICLES_DIR, file);
        try {
          // ファイル内容を確認して、正しい形式のみ選択
          const rawData = await fs.readFile(filePath, 'utf-8');
          const data = JSON.parse(rawData);
          
          // 新しい形式（metadata + article + imagePrompts）のファイルのみ対象
          if (data.metadata && data.article && data.article.title) {
            const stats = await fs.stat(filePath);
            validArticleFiles.push({
              file,
              filePath,
              createdAt: data.metadata.createdAt || stats.mtime.toISOString(),
              mtime: stats.mtime,
              title: data.article.title
            });
          }
        } catch (error) {
          console.warn(`⚠️ ファイル ${file} をスキップ: ${error.message}`);
        }
      }

      if (validArticleFiles.length === 0) {
        throw new Error('有効な記事JSONファイルが見つかりません。');
      }

      // タイムスタンプ検証機能
      this.validateTimestampConsistency(validArticleFiles);

      // 作成時刻順でソート（最新が最初）
      validArticleFiles.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // 候補ファイル一覧表示
      console.log('\n📋 候補ファイル一覧:');
      validArticleFiles.forEach((file, index) => {
        console.log(`${index + 1}. ${file.file} (${file.createdAt})`);
        console.log(`     📝 ${file.title}`);
      });

      const latestFile = validArticleFiles[0];

      // ユーザー確認プロンプト（表示のみ）
      console.log(`\n🎯 選択予定ファイル: ${latestFile.file}`);
      console.log(`📅 作成時刻: ${latestFile.createdAt}`);
      console.log(`📝 記事タイトル: ${latestFile.title}`);
      console.log('\n❓ この記事で処理を続行しますか？');
      console.log('   - Enter: 続行');
      console.log('   - Ctrl+C: 中止');
      console.log('');
      console.log('🔧 テストモード: 自動続行します\n');

      console.log(`✅ 選択確定: ${latestFile.file}`);
      
      return {
        selectedFile: latestFile,
        allCandidates: validArticleFiles
      };

    } catch (error) {
      throw new Error(`記事ファイル検索エラー: ${error.message}`);
    }
  }
}

/**
 * テスト実行
 */
async function testFileSelection() {
  try {
    console.log('🔧 ファイル選択ロジック テスト開始\n');
    
    const tester = new FileSelectionTester();
    const result = await tester.findLatestArticleFile();
    
    console.log('=' .repeat(60));
    console.log('📊 テスト結果サマリー\n');
    
    console.log(`🎯 選択されたファイル: ${result.selectedFile.file}`);
    console.log(`📅 選択ファイルのタイムスタンプ: ${result.selectedFile.createdAt}`);
    console.log(`📝 選択ファイルのタイトル: ${result.selectedFile.title}`);
    console.log(`📊 総候補数: ${result.allCandidates.length}件`);
    
    // 期待値チェック
    const expectedLatest = result.allCandidates.find(f => f.file.includes('20250117'));
    if (expectedLatest && result.selectedFile.file === expectedLatest.file) {
      console.log('✅ 期待結果: 朝活タイムトラッキング記事（2025-01-17）が正しく選択されました');
    } else {
      console.log('⚠️ 注意: 意図しないファイルが選択されています');
      if (expectedLatest) {
        console.log(`💡 期待されたファイル: ${expectedLatest.file} (${expectedLatest.createdAt})`);
      }
    }
    
    console.log('\n🎉 テスト完了');
    
  } catch (error) {
    console.error('❌ テストエラー:', error.message);
  }
}

// テスト実行
if (require.main === module) {
  testFileSelection();
}