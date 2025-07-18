#!/usr/bin/env node
/**
 * ContentFlow V2 - 完全一気通貫ワークフロー起動スクリプト
 * 記事先行投稿 + 画像バックグラウンド生成の自動実行
 */

const fs = require('fs').promises;
const path = require('path');
const { exec, spawn } = require('child_process');
const { promisify } = require('util');
const { checkArticleQualityFromFile } = require('./quality-checker');

const execAsync = promisify(exec);

// 設定
const PROJECT_ROOT = '/Users/gotohiro/Documents/user/Products/ContentFlow/sanity-edition';
const ARTICLES_DIR = path.join(PROJECT_ROOT, 'articles');
const UPLOAD_SCRIPT = path.join(PROJECT_ROOT, 'scripts', 'upload-article.js');
const PYTHON_PATH = '/Users/gotohiro/Documents/user/Products/stable-diffusion-local/venv310/bin/python';
const BACKGROUND_GENERATOR = path.join(PROJECT_ROOT, 'background-image-generator.py');
const STATUS_FILE = path.join(PROJECT_ROOT, 'image-generation-status.json');

class FullWorkflowOrchestrator {
  constructor() {
    this.sessionId = null;
    this.articleData = null;
    this.sanityResult = null;
  }

  /**
   * メインワークフロー実行
   */
  async execute() {
    try {
      console.log('🚀 ContentFlow V2 完全ワークフロー開始');
      console.log(`📁 プロジェクトルート: ${PROJECT_ROOT}`);
      console.log(`🕐 開始時刻: ${new Date().toLocaleString()}`);

      // 1. 最新記事JSONファイル検索
      const latestArticleFile = await this.findLatestArticleFile();
      
      // 2. 記事データ読み込み・検証
      this.articleData = await this.loadAndValidateArticle(latestArticleFile);
      
      // 2.5. 品質チェック実行
      await this.performQualityCheck(latestArticleFile);
      
      // 3. Sanity記事先行投稿
      this.sanityResult = await this.uploadArticleToSanity(latestArticleFile);
      
      // 4. 画像生成状態ファイル初期化
      await this.initializeImageGenerationStatus();
      
      // 5. バックグラウンド画像生成起動
      const backgroundProcess = await this.startBackgroundImageGeneration();
      
      // 6. 最終結果報告
      await this.reportFinalResults(backgroundProcess);

      console.log('\n🎉 完全ワークフロー起動成功!');
      
    } catch (error) {
      await this.handleWorkflowError(error);
      process.exit(1);
    }
  }

  /**
   * 最新記事JSONファイル検索
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
        throw new Error('記事JSONファイルが見つかりません。先にマスタープロンプトで記事を生成してください。');
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
              mtime: stats.mtime
            });
          }
        } catch (error) {
          console.warn(`⚠️ ファイル ${file} をスキップ: ${error.message}`);
        }
      }

      if (validArticleFiles.length === 0) {
        throw new Error('有効な記事JSONファイルが見つかりません。新しい形式のファイルを生成してください。');
      }

      // タイムスタンプ検証機能
      this.validateTimestampConsistency(validArticleFiles);

      // 作成時刻順でソート（最新が最初）
      validArticleFiles.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // 候補ファイル一覧表示
      console.log('\n📋 候補ファイル一覧:');
      validArticleFiles.forEach((file, index) => {
        console.log(`${index + 1}. ${file.file} (${file.createdAt})`);
      });

      const latestFile = validArticleFiles[0];

      // ユーザー確認プロンプト
      console.log(`\n🎯 選択予定ファイル: ${latestFile.file}`);
      console.log(`📅 作成時刻: ${latestFile.createdAt}`);
      console.log(`📝 記事タイトル: ${JSON.parse(await fs.readFile(latestFile.filePath, 'utf-8')).article.title}`);
      console.log('\n❓ この記事で処理を続行しますか？');
      console.log('   - Enter: 続行');
      console.log('   - Ctrl+C: 中止');
      console.log('');

      // ユーザー入力待機（簡易実装）
      await this.waitForUserConfirmation();

      console.log(`✅ 選択確定: ${latestFile.file}`);
      
      return latestFile.filePath;

    } catch (error) {
      throw new Error(`記事ファイル検索エラー: ${error.message}`);
    }
  }

  /**
   * 記事データ読み込み・検証
   */
  async loadAndValidateArticle(filePath) {
    try {
      console.log('\n📋 記事データ読み込み・検証中...');
      
      const rawData = await fs.readFile(filePath, 'utf-8');
      const articleData = JSON.parse(rawData);

      // 必須フィールド検証
      this.validateRequiredFields(articleData);
      
      // 品質検証
      this.validateArticleQuality(articleData);

      this.sessionId = articleData.metadata?.sessionId || path.basename(filePath, '.json');
      
      console.log(`✅ 記事データ検証完了`);
      console.log(`📰 タイトル: ${articleData.article.title}`);
      console.log(`📏 文字数: ${articleData.article.body.length}文字`);
      console.log(`🔖 スラッグ: ${articleData.article.slug}`);
      
      return articleData;

    } catch (error) {
      throw new Error(`記事データ検証エラー: ${error.message}`);
    }
  }

