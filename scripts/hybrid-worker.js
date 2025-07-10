/**
 * Phase C: ハイブリッド画像生成ワーカー
 * Phase A方式（直接Python実行）をバックグラウンド化
 * + Sanity CMS統合
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs/promises');

// TypeScript logger.tsを使用するためのESM import
let logger;
(async () => {
  try {
    const loggerModule = await import('../lib/logger.js');
    logger = loggerModule;
  } catch (error) {
    console.warn('⚠️ Logger module not available, using console logging');
    // フォールバック用のダミーlogger
    logger = {
      logToContentFlow: async (entry) => {
        const emoji = entry.level === 'ERROR' ? '❌' : 
                     entry.action === 'start' ? '🚀' :
                     entry.action === 'complete' ? '✅' : '🔄';
        console.log(`${emoji} [${entry.source}] ${entry.message}`);
      },
      logError: async (sessionId, phase, source, error) => {
        console.error(`❌ [${source}] Error in ${phase}:`, error.message);
      }
    };
  }
})();

class HybridImageWorker {
  constructor() {
    this.isRunning = false;
    this.pollInterval = 5000; // 5秒間隔でポーリング
    this.pythonEnvPath = '/Users/gotohiro/Documents/user/Products/stable-diffusion-local/venv310/bin/python';
    this.scriptPath = './scripts/auto-sd-generator.py';
    this.flagsDir = './data/jobs/flags';
    this.configsDir = './data/jobs/configs';
    this.completedDir = './data/jobs/completed';
  }

  async start() {
    if (this.isRunning) {
      console.log('⚠️ Hybrid Worker already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Phase C Hybrid Image Worker started');
    console.log('🎯 Monitoring flag directory:', this.flagsDir);

    // ディレクトリ初期化
    await this.initializeDirectories();
    
    // ポーリングループ開始
    this.startPolling();
  }

  stop() {
    this.isRunning = false;
    console.log('🛑 Hybrid Image Worker stopped');
  }

  async initializeDirectories() {
    const dirs = [this.flagsDir, this.configsDir, this.completedDir];
    
    for (const dir of dirs) {
      try {
        await fs.mkdir(dir, { recursive: true });
      } catch (error) {
        console.error(`Failed to create directory ${dir}:`, error);
      }
    }
  }

  startPolling() {
    const poll = async () => {
      if (!this.isRunning) return;

      try {
        await this.processPendingJobs();
      } catch (error) {
        console.error('❌ Error in polling loop:', error);
      }

      if (this.isRunning) {
        setTimeout(poll, this.pollInterval);
      }
    };

    poll();
  }

  async processPendingJobs() {
    try {
      // フラグファイル一覧取得
      const files = await fs.readdir(this.flagsDir);
      const flagFiles = files.filter(file => file.endsWith('.flag'));

      if (flagFiles.length === 0) {
        return; // 処理待ちジョブなし
      }

      console.log(`📋 Found ${flagFiles.length} pending jobs`);

      // 最も古いジョブを処理
      flagFiles.sort();
      const flagFile = flagFiles[0];
      const flagPath = path.join(this.flagsDir, flagFile);

      await this.processJob(flagPath);

    } catch (error) {
      console.error('❌ Error processing pending jobs:', error);
    }
  }

  async processJob(flagPath) {
    let sessionId = 'unknown';
    
    try {
      // フラグファイル読み込み
      const flagData = await fs.readFile(flagPath, 'utf-8');
      const job = JSON.parse(flagData);
      sessionId = job.sessionId || `job_${job.articleId}`;

      console.log(`🎨 Processing job: ${job.articleId}`);
      console.log(`📝 Config: ${job.configPath}`);

      if (logger.logToContentFlow) {
        await logger.logToContentFlow({
          level: 'INFO',
          source: 'hybrid-worker',
          sessionId,
          phase: 'image-generation',
          action: 'start',
          message: `画像生成ジョブ開始: ${job.articleId}`,
          data: { articleId: job.articleId, configPath: job.configPath }
        });
      }

      // 出力ディレクトリ準備
      const outputDir = path.join('public/images/blog/auto-generated', job.articleId);
      await fs.mkdir(outputDir, { recursive: true });

      // Phase A方式でPython実行
      const startTime = Date.now();
      const generatedFiles = await this.executePhaseAStyle(job.configPath, outputDir, sessionId);
      const generationDuration = (Date.now() - startTime) / 1000;

      if (logger.logToContentFlow) {
        await logger.logToContentFlow({
          level: 'INFO',
          source: 'hybrid-worker',
          sessionId,
          phase: 'image-generation',
          action: 'complete',
          message: `画像生成完了: ${generatedFiles.length}枚`,
          data: { 
            articleId: job.articleId, 
            imageCount: generatedFiles.length,
            duration: generationDuration
          }
        });
      }

      // Sanity CMS統合
      await this.integrateSanityImages(job.articleId, outputDir, sessionId);

      // 完了記録作成
      await this.recordCompletion(job, generatedFiles, outputDir);

      // フラグファイル削除
      await fs.unlink(flagPath);

      console.log(`✅ Job completed successfully: ${job.articleId}`);
      console.log(`📂 Generated ${generatedFiles.length} images in: ${outputDir}`);

    } catch (error) {
      console.error(`❌ Job failed:`, error);
      
      if (logger.logError) {
        await logger.logError(sessionId, 'image-generation', 'hybrid-worker', error);
      }
      
      // エラー時はフラグファイルを保持（手動確認用）
      try {
        const flagData = await fs.readFile(flagPath, 'utf-8');
        const job = JSON.parse(flagData);
        job.status = 'failed';
        job.error = error.message;
        job.failedAt = new Date().toISOString();
        
        await fs.writeFile(flagPath, JSON.stringify(job, null, 2));
      } catch (writeError) {
        console.error('Failed to update flag file with error:', writeError);
      }
    }
  }

  async executePhaseAStyle(configPath, outputDir, sessionId = 'unknown') {
    return new Promise((resolve, reject) => {
      console.log(`🐍 Phase A Style Execution:`);
      console.log(`   Config: ${configPath}`);
      console.log(`   Output: ${outputDir}`);

      const pythonProcess = spawn(this.pythonEnvPath, [
        this.scriptPath,
        '--config', configPath,
        '--output', outputDir,
        '--variations', '1'
      ], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env }
      });

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        const output = data.toString().trim();
        stdout += output;
        console.log(`[Python]: ${output}`);
      });

      pythonProcess.stderr.on('data', (data) => {
        const output = data.toString().trim();
        stderr += output;
        console.error(`[Python Error]: ${output}`);
      });

      pythonProcess.on('close', async (code) => {
        if (code === 0) {
          try {
            // 生成ファイル一覧取得
            const files = await fs.readdir(outputDir);
            const imageFiles = files.filter(file => 
              file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg')
            );
            const fullPaths = imageFiles.map(file => path.join(outputDir, file));
            
            console.log(`✅ Phase A execution completed. Generated ${imageFiles.length} images.`);
            resolve(fullPaths);
          } catch (error) {
            reject(new Error(`Failed to read generated files: ${error}`));
          }
        } else {
          reject(new Error(`Python script failed with code ${code}. Stderr: ${stderr}`));
        }
      });

      pythonProcess.on('error', (error) => {
        reject(new Error(`Failed to start Python process: ${error.message}`));
      });

      // タイムアウト設定 (30分)
      const timeout = setTimeout(() => {
        pythonProcess.kill('SIGTERM');
        reject(new Error('Python script execution timed out (30 minutes)'));
      }, 30 * 60 * 1000);

      pythonProcess.on('close', () => {
        clearTimeout(timeout);
      });
    });
  }

  async integrateSanityImages(articleId, outputDir, sessionId = 'unknown') {
    try {
      console.log(`🔄 Starting Sanity integration for article: ${articleId}`);
      
      if (logger.logToContentFlow) {
        await logger.logToContentFlow({
          level: 'INFO',
          source: 'hybrid-worker',
          sessionId,
          phase: 'sanity-integration',
          action: 'start',
          message: `Sanity統合開始: ${articleId}`,
          data: { articleId, outputDir }
        });
      }
      
      const integrationProcess = spawn('node', [
        path.join(__dirname, 'sanity-integration.js'),
        articleId,
        outputDir,
        sessionId  // セッションIDを渡す
      ], {
        stdio: 'inherit',
        env: { ...process.env }
      });

      return new Promise((resolve, reject) => {
        integrationProcess.on('close', async (code) => {
          if (code === 0) {
            console.log(`✅ Sanity integration completed for article: ${articleId}`);
            
            if (logger.logToContentFlow) {
              await logger.logToContentFlow({
                level: 'INFO',
                source: 'hybrid-worker',
                sessionId,
                phase: 'sanity-integration',
                action: 'complete',
                message: `Sanity統合完了: ${articleId}`,
                data: { articleId }
              });
            }
            
            resolve();
          } else {
            console.error(`❌ Sanity integration failed with code: ${code}`);
            
            if (logger.logError) {
              await logger.logError(sessionId, 'sanity-integration', 'hybrid-worker', 
                new Error(`Sanity integration failed with code ${code}`));
            }
            
            reject(new Error(`Sanity integration failed with code ${code}`));
          }
        });

        integrationProcess.on('error', async (error) => {
          console.error(`❌ Failed to start Sanity integration:`, error);
          
          if (logger.logError) {
            await logger.logError(sessionId, 'sanity-integration', 'hybrid-worker', error);
          }
          
          reject(error);
        });
      });

    } catch (error) {
      console.error(`❌ Sanity integration error:`, error);
      
      if (logger.logError) {
        await logger.logError(sessionId, 'sanity-integration', 'hybrid-worker', error);
      }
      
      throw error;
    }
  }

  async recordCompletion(job, generatedFiles, outputDir) {
    const completion = {
      articleId: job.articleId,
      configPath: job.configPath,
      outputDir,
      generatedFiles,
      imageCount: generatedFiles.length,
      startedAt: job.createdAt,
      completedAt: new Date().toISOString(),
      duration: Date.now() - new Date(job.createdAt).getTime(),
      status: 'completed'
    };

    const completionPath = path.join(this.completedDir, `${job.articleId}.json`);
    await fs.writeFile(completionPath, JSON.stringify(completion, null, 2));

    console.log(`📄 Completion record saved: ${completionPath}`);
  }

  async getStats() {
    try {
      const [pendingFiles, completedFiles] = await Promise.all([
        fs.readdir(this.flagsDir).then(files => files.filter(f => f.endsWith('.flag'))),
        fs.readdir(this.completedDir).then(files => files.filter(f => f.endsWith('.json')))
      ]);

      return {
        isRunning: this.isRunning,
        pending: pendingFiles.length,
        completed: completedFiles.length,
        lastCheck: new Date().toISOString()
      };
    } catch (error) {
      return {
        isRunning: this.isRunning,
        error: error.message
      };
    }
  }
}

// メイン実行
console.log('🚀 Starting Phase C Hybrid Image Worker...');
console.log('🎯 Phase A方式（直接Python実行）+ バックグラウンド処理');

const worker = new HybridImageWorker();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  worker.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  worker.stop();
  process.exit(0);
});

// ワーカー開始
worker.start().catch(error => {
  console.error('❌ Failed to start hybrid worker:', error);
  process.exit(1);
});

// 統計情報定期表示
setInterval(async () => {
  if (worker.isRunning) {
    const stats = await worker.getStats();
    console.log(`📊 Stats: ${stats.pending} pending, ${stats.completed} completed`);
  }
}, 30000); // 30秒間隔