/**
 * バックグラウンドプロセス管理システム V2
 * Claude Codeタイムアウト制約を回避するため、長時間タスクを
 * バックグラウンドプロセスで実行し、状態をモニタリングする
 */

import { exec, spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

export interface BackgroundProcessConfig {
  sessionId: string;
  totalImages: number;
  imagePrompts?: ImagePromptConfig[];
  outputDir?: string;
}

export interface ImagePromptConfig {
  position: string;
  prompt: string;
  negativePrompt: string;
  style: string;
  description: string;
  parameters: {
    width: number;
    height: number;
    num_inference_steps: number;
    guidance_scale: number;
  };
}

export interface BackgroundProcessStatus {
  isRunning: boolean;
  pid?: number;
  sessionId?: string;
  startedAt?: string;
  progress?: {
    completed: number;
    total: number;
    failed: number;
  };
}

export interface GenerationStatus {
  sessionId?: string;
  status: string;
  imageGeneration?: {
    startedAt: string;
    total: number;
    completed: number;
    failed: number;
    results: any[];
  };
  prompts?: any[];
}

export class BackgroundProcessManager {
  private static readonly PYTHON_PATH = '/Users/gotohiro/Documents/user/Products/stable-diffusion-local/venv310/bin/python';
  private static readonly SCRIPT_PATH = path.join(process.cwd(), 'background-image-generator.py');
  private static readonly PID_FILE = path.join(process.cwd(), 'background-generator.pid');
  private static readonly LOG_FILE = path.join(process.cwd(), 'background-generation.log');
  private static readonly STATUS_FILE = path.join(process.cwd(), 'image-generation-status.json');

  /**
   * バックグラウンドプロセスの状態チェック
   */
  static async getProcessStatus(): Promise<BackgroundProcessStatus> {
    try {
      // PIDファイル存在確認
      const pidExists = await fs.access(this.PID_FILE).then(() => true).catch(() => false);
      
      if (!pidExists) {
        return { isRunning: false };
      }

      // PID読み込み
      const pidContent = await fs.readFile(this.PID_FILE, 'utf-8');
      const pid = parseInt(pidContent.trim());

      // プロセス存在確認
      const isRunning = await this.isProcessRunning(pid);
      
      if (!isRunning) {
        // PIDファイル削除
        await fs.unlink(this.PID_FILE).catch(() => {});
        return { isRunning: false };
      }

      // 状態ファイルから詳細情報取得
      const statusData = await this.getGenerationStatus();
      
      return {
        isRunning: true,
        pid,
        sessionId: statusData.sessionId,
        startedAt: statusData.imageGeneration?.startedAt,
        progress: {
          completed: statusData.imageGeneration?.completed || 0,
          total: statusData.imageGeneration?.total || 0,
          failed: statusData.imageGeneration?.failed || 0
        }
      };

    } catch (error) {
      console.error('Process status check error:', error);
      return { isRunning: false };
    }
  }

  /**
   * 画像生成状態取得
   */
  static async getGenerationStatus(): Promise<GenerationStatus> {
    try {
      const statusExists = await fs.access(this.STATUS_FILE).then(() => true).catch(() => false);
      
      if (!statusExists) {
        return { status: 'not_started' };
      }

      const statusContent = await fs.readFile(this.STATUS_FILE, 'utf-8');
      return JSON.parse(statusContent);

    } catch (error) {
      console.error('Generation status read error:', error);
      return { status: 'error' };
    }
  }

  /**
   * バックグラウンド画像生成開始
   */
  static async startBackgroundGeneration(config: BackgroundProcessConfig): Promise<{ success: boolean; message: string; pid?: number }> {
    try {
      // 既存プロセス確認
      const currentStatus = await this.getProcessStatus();
      if (currentStatus.isRunning) {
        return {
          success: false,
          message: `バックグラウンドプロセスが既に実行中です (PID: ${currentStatus.pid})`
        };
      }

      console.log('🚀 バックグラウンド画像生成開始...');
      console.log(`📋 セッション ID: ${config.sessionId}`);
      console.log(`🎨 画像数: ${config.totalImages}`);

      // Python スクリプト引数準備
      const args = [
        this.SCRIPT_PATH,
        '--session-id', config.sessionId
      ];

      // バックグラウンドプロセス起動
      const child = spawn(this.PYTHON_PATH, args, {
        detached: true,
        stdio: ['ignore', 'ignore', 'ignore'],
        cwd: process.cwd()
      });

      // 親プロセスから切り離し
      child.unref();

      // PIDファイル保存
      await fs.writeFile(this.PID_FILE, child.pid!.toString(), 'utf-8');

      console.log(`✅ バックグラウンドプロセス起動成功`);
      console.log(`🔧 PID: ${child.pid}`);
      console.log(`⏰ 推定完了時間: 15-20分後`);

      return {
        success: true,
        message: 'バックグラウンド画像生成を開始しました',
        pid: child.pid
      };

    } catch (error) {
      console.error('Background generation start error:', error);
      return {
        success: false,
        message: `バックグラウンド生成開始エラー: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * バックグラウンドプロセス停止
   */
  static async stopBackgroundGeneration(): Promise<{ success: boolean; message: string }> {
    try {
      const status = await this.getProcessStatus();
      
      if (!status.isRunning || !status.pid) {
        return {
          success: false,
          message: 'バックグラウンドプロセスは実行されていません'
        };
      }

      // プロセス終了
      process.kill(status.pid, 'SIGTERM');

      // PIDファイル削除
      await fs.unlink(this.PID_FILE).catch(() => {});

      return {
        success: true,
        message: `バックグラウンドプロセス (PID: ${status.pid}) を停止しました`
      };

    } catch (error) {
      console.error('Background generation stop error:', error);
      return {
        success: false,
        message: `バックグラウンド生成停止エラー: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * プロセスログ取得
   */
  static async getProcessLogs(lines: number = 50): Promise<string[]> {
    try {
      const logExists = await fs.access(this.LOG_FILE).then(() => true).catch(() => false);
      
      if (!logExists) {
        return ['ログファイルが見つかりません'];
      }

      const logContent = await fs.readFile(this.LOG_FILE, 'utf-8');
      const logLines = logContent.split('\n').filter(line => line.trim());
      
      return logLines.slice(-lines);

    } catch (error) {
      console.error('Log read error:', error);
      return [`ログ読み込みエラー: ${error instanceof Error ? error.message : 'Unknown error'}`];
    }
  }

  /**
   * プロセス実行中チェック
   */
  private static async isProcessRunning(pid: number): Promise<boolean> {
    try {
      process.kill(pid, 0); // シグナル0で存在確認
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 状態ファイル初期化
   */
  static async initializeStatus(config: BackgroundProcessConfig): Promise<void> {
    const statusData = {
      sessionId: config.sessionId,
      status: "preparing",
      imageGeneration: {
        startedAt: new Date().toISOString(),
        total: config.totalImages,
        completed: 0,
        failed: 0,
        results: []
      },
      prompts: config.imagePrompts || []
    };

    await fs.writeFile(this.STATUS_FILE, JSON.stringify(statusData, null, 2), 'utf-8');
  }
}