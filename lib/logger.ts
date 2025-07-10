import fs from 'fs/promises'
import path from 'path'

// ログレベル定義
export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'

// ログソース定義
export type LogSource = 'claude-code' | 'next-api' | 'hybrid-worker' | 'sanity-integration' | 'python-script'

// ワークフローフェーズ定義
export type WorkflowPhase = 'article-creation' | 'image-generation' | 'sanity-integration' | 'completion'

// アクション定義
export type LogAction = 'start' | 'progress' | 'complete' | 'error' | 'retry'

// ログエントリ型定義
export interface LogEntry {
  level: LogLevel
  source: LogSource
  sessionId: string
  phase: WorkflowPhase
  action: LogAction
  message: string
  data?: any
  duration?: number
}

// 完全なログエントリ（タイムスタンプ付き）
export interface FullLogEntry extends LogEntry {
  timestamp: string
}

// ログディレクトリ設定
const LOG_DIR = 'logs'
const MAIN_LOG_FILE = 'contentflow.log'
const ERROR_LOG_FILE = 'contentflow-error.log'

// ログディレクトリ初期化
async function ensureLogDirectory() {
  try {
    await fs.mkdir(LOG_DIR, { recursive: true })
    await fs.mkdir(path.join(LOG_DIR, 'archives'), { recursive: true })
  } catch (error) {
    console.error('ログディレクトリ作成エラー:', error)
  }
}

// 統一ログ関数
export async function logToContentFlow(entry: LogEntry): Promise<void> {
  try {
    await ensureLogDirectory()

    const fullEntry: FullLogEntry = {
      timestamp: new Date().toISOString(),
      ...entry
    }

    const logLine = JSON.stringify(fullEntry) + '\n'

    // 1. メインログファイルに追記
    const mainLogPath = path.join(LOG_DIR, MAIN_LOG_FILE)
    await fs.appendFile(mainLogPath, logLine)

    // 2. エラーレベルは専用ファイルにも追記
    if (entry.level === 'ERROR') {
      const errorLogPath = path.join(LOG_DIR, ERROR_LOG_FILE)
      await fs.appendFile(errorLogPath, logLine)
    }

    // 3. 開発環境ではコンソールにも表示
    const emoji = getLogEmoji(entry.level, entry.action)
    const phaseEmoji = getPhaseEmoji(entry.phase)
    
    console.log(`${emoji} [${entry.source}] ${phaseEmoji} ${entry.message}`)
    
    if (entry.data) {
      console.log(`   📊 データ:`, JSON.stringify(entry.data, null, 2))
    }

  } catch (error) {
    console.error('ログ書き込みエラー:', error)
    // ログ失敗でもアプリケーションは継続
  }
}

// ログレベル・アクション別絵文字取得
function getLogEmoji(level: LogLevel, action: LogAction): string {
  if (level === 'ERROR') return '❌'
  if (level === 'WARN') return '⚠️'
  
  switch (action) {
    case 'start': return '🚀'
    case 'progress': return '🔄'
    case 'complete': return '✅'
    case 'retry': return '🔁'
    default: return 'ℹ️'
  }
}

// フェーズ別絵文字取得
function getPhaseEmoji(phase: WorkflowPhase): string {
  switch (phase) {
    case 'article-creation': return '📝'
    case 'image-generation': return '🎨'
    case 'sanity-integration': return '🔄'
    case 'completion': return '🎉'
    default: return '📋'
  }
}

// セッション開始ログ
export async function logSessionStart(sessionId: string, topic: string): Promise<void> {
  await logToContentFlow({
    level: 'INFO',
    source: 'next-api',
    sessionId,
    phase: 'article-creation',
    action: 'start',
    message: `新しいセッション開始: ${topic}`,
    data: { topic, sessionId }
  })
}

// セッション完了ログ
export async function logSessionComplete(sessionId: string, data: any): Promise<void> {
  await logToContentFlow({
    level: 'INFO',
    source: 'sanity-integration',
    sessionId,
    phase: 'completion',
    action: 'complete',
    message: 'ワークフロー完了: 記事・画像統合済み',
    data: {
      ...data,
      totalDuration: data.duration,
      status: 'ready-for-deploy'
    }
  })
}

