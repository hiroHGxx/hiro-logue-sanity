/**
 * ContentFlow 画像生成バックグラウンドワーカー
 * Phase B: 非同期画像生成処理
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import { jobQueue, Job, ImageGenerationJobData } from '../lib/job-queue';
import { sanityImageUploader } from '../lib/sanity-image-upload';

export class ImageGenerationWorker {
  private isRunning: boolean = false;
  private pollInterval: number = 5000; // 5秒間隔でポーリング
  private pythonEnvPath: string = '/Users/gotohiro/Documents/user/Products/stable-diffusion-local/venv310/bin/python';
  private scriptPath: string = './scripts/auto-sd-generator.py';

  constructor() {
    console.log('🤖 ImageGenerationWorker initialized');
  }

  /**
   * ワーカー開始
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ Worker already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 ImageGenerationWorker started');

    // ジョブキューシステム初期化
    await jobQueue.initialize();

    // ポーリングループ開始
    this.startPolling();
  }

  /**
   * ワーカー停止
   */
  stop(): void {
    this.isRunning = false;
    console.log('🛑 ImageGenerationWorker stopped');
  }

  /**
   * ポーリングループ
   */
  private startPolling(): void {
    const poll = async () => {
      if (!this.isRunning) return;

      try {
        const job = await jobQueue.getNextJob();
        if (job && job.type === 'image-generation') {
          await this.processImageGenerationJob(job);
        }
      } catch (error) {
        console.error('❌ Error in polling loop:', error);
      }

      // 次のポーリング
      if (this.isRunning) {
        setTimeout(poll, this.pollInterval);
      }
    };

    poll();
  }

  /**
   * 画像生成ジョブ処理
   */
  private async processImageGenerationJob(job: Job): Promise<void> {
    console.log(`🎨 Processing image generation job: ${job.id}`);

    try {
      const jobData = job.data as ImageGenerationJobData;
      
      // プロンプト設定ファイル作成
      const configPath = await this.createPromptConfig(job.id, jobData);
      
      // 出力ディレクトリ準備
      const outputDir = path.join('public/images/blog/auto-generated', job.id);
      await fs.mkdir(outputDir, { recursive: true });

      // Python スクリプト実行
      const generatedFiles = await this.executePythonScript(configPath, outputDir);

      // Sanity画像アップロード・記事更新
      const uploadResult = await sanityImageUploader.processImageIntegration(
        outputDir,
        jobData.articleId,
        job.id
      );

      // ジョブ完了
      await jobQueue.completeJob(job.id, {
        generatedFiles,
        outputDir,
        configPath,
        uploadResult,
        heroImageAdded: !!uploadResult.heroImage,
        sectionImagesAdded: uploadResult.sectionImages.length
      });

      console.log(`✅ Complete image integration completed: ${job.id}`);

    } catch (error) {
      console.error(`❌ Image generation failed: ${job.id}`, error);
      await jobQueue.failJob(job.id, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * プロンプト設定ファイル作成
   */
  private async createPromptConfig(jobId: string, jobData: ImageGenerationJobData): Promise<string> {
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

  /**
   * Python スクリプト実行
   */
  private async executePythonScript(configPath: string, outputDir: string): Promise<string[]> {
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
            // 生成されたファイル一覧を取得
            const files = await fs.readdir(outputDir);
            const imageFiles = files.filter(file => file.endsWith('.png') || file.endsWith('.jpg'));
            const fullPaths = imageFiles.map(file => path.join(outputDir, file));
            
            console.log(`✅ Python script completed successfully. Generated ${imageFiles.length} images.`);
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

  /**
   * ワーカー統計情報取得
   */
  async getStats(): Promise<{
    isRunning: boolean;
    queueStats: any;
  }> {
    const queueStats = await jobQueue.getQueueStats();
    
    return {
      isRunning: this.isRunning,
      queueStats
    };
  }
}

// シングルトンインスタンス
export const imageWorker = new ImageGenerationWorker();

// スタンドアロン実行時の処理
if (require.main === module) {
  console.log('🚀 Starting Image Generation Worker...');
  
  const worker = new ImageGenerationWorker();
  
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
}