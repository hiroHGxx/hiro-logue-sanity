/**
 * ContentFlow自動画像管理システム
 * Phase A: 自動保存システム
 */

import { promises as fs } from 'fs'
import path from 'path'
import { spawn } from 'child_process'

export interface ImageGenerationConfig {
  title: string
  slug: string
  prompts: Array<{
    name: string
    prompt: string
    negative_prompt: string
    filename_prefix: string
    description: string
  }>
  article_info: {
    title: string
    estimated_scenes: number
    style: string
    theme: string
  }
}

export interface ImageGenerationResult {
  success: boolean
  generated_files?: Record<string, string[]>
  output_directory?: string
  stats?: {
    total_images: number
    successful_generations: number
    failed_generations: number
    total_time: number
  }
  error?: string
}

export class AutoImageManager {
  private baseOutputDir: string
  private pythonEnv: string
  private sdScript: string

  constructor() {
    // ContentFlow設定
    this.baseOutputDir = path.join(process.cwd(), 'public', 'images', 'blog', 'auto-generated')
    this.pythonEnv = '/Users/gotohiro/Documents/user/Products/stable-diffusion-local/venv310/bin/python'
    this.sdScript = path.join(process.cwd(), 'scripts', 'auto-sd-generator.py')
  }

  /**
   * 記事用のディレクトリ構造を作成
   */
  async createArticleDirectory(slug: string): Promise<string> {
    const timestamp = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    const articleDir = path.join(this.baseOutputDir, `${timestamp}-${slug}`)
    
    try {
      await fs.mkdir(articleDir, { recursive: true })
      console.log(`📁 記事ディレクトリ作成: ${articleDir}`)
      return articleDir
    } catch (error) {
      console.error('❌ ディレクトリ作成エラー:', error)
      throw new Error(`ディレクトリ作成に失敗しました: ${error}`)
    }
  }

  /**
   * プロンプト設定をJSONファイルとして保存
   */
  async savePromptConfig(config: ImageGenerationConfig, outputDir: string): Promise<string> {
    const configPath = path.join(outputDir, 'prompts.json')
    
    try {
      await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8')
      console.log(`💾 プロンプト設定保存: ${configPath}`)
      return configPath
    } catch (error) {
      console.error('❌ 設定ファイル保存エラー:', error)
      throw new Error(`設定ファイルの保存に失敗しました: ${error}`)
    }
  }

  /**
   * Stable Diffusion実行環境の確認
   */
  async validateSDEnvironment(): Promise<boolean> {
    try {
      // Python環境の確認
      const pythonExists = await fs.access(this.pythonEnv).then(() => true).catch(() => false)
      if (!pythonExists) {
        console.error(`❌ Python環境が見つかりません: ${this.pythonEnv}`)
        return false
      }

      // SDスクリプトの確認
      const scriptExists = await fs.access(this.sdScript).then(() => true).catch(() => false)
      if (!scriptExists) {
        console.error(`❌ SDスクリプトが見つかりません: ${this.sdScript}`)
        return false
      }

      console.log('✅ SD実行環境確認完了')
      return true
    } catch (error) {
      console.error('❌ SD環境確認エラー:', error)
      return false
    }
  }

