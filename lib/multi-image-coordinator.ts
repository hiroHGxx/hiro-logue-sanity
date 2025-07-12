/**
 * 複数画像生成コーディネーター
 * 状態管理システムと統合した効率的な画像生成制御
 */

import { ImageStatusManager, GeneratedVariation } from './image-status-manager';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';

export interface ImageGenerationConfig {
  theme: string;
  positions: ('header' | 'section1' | 'section2' | 'section3')[];
  variations: number; // 各位置あたりのバリエーション数
  outputDir: string;
  pythonPath?: string;
  sessionId?: string;
}

export interface GenerationResult {
  success: boolean;
  sessionId: string;
  completedVariations: string[];
  failedVariations: string[];
  totalTime: number;
  backgroundProcessing: boolean;
}

export class MultiImageCoordinator {
  private static readonly PYTHON_PATH = '/Users/gotohiro/Documents/user/Products/stable-diffusion-local/venv310/bin/python';
  private static readonly SCRIPT_PATH = '/Users/gotohiro/Documents/user/Products/ContentFlow/sanity-edition/test-1x4-variations.py';

  /**
   * 複数画像生成を開始（状態管理統合）
   */
  static async generateImages(config: ImageGenerationConfig): Promise<GenerationResult> {
    const startTime = Date.now();
    const sessionId = config.sessionId || `multi_${Date.now()}`;
    const totalImages = config.positions.length * config.variations;
    
    // 推定時間計算（位置あたり5分と仮定）
    const estimatedMinutes = config.positions.length * 5;
    const shouldBackground = await ImageStatusManager.shouldUseBackgroundProcessing(estimatedMinutes);

    try {
      // セッション開始
      await ImageStatusManager.startSession(totalImages, sessionId);
      console.log(`🚀 画像生成セッション開始: ${sessionId}`);
      console.log(`📊 推定時間: ${estimatedMinutes}分 (${shouldBackground ? 'バックグラウンド' : '直接'}処理)`);

      // バリエーション定義
      const variations: GeneratedVariation[] = [];
      for (const position of config.positions) {
        for (let i = 1; i <= config.variations; i++) {
          const variationId = `${position}-${String(i).padStart(3, '0')}`;
          const filename = `${config.theme}-${position}-${String(i).padStart(3, '0')}-${this.getTimestamp()}.png`;
          
          variations.push({
            id: variationId,
            position,
            filename,
            status: 'pending'
          });
          
          await ImageStatusManager.addVariation({
            id: variationId,
            position,
            filename,
            status: 'pending'
          });
        }
      }

      console.log(`📝 ${variations.length}個のバリエーション定義完了`);

      // バックグラウンド処理の場合
      if (shouldBackground) {
        return await this.startBackgroundGeneration(config, variations, sessionId, startTime);
      }

      // 直接処理の場合
      return await this.executeDirectGeneration(config, variations, sessionId, startTime);

    } catch (error) {
      await ImageStatusManager.markFailed(`Generation failed: ${error}`);
      throw error;
    }
  }

  /**
   * バックグラウンド画像生成
   */
  private static async startBackgroundGeneration(
    config: ImageGenerationConfig,
    variations: GeneratedVariation[],
    sessionId: string,
    startTime: number
  ): Promise<GenerationResult> {
    console.log('🔄 バックグラウンド処理で画像生成を開始');
    
    await ImageStatusManager.markGenerating('バックグラウンド生成開始');

    // バックグラウンドワーカーファイル作成
    const workerScript = await this.createWorkerScript(config, variations);
    
    // ワーカープロセス起動（非同期）
    const workerProcess = spawn('node', [workerScript], {
      detached: true,
      stdio: 'ignore'
    });
    
    workerProcess.unref(); // メインプロセスの終了を妨げない

    console.log(`🚀 バックグラウンドワーカー起動 (PID: ${workerProcess.pid})`);
    console.log('📋 進捗確認: /api/image-status で確認可能');
    console.log('⏰ Claude Codeセッション終了後も処理継続');

    return {
      success: true,
      sessionId,
      completedVariations: [],
      failedVariations: [],
      totalTime: Date.now() - startTime,
      backgroundProcessing: true
    };
  }

  /**
   * 直接画像生成（Claude Code内）
   */
  private static async executeDirectGeneration(
    config: ImageGenerationConfig,
    variations: GeneratedVariation[],
    sessionId: string,
    startTime: number
  ): Promise<GenerationResult> {
    console.log('⚡ 直接処理で画像生成を実行');
    
    await ImageStatusManager.markGenerating('直接生成開始');

    const completedVariations: string[] = [];
    const failedVariations: string[] = [];

    for (const variation of variations) {
      try {
        console.log(`🎨 生成中: ${variation.id} (${variation.position})`);
        
        // Python スクリプト実行
        const result = await this.executePythonScript(config, variation);
        
        if (result.success) {
          await ImageStatusManager.markVariationCompleted(
            variation.id,
            variation.filename,
            result.outputPath
          );
          completedVariations.push(variation.id);
          console.log(`✅ 完了: ${variation.id}`);
        } else {
          await ImageStatusManager.markVariationFailed(variation.id, result.error || 'Generation failed');
          failedVariations.push(variation.id);
          console.log(`❌ 失敗: ${variation.id} - ${result.error}`);
        }

        // タイムアウトチェック
        const isTimeout = await ImageStatusManager.checkTimeout();
        if (isTimeout) {
          console.log('⏰ Claude Codeタイムアウト検出 - バックグラウンド処理に切り替え');
          return await this.switchToBackground(config, variations, sessionId, startTime, completedVariations, failedVariations);
        }

      } catch (error) {
        await ImageStatusManager.markVariationFailed(variation.id, error instanceof Error ? error.message : 'Unknown error');
        failedVariations.push(variation.id);
        console.log(`❌ エラー: ${variation.id} - ${error}`);
      }
    }

    // セッション完了
    await ImageStatusManager.markCompleted();

    return {
      success: failedVariations.length === 0,
      sessionId,
      completedVariations,
      failedVariations,
      totalTime: Date.now() - startTime,
      backgroundProcessing: false
    };
  }

