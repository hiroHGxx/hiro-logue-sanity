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

      // 7. 処理済みファイルのアーカイブ（画像統合後に移動）
      // await this.archiveProcessedFile(); // 画像統合完了後に実行するため一時的に無効化

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
      console.log('\n📄 記事JSONファイル検索中...');
      
      // 新形式: 固定ファイル名 'new-article.json' をチェック
      const newArticleFile = path.join(ARTICLES_DIR, 'new-article.json');
      
      try {
        // new-article.json の存在確認と検証
        const rawData = await fs.readFile(newArticleFile, 'utf-8');
        const data = JSON.parse(rawData);
        
        // 新しい形式（metadata + article + imagePrompts）の検証
        if (data.metadata && data.article && data.article.title) {
          console.log(`✅ 処理対象ファイル: new-article.json`);
          console.log(`📰 記事タイトル: ${data.article.title}`);
          console.log(`🎯 テーマ: ${data.metadata.theme}`);
          
          // 正確なタイムスタンプを生成
          const now = new Date();
          const sessionId = `article-${now.getFullYear().toString().slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
          const createdAt = now.toISOString();
          
          // メタデータを正確なタイムスタンプで更新
          data.metadata.sessionId = sessionId;
          data.metadata.createdAt = createdAt;
          
          // 更新されたデータをファイルに書き戻し
          await fs.writeFile(newArticleFile, JSON.stringify(data, null, 2), 'utf-8');
          
          console.log(`🕐 タイムスタンプ更新: ${sessionId} (${createdAt})`);
          
          // sessionIdを設定
          this.sessionId = sessionId;
          
          return newArticleFile;
        } else {
          throw new Error('new-article.json の形式が不正です');
        }
        
      } catch (fileError) {
        // new-article.json が存在しない場合は従来の検索方法を実行
        console.log('📄 new-article.json が見つかりません。既存ファイルから検索します...');
        return await this.findLatestArticleFileLegacy();
      }

    } catch (error) {
      throw new Error(`記事ファイル検索エラー: ${error.message}`);
    }
  }

  /**
   * 従来方式の記事ファイル検索（フォールバック）
   */
  async findLatestArticleFileLegacy() {
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
   * Sanity記事先行投稿（ペイロードサイズ監視付き）
   */
  async uploadArticleToSanity(filePath) {
    try {
      console.log('\n🔄 Sanity記事先行投稿開始...');
      
      // 事前ペイロードサイズ監視
      await this.monitorPayloadSize(filePath);
      
      const command = `cd "${PROJECT_ROOT}" && node "${UPLOAD_SCRIPT}" "${filePath}"`;
      
      // タイムアウト付き実行
      const executionStartTime = Date.now();
      const { stdout, stderr } = await execAsync(command, {
        timeout: 180000, // 3分タイムアウト
        maxBuffer: 1024 * 1024 * 10 // 10MBバッファ
      });
      const executionTime = Date.now() - executionStartTime;
      
      console.log(`⏱️ 実行時間: ${executionTime}ms`);
      
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
        publishedUrl: `https://hiro-logue.vercel.app/blog/${slugMatch[1]}`,
        executionTime: executionTime
      };

      console.log(`✅ Sanity投稿完了`);
      console.log(`📄 Document ID: ${result.documentId}`);
      console.log(`🌐 公開URL: ${result.publishedUrl}`);
      console.log(`⚡ 投稿処理時間: ${executionTime}ms`);
      
      return result;

    } catch (error) {
      // タイムアウトエラーの詳細処理
      if (error.code === 'ETIMEDOUT') {
        throw new Error(`Sanity投稿タイムアウト: 3分以内に完了しませんでした。ペイロードサイズを確認してください。`);
      }
      
      throw new Error(`Sanity投稿エラー: ${error.message}`);
    }
  }

  /**
   * ペイロードサイズ監視機能
   */
  async monitorPayloadSize(filePath) {
    try {
      console.log('\n📊 ペイロードサイズ監視実行中...');
      
      const rawData = await fs.readFile(filePath, 'utf-8');
      const payloadSize = Buffer.byteLength(rawData, 'utf-8');
      const payloadSizeMB = (payloadSize / 1024 / 1024).toFixed(2);
      const payloadSizeKB = (payloadSize / 1024).toFixed(1);
      
      console.log(`📏 ファイルサイズ: ${payloadSizeKB} KB (${payloadSizeMB} MB)`);
      
      // データ構造分析
      const articleData = JSON.parse(rawData);
      const breakdown = this.analyzePayloadBreakdown(articleData);
      
      console.log('📋 ペイロード構成:');
      Object.entries(breakdown).forEach(([section, size]) => {
        const sizeKB = (size / 1024).toFixed(1);
        const percentage = ((size / payloadSize) * 100).toFixed(1);
        console.log(`  - ${section}: ${sizeKB} KB (${percentage}%)`);
      });
      
      // 制限チェック
      const limits = {
        warning: 1 * 1024 * 1024,  // 1MB
        error: 2 * 1024 * 1024     // 2MB
      };
      
      if (payloadSize > limits.error) {
        console.error(`🚨 ペイロードサイズ制限超過: ${payloadSizeMB}MB > 2MB`);
        console.error('💡 推奨対策: Phase Aモード（最小限データ）での投稿');
        console.error('   - 画像プロンプトの分離保存');
        console.error('   - メタデータの簡素化');
      } else if (payloadSize > limits.warning) {
        console.warn(`⚠️ ペイロードサイズ警告: ${payloadSizeMB}MB > 1MB`);
        console.warn('💡 注意: API応答時間が延長される可能性があります');
      } else {
        console.log(`✅ ペイロードサイズ正常: ${payloadSizeMB}MB < 1MB`);
      }
      
      // 監視結果をログに記録
      await this.logPayloadMetrics({
        filePath,
        payloadSize,
        payloadSizeMB: parseFloat(payloadSizeMB),
        breakdown,
        timestamp: new Date().toISOString()
      });
      
      return {
        size: payloadSize,
        sizeMB: parseFloat(payloadSizeMB),
        breakdown,
        status: payloadSize > limits.error ? 'error' : 
                payloadSize > limits.warning ? 'warning' : 'ok'
      };
      
    } catch (error) {
      console.error(`❌ ペイロードサイズ監視エラー: ${error.message}`);
      return { size: 0, sizeMB: 0, breakdown: {}, status: 'error' };
    }
  }

  /**
   * ペイロード構成分析
   */
  analyzePayloadBreakdown(articleData) {
    const breakdown = {};
    
    try {
      if (articleData.metadata) {
        breakdown.metadata = Buffer.byteLength(JSON.stringify(articleData.metadata), 'utf-8');
      }
      
      if (articleData.article) {
        breakdown.title = Buffer.byteLength(articleData.article.title || '', 'utf-8');
        breakdown.body = Buffer.byteLength(articleData.article.body || '', 'utf-8');
        breakdown.slug = Buffer.byteLength(articleData.article.slug || '', 'utf-8');
        breakdown.excerpt = Buffer.byteLength(articleData.article.excerpt || '', 'utf-8');
        breakdown.categories = Buffer.byteLength(JSON.stringify(articleData.article.categories || []), 'utf-8');
      }
      
      if (articleData.imagePrompts) {
        breakdown.imagePrompts = Buffer.byteLength(JSON.stringify(articleData.imagePrompts), 'utf-8');
      }
      
      // その他のフィールド
      const otherFields = { ...articleData };
      delete otherFields.metadata;
      delete otherFields.article;
      delete otherFields.imagePrompts;
      
      if (Object.keys(otherFields).length > 0) {
        breakdown.other = Buffer.byteLength(JSON.stringify(otherFields), 'utf-8');
      }
      
    } catch (error) {
      console.warn(`⚠️ ペイロード分析エラー: ${error.message}`);
      breakdown.error = Buffer.byteLength(JSON.stringify(articleData), 'utf-8');
    }
    
    return breakdown;
  }

  /**
   * ペイロードメトリクスログ記録
   */
  async logPayloadMetrics(metrics) {
    try {
      const logFile = path.join(PROJECT_ROOT, 'logs', 'payload-metrics.json');
      await fs.mkdir(path.dirname(logFile), { recursive: true });
      
      let existingLogs = [];
      try {
        const existingData = await fs.readFile(logFile, 'utf-8');
        existingLogs = JSON.parse(existingData);
      } catch {
        // ファイルが存在しない場合は新規作成
      }
      
      existingLogs.push(metrics);
      
      // 最新100件のみ保持
      if (existingLogs.length > 100) {
        existingLogs = existingLogs.slice(-100);
      }
      
      await fs.writeFile(logFile, JSON.stringify(existingLogs, null, 2));
      console.log(`📝 ペイロードメトリクス記録: logs/payload-metrics.json`);
      
    } catch (error) {
      console.warn(`⚠️ メトリクスログ記録失敗: ${error.message}`);
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
   * エラーハンドリング（詳細ログ強化）
   */
  async handleWorkflowError(error) {
    console.error('\n🚨 ワークフロー実行エラー');
    console.error('='.repeat(60));
    console.error(`エラー: ${error.message}`);
    console.error(`エラータイプ: ${error.constructor.name}`);
    console.error(`発生時刻: ${new Date().toLocaleString()}`);
    
    // スタックトレースの詳細表示
    if (error.stack) {
      console.error(`\n📋 スタックトレース:`);
      console.error(error.stack);
    }
    
    // エラーカテゴリ別の詳細診断
    if (error.message.includes('記事JSONファイルが見つかりません')) {
      console.error('\n🔍 【ファイル検索エラー】詳細診断:');
      await this.diagnoseFileSearchError();
    } else if (error.message.includes('Sanity投稿エラー')) {
      console.error('\n🔍 【Sanity APIエラー】詳細診断:');
      await this.diagnoseSanityError(error);
    } else if (error.message.includes('記事データ検証エラー')) {
      console.error('\n🔍 【データ検証エラー】詳細診断:');
      await this.diagnoseDataValidationError(error);
    } else if (error.message.includes('バックグラウンド生成')) {
      console.error('\n🔍 【画像生成エラー】詳細診断:');
      await this.diagnoseImageGenerationError(error);
    } else {
      console.error('\n🔍 【未分類エラー】詳細診断:');
      await this.diagnoseGenericError(error);
    }
    
    // システム状態の記録
    await this.logSystemState(error);
    
    console.error('='.repeat(60));
  }

  /**
   * ファイル検索エラー診断
   */
  async diagnoseFileSearchError() {
    try {
      console.error('📁 articlesディレクトリ確認:');
      const files = await fs.readdir(ARTICLES_DIR).catch(() => []);
      console.error(`  - ファイル数: ${files.length}`);
      console.error(`  - ファイル一覧: ${files.slice(0, 10).join(', ')}${files.length > 10 ? '...' : ''}`);
      
      console.error('\n💡 解決方法:');
      console.error('1. マスタープロンプトを使って記事を生成してください');
      console.error('2. articles/new-article.json または articles/article-*.json が存在することを確認');
      console.error('3. ファイル権限を確認: ls -la articles/');
    } catch (diagError) {
      console.error(`診断エラー: ${diagError.message}`);
    }
  }

  /**
   * Sanity APIエラー診断
   */
  async diagnoseSanityError(error) {
    try {
      console.error('🌐 Sanity API接続診断:');
      console.error(`  - エラー詳細: ${error.message}`);
      
      // 環境変数確認
      const hasToken = !!process.env.SANITY_API_TOKEN;
      const hasProjectId = !!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
      const hasDataset = !!process.env.NEXT_PUBLIC_SANITY_DATASET;
      
      console.error(`  - SANITY_API_TOKEN: ${hasToken ? '✅ 設定済み' : '❌ 未設定'}`);
      console.error(`  - PROJECT_ID: ${hasProjectId ? '✅ 設定済み' : '❌ 未設定'}`);
      console.error(`  - DATASET: ${hasDataset ? '✅ 設定済み' : '❌ 未設定'}`);
      
      // ペイロードサイズ確認
      if (this.articleData) {
        const payloadSize = JSON.stringify(this.articleData).length;
        const payloadSizeMB = (payloadSize / 1024 / 1024).toFixed(2);
        console.error(`  - ペイロードサイズ: ${payloadSize} bytes (${payloadSizeMB} MB)`);
        console.error(`  - Sanity制限: 2MB ${payloadSizeMB > 2 ? '❌ 超過' : '✅ 以内'}`);
      }
      
      console.error('\n💡 解決方法:');
      console.error('1. .env.local ファイルのSANITY_API_TOKENを確認');
      console.error('2. ネットワーク接続を確認');
      console.error('3. ペイロードサイズを削減（画像プロンプト分離など）');
      console.error('4. 手動投稿テスト: node scripts/upload-article.js articles/new-article.json');
    } catch (diagError) {
      console.error(`Sanity診断エラー: ${diagError.message}`);
    }
  }

  /**
   * データ検証エラー診断
   */
  async diagnoseDataValidationError(error) {
    try {
      console.error('📋 データ構造診断:');
      if (this.articleData) {
        console.error(`  - metadata存在: ${!!this.articleData.metadata}`);
        console.error(`  - article存在: ${!!this.articleData.article}`);
        console.error(`  - imagePrompts存在: ${!!this.articleData.imagePrompts}`);
        console.error(`  - タイトル: ${this.articleData.article?.title || '❌ なし'}`);
        console.error(`  - 本文文字数: ${this.articleData.article?.body?.length || 0}`);
        console.error(`  - スラッグ: ${this.articleData.article?.slug || '❌ なし'}`);
      }
      
      console.error('\n💡 解決方法:');
      console.error('1. 記事JSONファイルの構造を確認');
      console.error('2. 必須フィールド（title, body, slug）の存在確認');
      console.error('3. マスタープロンプトで新しい記事を生成');
    } catch (diagError) {
      console.error(`データ診断エラー: ${diagError.message}`);
    }
  }

  /**
   * 画像生成エラー診断
   */
  async diagnoseImageGenerationError(error) {
    try {
      console.error('🎨 画像生成環境診断:');
      console.error(`  - Python実行パス: ${PYTHON_PATH}`);
      console.error(`  - バックグラウンドスクリプト: ${BACKGROUND_GENERATOR}`);
      
      // Python環境確認
      try {
        const { stdout } = await execAsync(`${PYTHON_PATH} --version`);
        console.error(`  - Python版: ${stdout.trim()} ✅`);
      } catch {
        console.error(`  - Python版: ❌ 実行不可`);
      }
      
      // ファイル存在確認
      try {
        await fs.access(BACKGROUND_GENERATOR);
        console.error(`  - 生成スクリプト: ✅ 存在`);
      } catch {
        console.error(`  - 生成スクリプト: ❌ 不存在`);
      }
      
      console.error('\n💡 解決方法:');
      console.error('1. Python仮想環境をアクティベート');
      console.error('2. 必要ライブラリのインストール確認');
      console.error('3. 画像生成は手動実行可能（記事投稿は完了）');
    } catch (diagError) {
      console.error(`画像診断エラー: ${diagError.message}`);
    }
  }

  /**
   * 汎用エラー診断
   */
  async diagnoseGenericError(error) {
    try {
      console.error('🔧 システム環境診断:');
      console.error(`  - Node.js版: ${process.version}`);
      console.error(`  - 作業ディレクトリ: ${process.cwd()}`);
      console.error(`  - プロセスID: ${process.pid}`);
      console.error(`  - メモリ使用量: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
      
      console.error('\n💡 一般的解決方法:');
      console.error('1. Node.jsプロセスを再起動');
      console.error('2. 依存関係の再インストール: npm install');
      console.error('3. ディスク容量・メモリ確認');
      console.error('4. 権限確認: プロジェクトディレクトリへのアクセス権');
    } catch (diagError) {
      console.error(`汎用診断エラー: ${diagError.message}`);
    }
  }

  /**
   * システム状態ログ記録
   */
  async logSystemState(error) {
    try {
      const logData = {
        timestamp: new Date().toISOString(),
        error: {
          message: error.message,
          type: error.constructor.name,
          stack: error.stack
        },
        system: {
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch,
          cwd: process.cwd(),
          memoryUsage: process.memoryUsage()
        },
        workflow: {
          sessionId: this.sessionId,
          articleData: !!this.articleData,
          sanityResult: !!this.sanityResult
        }
      };
      
      const logFile = path.join(PROJECT_ROOT, 'logs', 'error-log.json');
      await fs.mkdir(path.dirname(logFile), { recursive: true });
      await fs.writeFile(logFile, JSON.stringify(logData, null, 2));
      
      console.error(`\n📝 詳細ログ記録: logs/error-log.json`);
    } catch (logError) {
      console.error(`ログ記録失敗: ${logError.message}`);
    }
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
   * 処理済みファイルのアーカイブ
   */
  async archiveProcessedFile() {
    try {
      const newArticleFile = path.join(ARTICLES_DIR, 'new-article.json');
      
      // new-article.json が存在する場合のみアーカイブ
      try {
        await fs.access(newArticleFile);
      } catch {
        console.log('📄 new-article.json が存在しないため、アーカイブをスキップ');
        return;
      }

      console.log('\n📦 処理済みファイルのアーカイブ中...');
      
      // processed ディレクトリの確認・作成
      const processedDir = path.join(ARTICLES_DIR, 'processed');
      try {
        await fs.access(processedDir);
      } catch {
        await fs.mkdir(processedDir, { recursive: true });
        console.log(`📁 processedディレクトリを作成: ${processedDir}`);
      }
      
      // アーカイブファイル名（sessionIdベース）
      const archiveFileName = `${this.sessionId}.json`;
      const archiveFilePath = path.join(processedDir, archiveFileName);
      
      // ファイル移動
      await fs.rename(newArticleFile, archiveFilePath);
      
      console.log(`✅ ファイルアーカイブ完了: ${archiveFileName}`);
      console.log(`📂 アーカイブ先: articles/processed/`);
      
    } catch (error) {
      console.error(`❌ ファイルアーカイブエラー: ${error.message}`);
      console.log('⚠️ アーカイブ失敗 - ワークフローは正常完了');
    }
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