  /**
   * Stable Diffusion画像生成実行
   */
  async executeImageGeneration(
    configPath: string, 
    outputDir: string, 
    variations: number = 1,
    testMode: boolean = false
  ): Promise<ImageGenerationResult> {
    try {
      console.log('🎨 Stable Diffusion画像生成開始...')
      
      // 実行環境確認
      if (!(await this.validateSDEnvironment())) {
        return {
          success: false,
          error: 'Stable Diffusion実行環境が無効です'
        }
      }

      // コマンド構築
      const args = [
        this.sdScript,
        '--config', configPath,
        '--output', outputDir,
        '--variations', variations.toString()
      ]
      
      if (testMode) {
        args.push('--test')
      }

      console.log(`🔧 実行コマンド: ${this.pythonEnv} ${args.join(' ')}`)

      // Promise化されたspawn実行
      const result = await new Promise<ImageGenerationResult>((resolve, reject) => {
        const process = spawn(this.pythonEnv, args, {
          stdio: ['inherit', 'pipe', 'pipe']
        })

        let stdout = ''
        let stderr = ''

        process.stdout?.on('data', (data) => {
          const output = data.toString()
          stdout += output
          console.log(output.trim()) // リアルタイム出力
        })

        process.stderr?.on('data', (data) => {
          const output = data.toString()
          stderr += output
          console.error(output.trim())
        })

        process.on('close', async (code) => {
          if (code === 0) {
            try {
              // 結果ファイル読み込み
              const resultPath = path.join(outputDir, 'generation_result.json')
              const resultExists = await fs.access(resultPath).then(() => true).catch(() => false)
              
              if (resultExists) {
                const resultData = await fs.readFile(resultPath, 'utf-8')
                const result = JSON.parse(resultData)
                resolve({
                  success: true,
                  ...result,
                  output_directory: outputDir
                })
              } else {
                resolve({
                  success: true,
                  output_directory: outputDir,
                  generated_files: {},
                  stats: { total_images: 0, successful_generations: 0, failed_generations: 0, total_time: 0 }
                })
              }
            } catch (error) {
              reject(new Error(`結果ファイル読み込みエラー: ${error}`))
            }
          } else {
            reject(new Error(`SD実行エラー (exit code: ${code})\nstderr: ${stderr}`))
          }
        })

        process.on('error', (error) => {
          reject(new Error(`SD実行プロセスエラー: ${error.message}`))
        })
      })

      return result

    } catch (error) {
      console.error('❌ 画像生成実行エラー:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '画像生成中に不明なエラーが発生しました'
      }
    }
  }

  /**
   * 生成された画像ファイルの情報を取得
   */
  async getGeneratedImageInfo(outputDir: string): Promise<Array<{
    name: string
    files: Array<{
      filename: string
      path: string
      relativePath: string
      size: number
    }>
  }>> {
    try {
      const resultPath = path.join(outputDir, 'generation_result.json')
      const resultExists = await fs.access(resultPath).then(() => true).catch(() => false)
      
      if (!resultExists) {
        return []
      }

      const resultData = await fs.readFile(resultPath, 'utf-8')
      const result = JSON.parse(resultData)
      
      if (!result.generated_files) {
        return []
      }

      const imageInfo = []
      
      for (const [name, files] of Object.entries(result.generated_files as Record<string, string[]>)) {
        const fileDetails = []
        
        for (const filePath of files) {
          try {
            const stats = await fs.stat(filePath)
            const relativePath = path.relative(path.join(process.cwd(), 'public'), filePath)
            
            fileDetails.push({
              filename: path.basename(filePath),
              path: filePath,
              relativePath: '/' + relativePath.replace(/\\/g, '/'), // Web用パス
              size: stats.size
            })
          } catch (error) {
            console.warn(`⚠️ ファイル情報取得失敗: ${filePath}`)
          }
        }
        
        imageInfo.push({
          name,
          files: fileDetails
        })
      }

      return imageInfo
    } catch (error) {
      console.error('❌ 画像情報取得エラー:', error)
      return []
    }
  }

  /**
   * 完全な画像生成ワークフローを実行
   */
  async executeCompleteWorkflow(
    config: ImageGenerationConfig,
    options: {
      variations?: number
      testMode?: boolean
    } = {}
  ): Promise<{
    success: boolean
    outputDir?: string
    imageInfo?: Array<{ name: string; files: Array<{ filename: string; path: string; relativePath: string; size: number }> }>
    stats?: any
    error?: string
  }> {
    const { variations = 1, testMode = false } = options

    try {
      console.log('🚀 ContentFlow自動画像生成ワークフロー開始')
      console.log(`📝 記事: ${config.title}`)
      console.log(`🎨 スタイル: ${config.article_info.style}`)
      console.log(`📊 生成予定: ${config.prompts.length}シーン × ${variations}バリエーション`)

      // Step 1: ディレクトリ作成
      const outputDir = await this.createArticleDirectory(config.slug)

      // Step 2: プロンプト設定保存
      const configPath = await this.savePromptConfig(config, outputDir)

      // Step 3: 画像生成実行
      const generationResult = await this.executeImageGeneration(configPath, outputDir, variations, testMode)

      if (!generationResult.success) {
        return {
          success: false,
          error: generationResult.error
        }
      }

      // Step 4: 生成画像情報取得
      const imageInfo = await this.getGeneratedImageInfo(outputDir)

      console.log('🎉 自動画像生成ワークフロー完了!')
      return {
        success: true,
        outputDir,
        imageInfo,
        stats: generationResult.stats
      }

    } catch (error) {
      console.error('❌ ワークフローエラー:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '不明なエラーが発生しました'
      }
    }
  }
}

export default AutoImageManager