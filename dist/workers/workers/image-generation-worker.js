"use strict";
/**
 * ContentFlow 画像生成バックグラウンドワーカー
 * Phase B: 非同期画像生成処理
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.imageWorker = exports.ImageGenerationWorker = void 0;
const child_process_1 = require("child_process");
const path_1 = require("path");
const promises_1 = require("fs/promises");
const job_queue_1 = require("../lib/job-queue");
const sanity_image_upload_1 = require("../lib/sanity-image-upload");
class ImageGenerationWorker {
    constructor() {
        this.isRunning = false;
        this.pollInterval = 5000; // 5秒間隔でポーリング
        this.pythonEnvPath = '/Users/gotohiro/Documents/user/Products/stable-diffusion-local/venv310/bin/python';
        this.scriptPath = './scripts/auto-sd-generator.py';
        console.log('🤖 ImageGenerationWorker initialized');
    }
    /**
     * ワーカー開始
     */
    async start() {
        if (this.isRunning) {
            console.log('⚠️ Worker already running');
            return;
        }
        this.isRunning = true;
        console.log('🚀 ImageGenerationWorker started');
        // ジョブキューシステム初期化
        await job_queue_1.jobQueue.initialize();
        // ポーリングループ開始
        this.startPolling();
    }
    /**
     * ワーカー停止
     */
    stop() {
        this.isRunning = false;
        console.log('🛑 ImageGenerationWorker stopped');
    }
    /**
     * ポーリングループ
     */
    startPolling() {
        const poll = async () => {
            if (!this.isRunning)
                return;
            try {
                const job = await job_queue_1.jobQueue.getNextJob();
                if (job && job.type === 'image-generation') {
                    await this.processImageGenerationJob(job);
                }
            }
            catch (error) {
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
    async processImageGenerationJob(job) {
        console.log(`🎨 Processing image generation job: ${job.id}`);
        try {
            const jobData = job.data;
            // プロンプト設定ファイル作成
            const configPath = await this.createPromptConfig(job.id, jobData);
            // 出力ディレクトリ準備
            const outputDir = path_1.default.join('public/images/blog/auto-generated', job.id);
            await promises_1.default.mkdir(outputDir, { recursive: true });
            // Python スクリプト実行
            const generatedFiles = await this.executePythonScript(configPath, outputDir);
            // Sanity画像アップロード・記事更新
            const uploadResult = await sanity_image_upload_1.sanityImageUploader.processImageIntegration(outputDir, jobData.articleId, job.id);
            // ジョブ完了
            await job_queue_1.jobQueue.completeJob(job.id, {
                generatedFiles,
                outputDir,
                configPath,
                uploadResult,
                heroImageAdded: !!uploadResult.heroImage,
                sectionImagesAdded: uploadResult.sectionImages.length
            });
            console.log(`✅ Complete image integration completed: ${job.id}`);
        }
        catch (error) {
            console.error(`❌ Image generation failed: ${job.id}`, error);
            await job_queue_1.jobQueue.failJob(job.id, error instanceof Error ? error.message : 'Unknown error');
        }
    }
    /**
     * プロンプト設定ファイル作成
     */
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
        const configPath = path_1.default.join('data/jobs/configs', `${jobId}.json`);
        await promises_1.default.mkdir(path_1.default.dirname(configPath), { recursive: true });
        await promises_1.default.writeFile(configPath, JSON.stringify(config, null, 2));
        return configPath;
    }
    /**
     * Python スクリプト実行
     */
    async executePythonScript(configPath, outputDir) {
        return new Promise((resolve, reject) => {
            console.log(`🐍 Executing Python script: ${configPath} -> ${outputDir}`);
            const pythonProcess = (0, child_process_1.spawn)(this.pythonEnvPath, [
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
                        const files = await promises_1.default.readdir(outputDir);
                        const imageFiles = files.filter(file => file.endsWith('.png') || file.endsWith('.jpg'));
                        const fullPaths = imageFiles.map(file => path_1.default.join(outputDir, file));
                        console.log(`✅ Python script completed successfully. Generated ${imageFiles.length} images.`);
                        resolve(fullPaths);
                    }
                    catch (error) {
                        reject(new Error(`Failed to read generated files: ${error}`));
                    }
                }
                else {
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
    async getStats() {
        const queueStats = await job_queue_1.jobQueue.getQueueStats();
        return {
            isRunning: this.isRunning,
            queueStats
        };
    }
}
exports.ImageGenerationWorker = ImageGenerationWorker;
// シングルトンインスタンス
exports.imageWorker = new ImageGenerationWorker();
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
