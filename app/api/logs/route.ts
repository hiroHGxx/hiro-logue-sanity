import { NextRequest, NextResponse } from 'next/server'
import { getSessionLogs, getRecentLogs, getSessionSummary } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    const action = searchParams.get('action')
    const limit = parseInt(searchParams.get('limit') || '100')

    // セッション状況サマリー取得
    if (action === 'summary' && sessionId) {
      const summary = await getSessionSummary(sessionId)
      return NextResponse.json({
        success: true,
        summary
      })
    }

    // セッション別ログ取得
    if (sessionId) {
      const logs = await getSessionLogs(sessionId)
      return NextResponse.json({
        success: true,
        sessionId,
        logs,
        count: logs.length
      })
    }

    // 全ログ取得（最新N件）
    const logs = await getRecentLogs(limit)
    return NextResponse.json({
      success: true,
      logs,
      count: logs.length,
      limit
    })

  } catch (error) {
    console.error('❌ Failed to retrieve logs:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve logs', details: (error as Error).message },
      { status: 500 }
    )
  }
}

// ログ出力フォーマット用のユーティリティエンドポイント
export async function POST(request: NextRequest) {
  try {
    const { sessionId, format = 'json' } = await request.json()

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      )
    }

    const logs = await getSessionLogs(sessionId)

    if (format === 'text') {
      // テキスト形式でログ出力
      const textLogs = logs.map(log => {
        const timestamp = new Date(log.timestamp).toLocaleString('ja-JP')
        const emoji = getLogEmoji(log.level, log.action)
        const phaseEmoji = getPhaseEmoji(log.phase)
        
        let output = `${timestamp} ${emoji} [${log.source}] ${phaseEmoji} ${log.message}`
        
        if (log.data) {
          output += `\n   📊 データ: ${JSON.stringify(log.data, null, 2)}`
        }
        
        return output
      }).join('\n\n')

      return new NextResponse(textLogs, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': `attachment; filename="contentflow-${sessionId}.log"`
        }
      })
    }

    // JSON形式（デフォルト）
    return NextResponse.json({
      success: true,
      sessionId,
      logs,
      format: 'json'
    })

  } catch (error) {
    console.error('❌ Failed to format logs:', error)
    return NextResponse.json(
      { error: 'Failed to format logs', details: (error as Error).message },
      { status: 500 }
    )
  }
}

// ログレベル・アクション別絵文字取得
function getLogEmoji(level: string, action: string): string {
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
function getPhaseEmoji(phase: string): string {
  switch (phase) {
    case 'article-creation': return '📝'
    case 'image-generation': return '🎨'
    case 'sanity-integration': return '🔄'
    case 'completion': return '🎉'
    default: return '📋'
  }
}