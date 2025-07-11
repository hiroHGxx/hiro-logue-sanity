#!/usr/bin/env node
/**
 * ContentFlow V2 - End-to-End テストスクリプト
 * Phase 1記事生成復活の統合テスト
 */

const fs = require('fs').promises;
const path = require('path');
const { checkArticleQualityFromFile } = require('./quality-checker');
const { uploadArticle } = require('./upload-article');

// 設定
const PROJECT_ROOT = '/Users/gotohiro/Documents/user/Products/ContentFlow/sanity-edition';
const ARTICLES_DIR = path.join(PROJECT_ROOT, 'articles');
const TEST_RESULTS_DIR = path.join(PROJECT_ROOT, 'test-results');

class E2ETestRunner {
  constructor() {
    this.testResults = {
      startTime: new Date().toISOString(),
      endTime: null,
      totalTests: 0,
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  /**
   * E2Eテスト実行
   */
  async runE2ETest(testTheme = 'E2Eテスト用記事') {
    try {
      console.log('🧪 ContentFlow V2 E2Eテスト開始');
      console.log('='.repeat(60));
      console.log(`🕐 開始時刻: ${new Date().toLocaleString()}`);
      console.log(`🎯 テストテーマ: ${testTheme}`);
      console.log('');

      // テスト結果ディレクトリ作成
      await this.ensureTestResultsDir();

      // Phase 1テスト群実行
      await this.runPhase1Tests(testTheme);

      // 最終結果報告
      await this.generateFinalReport();

      console.log('🎉 E2Eテスト完了');
      return this.testResults;

    } catch (error) {
      console.error(`🚨 E2Eテスト実行エラー: ${error.message}`);
      throw error;
    }
  }

  /**
   * Phase 1テスト群実行
   */
  async runPhase1Tests(testTheme) {
    console.log('📋 Phase 1: 記事生成復活テスト');
    console.log('-'.repeat(40));

    // Test 1: 最新記事JSONファイル存在確認
    await this.runTest('latest-article-file-exists', async () => {
      const latestFile = await this.findLatestArticleFile();
      if (!latestFile) {
        throw new Error('最新記事JSONファイルが見つかりません');
      }
      console.log(`✅ 最新記事ファイル発見: ${path.basename(latestFile)}`);
      return { latestFile };
    });

    // Test 2: 記事データ構造検証
    await this.runTest('article-data-structure', async () => {
      const latestFile = await this.findLatestArticleFile();
      const rawData = await fs.readFile(latestFile, 'utf-8');
      const articleData = JSON.parse(rawData);

      // V2構造チェック
      if (!articleData.metadata || !articleData.article) {
        throw new Error('V2 JSON構造が不正です（metadata, articleフィールドが必要）');
      }

      // 必須フィールドチェック
      const requiredFields = ['title', 'body', 'slug'];
      for (const field of requiredFields) {
        if (!articleData.article[field]) {
          throw new Error(`必須フィールドが不足: article.${field}`);
        }
      }

      console.log(`✅ 記事データ構造正常`);
      console.log(`📰 タイトル: ${articleData.article.title}`);
      console.log(`📏 文字数: ${articleData.article.body.length}文字`);
      
      return { articleData };
    });

    // Test 3: 記事品質チェック
    await this.runTest('article-quality-check', async () => {
      const latestFile = await this.findLatestArticleFile();
      const qualityResult = await checkArticleQualityFromFile(latestFile);

      console.log(`📊 品質スコア: ${qualityResult.overallScore}/100`);

      if (!qualityResult.passed) {
        console.warn('⚠️ 品質チェック不合格（テスト続行）');
        console.warn('改善提案:');
        qualityResult.recommendations.forEach(rec => console.warn(`  - ${rec}`));
      } else {
        console.log('✅ 品質チェック合格');
      }

      return { qualityResult };
    });

    // Test 4: Sanity投稿テスト（環境変数チェック済みの場合のみ）
    if (process.env.SANITY_API_TOKEN) {
      await this.runTest('sanity-upload-test', async () => {
        const latestFile = await this.findLatestArticleFile();
        
        console.log('🔄 Sanity投稿テスト実行中...');
        const uploadResult = await uploadArticle(latestFile);

        console.log(`✅ Sanity投稿成功`);
        console.log(`📄 Document ID: ${uploadResult.documentId}`);
        console.log(`🌐 公開URL: ${uploadResult.publicUrl}`);

        return { uploadResult };
      });
    } else {
      console.log('⚠️ SANITY_API_TOKEN未設定のため、Sanity投稿テストをスキップ');
    }

    // Test 5: ファイル保存・バックアップ確認
    await this.runTest('file-backup-verification', async () => {
      const latestFile = await this.findLatestArticleFile();
      const uploadedFile = latestFile.replace('.json', '-uploaded.json');
      
      const uploadedExists = await fs.access(uploadedFile).then(() => true).catch(() => false);
      
      if (uploadedExists) {
        console.log('✅ 投稿結果ファイル確認');
        const uploadedData = JSON.parse(await fs.readFile(uploadedFile, 'utf-8'));
        if (uploadedData.sanity && uploadedData.urls) {
          console.log('✅ 投稿結果データ構造正常');
        }
      } else {
        console.warn('⚠️ 投稿結果ファイルが見つかりません（Sanity投稿未実行）');
      }

      return { uploadedExists };
    });
  }

  /**
   * 最新記事JSONファイル検索
   */
  async findLatestArticleFile() {
    try {
      const files = await fs.readdir(ARTICLES_DIR);
      const articleFiles = files.filter(file => 
        file.startsWith('article-') && 
        file.endsWith('.json') && 
        !file.includes('-status') && 
        !file.includes('-uploaded')
      );

      if (articleFiles.length === 0) {
        return null;
      }

      // 最新ファイル取得（ファイル名のタイムスタンプ順）
      articleFiles.sort().reverse();
      return path.join(ARTICLES_DIR, articleFiles[0]);

    } catch (error) {
      console.error(`記事ファイル検索エラー: ${error.message}`);
      return null;
    }
  }

  /**
   * 個別テスト実行
   */
  async runTest(testName, testFunction) {
    const testStartTime = Date.now();
    
    try {
      console.log(`\n🧪 Test: ${testName}`);
      
      this.testResults.totalTests++;
      
      const result = await testFunction();
      
      const duration = Date.now() - testStartTime;
      const testResult = {
        name: testName,
        status: 'passed',
        duration: `${duration}ms`,
        details: result || {},
        error: null
      };
      
      this.testResults.tests.push(testResult);
      this.testResults.passed++;
      
      console.log(`✅ ${testName} - 成功 (${duration}ms)`);
      
    } catch (error) {
      const duration = Date.now() - testStartTime;
      const testResult = {
        name: testName,
        status: 'failed',
        duration: `${duration}ms`,
        details: {},
        error: error.message
      };
      
      this.testResults.tests.push(testResult);
      this.testResults.failed++;
      
      console.error(`❌ ${testName} - 失敗 (${duration}ms)`);
      console.error(`   エラー: ${error.message}`);
    }
  }

  /**
   * テスト結果ディレクトリ作成
   */
  async ensureTestResultsDir() {
    try {
      await fs.access(TEST_RESULTS_DIR);
    } catch {
      await fs.mkdir(TEST_RESULTS_DIR, { recursive: true });
      console.log(`📁 テスト結果ディレクトリ作成: ${TEST_RESULTS_DIR}`);
    }
  }

  /**
   * 最終結果報告
   */
  async generateFinalReport() {
    this.testResults.endTime = new Date().toISOString();
    
    console.log('\n📊 E2Eテスト結果サマリー');
    console.log('='.repeat(60));
    console.log(`🕐 実行時間: ${this.testResults.startTime} - ${this.testResults.endTime}`);
    console.log(`📋 総テスト数: ${this.testResults.totalTests}`);
    console.log(`✅ 成功: ${this.testResults.passed}`);
    console.log(`❌ 失敗: ${this.testResults.failed}`);
    console.log(`📊 成功率: ${Math.round((this.testResults.passed / this.testResults.totalTests) * 100)}%`);

    // 詳細結果表示
    console.log('\n📋 詳細結果:');
    this.testResults.tests.forEach(test => {
      const status = test.status === 'passed' ? '✅' : '❌';
      console.log(`  ${status} ${test.name} (${test.duration})`);
      if (test.error) {
        console.log(`      エラー: ${test.error}`);
      }
    });

    // JSON結果ファイル保存
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const resultFilePath = path.join(TEST_RESULTS_DIR, `e2e-test-${timestamp}.json`);
    await fs.writeFile(resultFilePath, JSON.stringify(this.testResults, null, 2), 'utf-8');
    console.log(`\n💾 詳細結果保存: ${resultFilePath}`);

    // 総合判定
    const overallPass = this.testResults.failed === 0;
    console.log(`\n🎯 総合判定: ${overallPass ? '✅ 合格' : '❌ 不合格'}`);
    
    if (!overallPass) {
      console.log('\n💡 対処が必要なテスト:');
      this.testResults.tests
        .filter(test => test.status === 'failed')
        .forEach(test => console.log(`  - ${test.name}: ${test.error}`));
    }
  }
}

/**
 * 環境チェック
 */
function checkTestEnvironment() {
  console.log('🔍 テスト環境チェック...');
  
  const checks = {
    articlesDir: false,
    personaFiles: false,
    sanityToken: false
  };
  
  // articles ディレクトリ
  try {
    require('fs').accessSync(ARTICLES_DIR);
    checks.articlesDir = true;
    console.log('✅ articles ディレクトリ存在');
  } catch {
    console.warn('⚠️ articles ディレクトリが見つかりません');
  }
  
  // ペルソナファイル
  try {
    require('fs').accessSync(path.join(PROJECT_ROOT, 'HIRO_PERSONA.md'));
    checks.personaFiles = true;
    console.log('✅ HIRO_PERSONA.md 存在');
  } catch {
    console.warn('⚠️ HIRO_PERSONA.md が見つかりません');
  }
  
  // Sanity API Token
  if (process.env.SANITY_API_TOKEN) {
    checks.sanityToken = true;
    console.log('✅ SANITY_API_TOKEN 設定済み');
  } else {
    console.warn('⚠️ SANITY_API_TOKEN 未設定（Sanity投稿テストはスキップされます）');
  }
  
  const readyForTesting = checks.articlesDir && checks.personaFiles;
  console.log(`🎯 テスト実行準備: ${readyForTesting ? '✅ 完了' : '❌ 不完全'}`);
  
  return checks;
}

/**
 * メイン実行
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help')) {
    console.log('📄 ContentFlow V2 - E2Eテストスクリプト');
    console.log('');
    console.log('使用方法:');
    console.log('  node scripts/e2e-test.js [オプション]');
    console.log('');
    console.log('オプション:');
    console.log('  --help           このヘルプを表示');
    console.log('  --theme "テーマ"  カスタムテーマでテスト');
    console.log('');
    console.log('例:');
    console.log('  node scripts/e2e-test.js');
    console.log('  node scripts/e2e-test.js --theme "AI技術と日常生活"');
    console.log('');
    process.exit(0);
  }
  
  // テーマ指定
  const themeIndex = args.indexOf('--theme');
  const testTheme = themeIndex !== -1 ? args[themeIndex + 1] : 'E2Eテスト記事';
  
  try {
    // 環境チェック
    const envChecks = checkTestEnvironment();
    
    if (!envChecks.articlesDir) {
      console.error('❌ 必須環境が不足しているため、テストを中止します');
      process.exit(1);
    }
    
    console.log('');
    
    // E2Eテスト実行
    const testRunner = new E2ETestRunner();
    const results = await testRunner.runE2ETest(testTheme);
    
    // 終了コード設定
    const exitCode = results.failed === 0 ? 0 : 1;
    process.exit(exitCode);
    
  } catch (error) {
    console.error('\n🚨 E2Eテスト実行失敗');
    console.error(`エラー: ${error.message}`);
    process.exit(1);
  }
}

// Node.js環境でのみ実行
if (require.main === module) {
  main();
}

module.exports = { E2ETestRunner };