  /**
   * 必須フィールド検証
   */
  validateRequiredFields(articleData) {
    const required = ['article.title', 'article.body', 'article.slug'];
    
    for (const field of required) {
      const value = this.getNestedValue(articleData, field);
      if (!value) {
        throw new Error(`必須フィールドが不足: ${field}`);
      }
    }
  }

  /**
   * 記事品質検証
   */
  validateArticleQuality(articleData) {
    const article = articleData.article;
    
    // 文字数チェック
    if (article.body.length < 2000) {
      console.warn(`⚠️ 文字数不足: ${article.body.length}文字 (推奨: 2000-2500文字)`);
    }
    
    // 構造チェック
    const sections = (article.body.match(/##/g) || []).length;
    if (sections < 3) {
      console.warn(`⚠️ セクション数不足: ${sections}個 (推奨: 4-5個)`);
    }
    
    // Hirologスタイルチェック
    const hasHiroStyle = article.body.includes('です') && 
                        article.body.includes('ます') &&
                        (article.body.includes('なのかなと思います') || 
                         article.body.includes('な気がします'));
    
    if (!hasHiroStyle) {
      console.warn('⚠️ Hirologスタイル要素が不足している可能性があります');
    }
    
    console.log('📊 品質チェック完了');
  }

  /**
   * Sanity記事先行投稿
   */
  async uploadArticleToSanity(filePath) {
    try {
      console.log('\n🔄 Sanity記事先行投稿開始...');
      
      const command = `cd "${PROJECT_ROOT}" && node "${UPLOAD_SCRIPT}" "${filePath}"`;
      const { stdout, stderr } = await execAsync(command);
      
      if (stderr && !stderr.includes('warning')) {
        throw new Error(`Upload script error: ${stderr}`);
      }

      // Document ID抽出
      const documentIdMatch = stdout.match(/Document ID: ([a-zA-Z0-9]+)/);
      const slugMatch = stdout.match(/Slug: ([a-z0-9\-]+)/);
      
      if (!documentIdMatch || !slugMatch) {
        throw new Error('Sanity投稿結果の解析に失敗しました');
      }

      const result = {
        documentId: documentIdMatch[1],
        slug: slugMatch[1],
        publishedUrl: `https://hiro-logue.vercel.app/blog/${slugMatch[1]}`
      };

      console.log(`✅ Sanity投稿完了`);
      console.log(`📄 Document ID: ${result.documentId}`);
      console.log(`🌐 公開URL: ${result.publishedUrl}`);
      
      return result;

    } catch (error) {
      throw new Error(`Sanity投稿エラー: ${error.message}`);
    }
  }

  /**
   * 画像生成状態ファイル初期化
   */
  async initializeImageGenerationStatus() {
    try {
      console.log('\n📊 画像生成状態ファイル初期化中...');
      
      if (!this.articleData.imagePrompts || this.articleData.imagePrompts.length === 0) {
        console.warn('⚠️ 画像プロンプトが見つかりません。画像生成をスキップします。');
        return;
      }

      const statusData = {
        sessionId: this.sessionId,
        status: "preparing",
        sanityDocumentId: this.sanityResult.documentId,
        publishedUrl: this.sanityResult.publishedUrl,
        imageGeneration: {
          startedAt: new Date().toISOString(),
          total: this.articleData.imagePrompts.length,
          completed: 0,
          failed: 0,
          variations: []
        },
        prompts: this.articleData.imagePrompts,
        backgroundProcess: null
      };

      await fs.writeFile(STATUS_FILE, JSON.stringify(statusData, null, 2), 'utf-8');
      
      console.log(`✅ 状態ファイル初期化完了: ${this.articleData.imagePrompts.length}枚の画像生成準備`);

    } catch (error) {
      throw new Error(`状態ファイル初期化エラー: ${error.message}`);
    }
  }

  /**
   * バックグラウンド画像生成起動
   */
  async startBackgroundImageGeneration() {
    try {
      console.log('\n🎨 バックグラウンド画像生成起動中...');
      
      if (!this.articleData.imagePrompts || this.articleData.imagePrompts.length === 0) {
        console.log('📝 画像プロンプトなし - 記事のみ完了');
        return null;
      }

      // Python バックグラウンドプロセス起動
      const args = [BACKGROUND_GENERATOR, '--session-id', this.sessionId];
      
      const child = spawn(PYTHON_PATH, args, {
        detached: true,
        stdio: ['ignore', 'ignore', 'ignore'],
        cwd: PROJECT_ROOT
      });

      child.unref(); // 親プロセスから切り離し

      // PID記録
      const backgroundInfo = {
        pid: child.pid,
        startedAt: new Date().toISOString(),
        command: `${PYTHON_PATH} ${args.join(' ')}`
      };

      // 状態ファイル更新
      await this.updateImageGenerationStatus({
        status: "background_generating",
        backgroundProcess: backgroundInfo
      });

      console.log(`✅ バックグラウンドプロセス起動成功`);
      console.log(`🔧 PID: ${child.pid}`);
      console.log(`⏰ 推定完了時間: 15-20分後`);
      
      return backgroundInfo;

    } catch (error) {
      console.error(`❌ バックグラウンド生成起動失敗: ${error.message}`);
      console.log('📝 記事投稿は完了しています - 画像は後で手動生成可能');
      return null;
    }
  }

  /**
   * 画像生成状態更新
   */
  async updateImageGenerationStatus(updates) {
    try {
      const currentStatus = JSON.parse(await fs.readFile(STATUS_FILE, 'utf-8'));
      const updatedStatus = { ...currentStatus, ...updates };
      await fs.writeFile(STATUS_FILE, JSON.stringify(updatedStatus, null, 2), 'utf-8');
    } catch (error) {
      console.error(`状態ファイル更新エラー: ${error.message}`);
    }
  }

  /**
   * 最終結果報告
   */
  async reportFinalResults(backgroundProcess) {
    console.log('\n' + '='.repeat(60));
    console.log('🎉 ContentFlow V2 ワークフロー実行結果');
    console.log('='.repeat(60));

    console.log(`📰 記事タイトル: ${this.articleData.article.title}`);
    console.log(`🌐 公開URL: ${this.sanityResult.publishedUrl}`);
    console.log(`📄 Sanity Document ID: ${this.sanityResult.documentId}`);
    
    if (backgroundProcess) {
      console.log(`🎨 画像生成: バックグラウンド実行中 (PID: ${backgroundProcess.pid})`);
      console.log(`📊 生成予定: ${this.articleData.imagePrompts.length}枚`);
      console.log(`⏰ 推定完了: 15-20分後`);
      console.log(`📋 進捗確認: cat image-generation-status.json`);
    } else {
      console.log(`📝 画像生成: スキップ（記事のみ完了）`);
    }

    console.log(`🕐 完了時刻: ${new Date().toLocaleString()}`);
    console.log('='.repeat(60));
  }

  /**
   * エラーハンドリング
   */
  async handleWorkflowError(error) {
    console.error('\n🚨 ワークフロー実行エラー');
    console.error('='.repeat(40));
    console.error(`エラー: ${error.message}`);
    
    if (error.message.includes('記事JSONファイルが見つかりません')) {
      console.error('\n💡 解決方法:');
      console.error('1. マスタープロンプトを使って記事を生成してください');
      console.error('2. articles/article-YYYYMMDD-HHMMSS.json が作成されていることを確認');
    } else if (error.message.includes('Sanity投稿エラー')) {
      console.error('\n💡 解決方法:');
      console.error('1. .env.local ファイルのSANITY_API_TOKENを確認');
      console.error('2. ネットワーク接続を確認');
      console.error('3. 手動投稿: node upload-from-json.js articles/最新ファイル.json');
    }
    
    console.error('='.repeat(40));
  }

  /**
   * 品質チェック実行
   */
  async performQualityCheck(filePath) {
    try {
      console.log('\n📊 記事品質チェック実行中...');
      
      const qualityResult = await checkArticleQualityFromFile(filePath);
      
      console.log(`📊 品質スコア: ${qualityResult.overallScore}/100`);
      
      if (qualityResult.passed) {
        console.log('✅ 品質チェック合格 - 投稿続行');
      } else {
        console.warn('⚠️ 品質チェック不合格 - 投稿は継続（警告のみ）');
        console.warn('💡 改善提案:');
        qualityResult.recommendations.forEach(rec => console.warn(`  - ${rec}`));
      }
      
      return qualityResult;
      
    } catch (error) {
      console.error(`❌ 品質チェックエラー: ${error.message}`);
      console.warn('⚠️ 品質チェック失敗 - 投稿は継続');
      return null;
    }
  }

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
   * ユーザー確認プロンプト
   */
  async waitForUserConfirmation() {
    return new Promise((resolve) => {
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      rl.question('続行するにはEnterキーを押してください...', () => {
        rl.close();
        resolve();
      });
    });
  }

  /**
   * ユーティリティ: ネストされた値取得
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}

/**
 * メイン実行
 */
async function main() {
  try {
    const orchestrator = new FullWorkflowOrchestrator();
    await orchestrator.execute();
  } catch (error) {
    console.error('🚨 予期しないエラー:', error.message);
    process.exit(1);
  }
}

// Node.js環境でのみ実行
if (require.main === module) {
  main();
}

module.exports = { FullWorkflowOrchestrator };