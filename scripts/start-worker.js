/**
 * バックグラウンドワーカー起動スクリプト
 * CommonJS形式でNode.js直接実行用
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs/promises');

// シンプルなジョブキュー実装
class SimpleJobQueue {
  constructor(baseDir = './data/jobs') {
    this.queueDir = path.join(baseDir, 'pending');
    this.processingDir = path.join(baseDir, 'processing');
    this.completedDir = path.join(baseDir, 'completed');
    this.failedDir = path.join(baseDir, 'failed');
  }

  async initialize() {
    const dirs = [this.queueDir, this.processingDir, this.completedDir, this.failedDir];
    
    for (const dir of dirs) {
      try {
        await fs.mkdir(dir, { recursive: true });
      } catch (error) {
        console.error(`Failed to create directory ${dir}:`, error);
      }
    }
  }

  async getNextJob() {
    try {
      const files = await fs.readdir(this.queueDir);
      const jobFiles = files.filter(file => file.endsWith('.json'));

      if (jobFiles.length === 0) {
        return null;
      }

      jobFiles.sort();
      const jobFile = jobFiles[0];
      const jobPath = path.join(this.queueDir, jobFile);
      
      const jobData = await fs.readFile(jobPath, 'utf-8');
      const job = JSON.parse(jobData);

      // ジョブを処理中に移動
      job.status = 'processing';
      job.startedAt = new Date().toISOString();

      const newPath = path.join(this.processingDir, `${job.id}.json`);
      await fs.writeFile(newPath, JSON.stringify(job, null, 2));
      await fs.unlink(jobPath);
      
      return job;
    } catch (error) {
      console.error('Error getting next job:', error);
      return null;
    }
  }

  async completeJob(jobId, result) {
    const processingPath = path.join(this.processingDir, `${jobId}.json`);
    
    try {
      const jobData = await fs.readFile(processingPath, 'utf-8');
      const job = JSON.parse(jobData);

      job.status = 'completed';
      job.completedAt = new Date().toISOString();
      if (result) {
        job.data.result = result;
      }

      const completedPath = path.join(this.completedDir, `${jobId}.json`);
      await fs.writeFile(completedPath, JSON.stringify(job, null, 2));
      await fs.unlink(processingPath);

      console.log(`✅ Job completed: ${jobId}`);
    } catch (error) {
      console.error(`Error completing job ${jobId}:`, error);
    }
  }

  async failJob(jobId, error) {
    const processingPath = path.join(this.processingDir, `${jobId}.json`);
    
    try {
      const jobData = await fs.readFile(processingPath, 'utf-8');
      const job = JSON.parse(jobData);

      job.retryCount = (job.retryCount || 0) + 1;

      if (job.retryCount < (job.maxRetries || 3)) {
        // リトライ: キューに戻す
        job.status = 'pending';
        job.error = error;
        
        const queuePath = path.join(this.queueDir, `${jobId}.json`);
        await fs.writeFile(queuePath, JSON.stringify(job, null, 2));
        await fs.unlink(processingPath);

        console.log(`🔄 Job retry ${job.retryCount}/${job.maxRetries}: ${jobId}`);
      } else {
        // 失敗として記録
        job.status = 'failed';
        job.completedAt = new Date().toISOString();
        job.error = error;

        const failedPath = path.join(this.failedDir, `${jobId}.json`);
        await fs.writeFile(failedPath, JSON.stringify(job, null, 2));
        await fs.unlink(processingPath);

        console.log(`❌ Job failed permanently: ${jobId}`);
      }
    } catch (err) {
      console.error(`Error handling job failure ${jobId}:`, err);
    }
  }
}

// シンプルなワーカー実装
class SimpleImageWorker {
  constructor() {
    this.isRunning = false;
    this.pollInterval = 5000;
    this.jobQueue = new SimpleJobQueue();
    this.pythonEnvPath = '/Users/gotohiro/Documents/user/Products/stable-diffusion-local/venv310/bin/python';
    this.scriptPath = './scripts/auto-sd-generator.py';
  }

  async start() {
    if (this.isRunning) {
      console.log('⚠️ Worker already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Simple Image Worker started');

    await this.jobQueue.initialize();
    this.startPolling();
  }

  stop() {
    this.isRunning = false;
    console.log('🛑 Simple Image Worker stopped');
  }

  startPolling() {
    const poll = async () => {
      if (!this.isRunning) return;

      try {
        const job = await this.jobQueue.getNextJob();
        if (job && job.type === 'image-generation') {
          await this.processImageGenerationJob(job);
        }
      } catch (error) {
        console.error('❌ Error in polling loop:', error);
      }

      if (this.isRunning) {
        setTimeout(poll, this.pollInterval);
      }
    };

    poll();
  }

  async processImageGenerationJob(job) {
    console.log(`🎨 Processing image generation job: ${job.id}`);

    try {
      const jobData = job.data;
      
      // プロンプト設定ファイル作成
      const configPath = await this.createPromptConfig(job.id, jobData);
      
      // 出力ディレクトリ準備
      const outputDir = path.join('public/images/blog/auto-generated', job.id);
      await fs.mkdir(outputDir, { recursive: true });

      // Python スクリプト実行
      const generatedFiles = await this.executePythonScript(configPath, outputDir);

      // ジョブ完了（Sanity統合は後で追加）
      await this.jobQueue.completeJob(job.id, {
        generatedFiles,
        outputDir,
        configPath
      });

      console.log(`✅ Image generation completed: ${job.id}`);

    } catch (error) {
      console.error(`❌ Image generation failed: ${job.id}`, error);
      await this.jobQueue.failJob(job.id, error.message);
    }
  }

  async createPromptConfig(jobId, jobData) {
    const config = {
      prompts: jobData.prompts,
      article_info: {
        title: jobData.title,
        estimated_scenes: jobData.prompts.length,
        style: jobData.style,
        theme: 'auto-generated'
      }
    };

    const configPath = path.join('data/jobs/configs', `${jobId}.json`);
    await fs.mkdir(path.dirname(configPath), { recursive: true });
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));

    return configPath;
  }

  async executePythonScript(configPath, outputDir) {
    return new Promise((resolve, reject) => {
      console.log(`🐍 Executing Python script: ${configPath} -> ${outputDir}`);

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
        stdout += data.toString();
        console.log(`[Python]: ${data.toString().trim()}`);
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
        console.error(`[Python Error]: ${data.toString().trim()}`);
      });

      pythonProcess.on('close', async (code) => {
        if (code === 0) {
          try {
            const files = await fs.readdir(outputDir);
            const imageFiles = files.filter(file => file.endsWith('.png') || file.endsWith('.jpg'));
            const fullPaths = imageFiles.map(file => path.join(outputDir, file));
            
            console.log(`✅ Python script completed. Generated ${imageFiles.length} images.`);
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
        pythonProcess.kill();
        reject(new Error('Python script execution timed out (30 minutes)'));
      }, 30 * 60 * 1000);

      pythonProcess.on('close', () => {
        clearTimeout(timeout);
      });
    });
  }
}

// メイン実行
console.log('🚀 Starting Simple Image Generation Worker...');

const worker = new SimpleImageWorker();

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
  console.error('❌ Failed to start worker:', error);
  process.exit(1);
});