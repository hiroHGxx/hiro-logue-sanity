"use strict";
/**
 * ContentFlow ジョブキューシステム
 * Phase B: バックグラウンド処理用ジョブ管理
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobQueue = exports.JobQueue = void 0;
const promises_1 = require("fs/promises");
const path_1 = require("path");
const uuid_1 = require("uuid");
class JobQueue {
    constructor(baseDir = './data/jobs') {
        this.queueDir = path_1.default.join(baseDir, 'pending');
        this.processingDir = path_1.default.join(baseDir, 'processing');
        this.completedDir = path_1.default.join(baseDir, 'completed');
        this.failedDir = path_1.default.join(baseDir, 'failed');
    }
    /**
     * キューシステム初期化
     */
    async initialize() {
        const dirs = [this.queueDir, this.processingDir, this.completedDir, this.failedDir];
        for (const dir of dirs) {
            try {
                await promises_1.default.mkdir(dir, { recursive: true });
            }
            catch (error) {
                console.error(`Failed to create directory ${dir}:`, error);
            }
        }
    }
    /**
     * ジョブをキューに追加
     */
    async addJob(type, data, maxRetries = 3) {
        const job = {
            id: (0, uuid_1.v4)(),
            type,
            status: 'pending',
            data,
            createdAt: new Date().toISOString(),
            retryCount: 0,
            maxRetries
        };
        const jobFile = path_1.default.join(this.queueDir, `${job.id}.json`);
        await promises_1.default.writeFile(jobFile, JSON.stringify(job, null, 2));
        console.log(`🎯 Job added to queue: ${job.id} (${type})`);
        return job.id;
    }
    /**
     * 次の実行可能ジョブを取得
     */
    async getNextJob() {
        try {
            const files = await promises_1.default.readdir(this.queueDir);
            const jobFiles = files.filter(file => file.endsWith('.json'));
            if (jobFiles.length === 0) {
                return null;
            }
            // 最も古いジョブを選択
            jobFiles.sort();
            const jobFile = jobFiles[0];
            const jobPath = path_1.default.join(this.queueDir, jobFile);
            const jobData = await promises_1.default.readFile(jobPath, 'utf-8');
            const job = JSON.parse(jobData);
            // ジョブを処理中に移動
            await this.moveJobToProcessing(job);
            return job;
        }
        catch (error) {
            console.error('Error getting next job:', error);
            return null;
        }
    }
    /**
     * ジョブを処理中ステータスに移動
     */
    async moveJobToProcessing(job) {
        job.status = 'processing';
        job.startedAt = new Date().toISOString();
        const oldPath = path_1.default.join(this.queueDir, `${job.id}.json`);
        const newPath = path_1.default.join(this.processingDir, `${job.id}.json`);
        await promises_1.default.writeFile(newPath, JSON.stringify(job, null, 2));
        await promises_1.default.unlink(oldPath);
    }
    /**
     * ジョブ完了
     */
    async completeJob(jobId, result) {
        const processingPath = path_1.default.join(this.processingDir, `${jobId}.json`);
        try {
            const jobData = await promises_1.default.readFile(processingPath, 'utf-8');
            const job = JSON.parse(jobData);
            job.status = 'completed';
            job.completedAt = new Date().toISOString();
            if (result) {
                job.data.result = result;
            }
            const completedPath = path_1.default.join(this.completedDir, `${jobId}.json`);
            await promises_1.default.writeFile(completedPath, JSON.stringify(job, null, 2));
            await promises_1.default.unlink(processingPath);
            console.log(`✅ Job completed: ${jobId}`);
        }
        catch (error) {
            console.error(`Error completing job ${jobId}:`, error);
        }
    }
    /**
     * ジョブ失敗
     */
    async failJob(jobId, error) {
        const processingPath = path_1.default.join(this.processingDir, `${jobId}.json`);
        try {
            const jobData = await promises_1.default.readFile(processingPath, 'utf-8');
            const job = JSON.parse(jobData);
            job.retryCount++;
            if (job.retryCount < job.maxRetries) {
                // リトライ: キューに戻す
                job.status = 'pending';
                job.error = error;
                const queuePath = path_1.default.join(this.queueDir, `${jobId}.json`);
                await promises_1.default.writeFile(queuePath, JSON.stringify(job, null, 2));
                await promises_1.default.unlink(processingPath);
                console.log(`🔄 Job retry ${job.retryCount}/${job.maxRetries}: ${jobId}`);
            }
            else {
                // 最大リトライ回数に達した: 失敗として記録
                job.status = 'failed';
                job.completedAt = new Date().toISOString();
                job.error = error;
                const failedPath = path_1.default.join(this.failedDir, `${jobId}.json`);
                await promises_1.default.writeFile(failedPath, JSON.stringify(job, null, 2));
                await promises_1.default.unlink(processingPath);
                console.log(`❌ Job failed permanently: ${jobId}`);
            }
        }
        catch (err) {
            console.error(`Error handling job failure ${jobId}:`, err);
        }
    }
    /**
     * ジョブ状況取得
     */
    async getJobStatus(jobId) {
        const dirs = [
            { dir: this.queueDir, status: 'pending' },
            { dir: this.processingDir, status: 'processing' },
            { dir: this.completedDir, status: 'completed' },
            { dir: this.failedDir, status: 'failed' }
        ];
        for (const { dir } of dirs) {
            try {
                const jobPath = path_1.default.join(dir, `${jobId}.json`);
                const jobData = await promises_1.default.readFile(jobPath, 'utf-8');
                return JSON.parse(jobData);
            }
            catch {
                // ファイルが見つからない場合は次のディレクトリを確認
                continue;
            }
        }
        return null;
    }
    /**
     * キュー統計情報取得
     */
    async getQueueStats() {
        const stats = {
            pending: 0,
            processing: 0,
            completed: 0,
            failed: 0
        };
        try {
            const dirs = [
                { dir: this.queueDir, key: 'pending' },
                { dir: this.processingDir, key: 'processing' },
                { dir: this.completedDir, key: 'completed' },
                { dir: this.failedDir, key: 'failed' }
            ];
            for (const { dir, key } of dirs) {
                try {
                    const files = await promises_1.default.readdir(dir);
                    stats[key] = files.filter(file => file.endsWith('.json')).length;
                }
                catch {
                    // ディレクトリが存在しない場合は0のまま
                }
            }
        }
        catch (error) {
            console.error('Error getting queue stats:', error);
        }
        return stats;
    }
}
exports.JobQueue = JobQueue;
// シングルトンインスタンス
exports.jobQueue = new JobQueue();