  /**
   * バックグラウンド処理に切り替え
   */
  private static async switchToBackground(
    config: ImageGenerationConfig,
    variations: GeneratedVariation[],
    sessionId: string,
    startTime: number,
    completedVariations: string[],
    failedVariations: string[]
  ): Promise<GenerationResult> {
    console.log('🔄 バックグラウンド処理に切り替え中...');
    
    // 残りのバリエーションを取得
    const remainingVariations = variations.filter(v => 
      !completedVariations.includes(v.id) && !failedVariations.includes(v.id)
    );

    if (remainingVariations.length > 0) {
      const workerScript = await this.createWorkerScript(
        config, 
        remainingVariations,
        completedVariations,
        failedVariations
      );
      
      const workerProcess = spawn('node', [workerScript], {
        detached: true,
        stdio: 'ignore'
      });
      
      workerProcess.unref();
      console.log(`🚀 残り${remainingVariations.length}個のバリエーションをバックグラウンド処理`);
    }

    return {
      success: true,
      sessionId,
      completedVariations,
      failedVariations,
      totalTime: Date.now() - startTime,
      backgroundProcessing: true
    };
  }

  /**
   * Python スクリプト実行
   */
  private static async executePythonScript(
    config: ImageGenerationConfig,
    variation: GeneratedVariation
  ): Promise<{ success: boolean; outputPath?: string; error?: string }> {
    return new Promise((resolve) => {
      const outputPath = path.join(config.outputDir, variation.filename);
      
      const pythonProcess = spawn(this.PYTHON_PATH, [
        this.SCRIPT_PATH,
        '--theme', config.theme,
        '--position', variation.position,
        '--output', outputPath
      ]);

      let stderr = '';
      
      pythonProcess.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true, outputPath });
        } else {
          resolve({ success: false, error: stderr || `Process exited with code ${code}` });
        }
      });

      pythonProcess.on('error', (error) => {
        resolve({ success: false, error: error.message });
      });
    });
  }

  /**
   * ワーカースクリプト作成
   */
  private static async createWorkerScript(
    config: ImageGenerationConfig,
    variations: GeneratedVariation[],
    completedVariations: string[] = [],
    failedVariations: string[] = []
  ): Promise<string> {
    const workerPath = path.join(process.cwd(), `worker-${Date.now()}.js`);
    
    const workerContent = `
// 自動生成されたバックグラウンドワーカー
const { spawn } = require('child_process');
const fs = require('fs').promises;

const config = ${JSON.stringify(config)};
const variations = ${JSON.stringify(variations)};
const sessionId = "${config.sessionId}";

async function executeBackgroundGeneration() {
  console.log('🔄 バックグラウンド画像生成開始');
  
  for (const variation of variations) {
    try {
      console.log(\`🎨 生成中: \${variation.id}\`);
      
      // Python実行（簡略版）
      const result = await executePython(variation);
      
      if (result.success) {
        console.log(\`✅ 完了: \${variation.id}\`);
      } else {
        console.log(\`❌ 失敗: \${variation.id}\`);
      }
      
    } catch (error) {
      console.log(\`❌ エラー: \${variation.id} - \${error.message}\`);
    }
  }
  
  console.log('🎉 バックグラウンド生成完了');
  
  // 自分自身を削除
  await fs.unlink(__filename);
}

function executePython(variation) {
  return new Promise((resolve) => {
    const pythonProcess = spawn('${this.PYTHON_PATH}', [
      '${this.SCRIPT_PATH}',
      '--theme', config.theme,
      '--position', variation.position,
      '--output', \`\${config.outputDir}/\${variation.filename}\`
    ]);
    
    pythonProcess.on('close', (code) => {
      resolve({ success: code === 0 });
    });
    
    pythonProcess.on('error', () => {
      resolve({ success: false });
    });
  });
}

executeBackgroundGeneration().catch(console.error);
`;

    await fs.writeFile(workerPath, workerContent);
    return workerPath;
  }

  /**
   * タイムスタンプ生成
   */
  private static getTimestamp(): string {
    const now = new Date();
    return now.toISOString().replace(/[:.]/g, '').slice(0, 15);
  }

  /**
   * 進捗確認
   */
  static async getProgress(): Promise<any> {
    return await ImageStatusManager.getProgress();
  }

  /**
   * セッション停止
   */
  static async stopSession(): Promise<void> {
    await ImageStatusManager.clearSession();
  }
}