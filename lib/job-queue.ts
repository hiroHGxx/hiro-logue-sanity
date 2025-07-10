/**
 * ContentFlow ジョブキューシステム
 * Phase B: バックグラウンド処理用ジョブ管理
 */

import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// ジョブタイプ定義
export type JobType = 'image-generation' | 'image-upload' | 'article-update';

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Job {
  id: string;
  type: JobType;
  status: JobStatus;
  data: Record<string, any>;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
  retryCount: number;
  maxRetries: number;
}

export interface ImageGenerationJobData {
  articleId: string;
  title: string;
  content: string;
  style: string;
  outputDir: string;
  prompts: Array<{
    name: string;
    prompt: string;
    negative_prompt: string;
    filename_prefix: string;
    description: string;
  }>;
}

export class JobQueue {
  private queueDir: string;
  private processingDir: string;
  private completedDir: string;
  private failedDir: string;

  constructor(baseDir: string = './data/jobs') {
    this.queueDir = path.join(baseDir, 'pending');
    this.processingDir = path.join(baseDir, 'processing');
    this.completedDir = path.join(baseDir, 'completed');
    this.failedDir = path.join(baseDir, 'failed');
  }

  /**
   * キューシステム初期化
   */
  async initialize(): Promise<void> {
    const dirs = [this.queueDir, this.processingDir, this.completedDir, this.failedDir];
    
    for (const dir of dirs) {
      try {
        await fs.mkdir(dir, { recursive: true });
      } catch (error) {
        console.error(`Failed to create directory ${dir}:`, error);
      }
    }
  }

  /**
   * ジョブをキューに追加
   */
  async addJob(type: JobType, data: Record<string, any>, maxRetries: number = 3): Promise<string> {
    const job: Job = {
      id: uuidv4(),
      type,
      status: 'pending',
      data,
      createdAt: new Date().toISOString(),
      retryCount: 0,
      maxRetries
    };

    const jobFile = path.join(this.queueDir, `${job.id}.json`);
    await fs.writeFile(jobFile, JSON.stringify(job, null, 2));

    console.log(`🎯 Job added to queue: ${job.id} (${type})`);
    return job.id;
  }

  /**
   * 次の実行可能ジョブを取得
   */
  async getNextJob(): Promise<Job | null> {
    try {
      const files = await fs.readdir(this.queueDir);
      const jobFiles = files.filter(file => file.endsWith('.json'));

      if (jobFiles.length === 0) {
        return null;
      }

      // 最も古いジョブを選択
      jobFiles.sort();
      const jobFile = jobFiles[0];
      const jobPath = path.join(this.queueDir, jobFile);
      
      const jobData = await fs.readFile(jobPath, 'utf-8');
      const job: Job = JSON.parse(jobData);

      // ジョブを処理中に移動
      await this.moveJobToProcessing(job);
      
      return job;
    } catch (error) {
      console.error('Error getting next job:', error);
      return null;
    }
  }

  /**
   * ジョブを処理中ステータスに移動
   */
  private async moveJobToProcessing(job: Job): Promise<void> {
    job.status = 'processing';
    job.startedAt = new Date().toISOString();

    const oldPath = path.join(this.queueDir, `${job.id}.json`);
    const newPath = path.join(this.processingDir, `${job.id}.json`);

    await fs.writeFile(newPath, JSON.stringify(job, null, 2));
    await fs.unlink(oldPath);
  }

  /**
   * ジョブ完了
   */
  async completeJob(jobId: string, result?: Record<string, any>): Promise<void> {
    const processingPath = path.join(this.processingDir, `${jobId}.json`);
    
    try {
      const jobData = await fs.readFile(processingPath, 'utf-8');
      const job: Job = JSON.parse(jobData);

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

  /**
   * ジョブ失敗
   */
  async failJob(jobId: string, error: string): Promise<void> {
    const processingPath = path.join(this.processingDir, `${jobId}.json`);
    
    try {
      const jobData = await fs.readFile(processingPath, 'utf-8');
      const job: Job = JSON.parse(jobData);

      job.retryCount++;

      if (job.retryCount < job.maxRetries) {
        // リトライ: キューに戻す
        job.status = 'pending';
        job.error = error;
        
        const queuePath = path.join(this.queueDir, `${jobId}.json`);
        await fs.writeFile(queuePath, JSON.stringify(job, null, 2));
        await fs.unlink(processingPath);

        console.log(`🔄 Job retry ${job.retryCount}/${job.maxRetries}: ${jobId}`);
      } else {
        // 最大リトライ回数に達した: 失敗として記録
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

  /**
   * ジョブ状況取得
   */
  async getJobStatus(jobId: string): Promise<Job | null> {
    const dirs = [
      { dir: this.queueDir, status: 'pending' },
      { dir: this.processingDir, status: 'processing' },
      { dir: this.completedDir, status: 'completed' },
      { dir: this.failedDir, status: 'failed' }
    ];

    for (const { dir } of dirs) {
      try {
        const jobPath = path.join(dir, `${jobId}.json`);
        const jobData = await fs.readFile(jobPath, 'utf-8');
        return JSON.parse(jobData);
      } catch {
        // ファイルが見つからない場合は次のディレクトリを確認
        continue;
      }
    }

    return null;
  }

  /**
   * キュー統計情報取得
   */
  async getQueueStats(): Promise<{
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  }> {
    const stats = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0
    };

    try {
      const dirs = [
        { dir: this.queueDir, key: 'pending' as keyof typeof stats },
        { dir: this.processingDir, key: 'processing' as keyof typeof stats },
        { dir: this.completedDir, key: 'completed' as keyof typeof stats },
        { dir: this.failedDir, key: 'failed' as keyof typeof stats }
      ];

      for (const { dir, key } of dirs) {
        try {
          const files = await fs.readdir(dir);
          stats[key] = files.filter(file => file.endsWith('.json')).length;
        } catch {
          // ディレクトリが存在しない場合は0のまま
        }
      }
    } catch (error) {
      console.error('Error getting queue stats:', error);
    }

    return stats;
  }
}

// シングルトンインスタンス
export const jobQueue = new JobQueue();