// エラーログ（スタックトレース付き）
export async function logError(sessionId: string, phase: WorkflowPhase, source: LogSource, error: Error, context?: any): Promise<void> {
  await logToContentFlow({
    level: 'ERROR',
    source,
    sessionId,
    phase,
    action: 'error',
    message: `エラー発生: ${error.message}`,
    data: {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      context
    }
  })
}

// セッション別ログ取得
export async function getSessionLogs(sessionId: string): Promise<FullLogEntry[]> {
  try {
    const logPath = path.join(LOG_DIR, MAIN_LOG_FILE)
    const logContent = await fs.readFile(logPath, 'utf-8')
    
    const logs = logContent
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        try {
          return JSON.parse(line) as FullLogEntry
        } catch {
          return null
        }
      })
      .filter((log): log is FullLogEntry => log !== null)
      .filter(log => log.sessionId === sessionId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    
    return logs
  } catch (error) {
    console.error('ログ読み取りエラー:', error)
    return []
  }
}

// 全ログ取得（最新N件）
export async function getRecentLogs(limit: number = 100): Promise<FullLogEntry[]> {
  try {
    const logPath = path.join(LOG_DIR, MAIN_LOG_FILE)
    const logContent = await fs.readFile(logPath, 'utf-8')
    
    const logs = logContent
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        try {
          return JSON.parse(line) as FullLogEntry
        } catch {
          return null
        }
      })
      .filter((log): log is FullLogEntry => log !== null)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)
    
    return logs
  } catch (error) {
    console.error('ログ読み取りエラー:', error)
    return []
  }
}

// セッション状況サマリー取得
export async function getSessionSummary(sessionId: string): Promise<{
  status: 'in-progress' | 'completed' | 'error'
  phases: Record<WorkflowPhase, 'pending' | 'in-progress' | 'completed' | 'error'>
  startTime?: string
  completionTime?: string
  duration?: number
  articleTitle?: string
  imageCount?: number
  errors: FullLogEntry[]
}> {
  const logs = await getSessionLogs(sessionId)
  
  if (logs.length === 0) {
    return {
      status: 'error',
      phases: {
        'article-creation': 'pending',
        'image-generation': 'pending', 
        'sanity-integration': 'pending',
        'completion': 'pending'
      },
      errors: []
    }
  }

  const errors = logs.filter(log => log.level === 'ERROR')
  const startLog = logs.find(log => log.action === 'start')
  const completionLog = logs.find(log => log.phase === 'completion' && log.action === 'complete')
  
  // フェーズ状況判定
  const phases: Record<WorkflowPhase, 'pending' | 'in-progress' | 'completed' | 'error'> = {
    'article-creation': 'pending',
    'image-generation': 'pending',
    'sanity-integration': 'pending', 
    'completion': 'pending'
  }

  // 各フェーズの状況を判定
  Object.keys(phases).forEach(phase => {
    const phaseKey = phase as WorkflowPhase
    const phaseLogs = logs.filter(log => log.phase === phaseKey)
    
    if (phaseLogs.some(log => log.level === 'ERROR')) {
      phases[phaseKey] = 'error'
    } else if (phaseLogs.some(log => log.action === 'complete')) {
      phases[phaseKey] = 'completed'
    } else if (phaseLogs.length > 0) {
      phases[phaseKey] = 'in-progress'
    }
  })

  // 全体状況判定
  let status: 'in-progress' | 'completed' | 'error' = 'in-progress'
  if (errors.length > 0) {
    status = 'error'
  } else if (completionLog) {
    status = 'completed'
  }

  return {
    status,
    phases,
    startTime: startLog?.timestamp,
    completionTime: completionLog?.timestamp,
    duration: completionLog?.data?.totalDuration,
    articleTitle: startLog?.data?.topic || completionLog?.data?.title,
    imageCount: completionLog?.data?.uploadedImages,
    errors
  }
}