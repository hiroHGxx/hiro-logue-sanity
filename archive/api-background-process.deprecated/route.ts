/**
 * バックグラウンドプロセス管理API
 * Claude Codeタイムアウト制約を回避するため、長時間の画像生成タスクを
 * バックグラウンドで実行し、状態をAPIで管理する
 */

import { NextRequest, NextResponse } from 'next/server';
import { BackgroundProcessManager, BackgroundProcessConfig } from '@/lib/background-process-manager';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    switch (action) {
      case 'status':
        const status = await BackgroundProcessManager.getProcessStatus();
        const generationStatus = await BackgroundProcessManager.getGenerationStatus();
        
        return NextResponse.json({
          success: true,
          processStatus: status,
          generationStatus: generationStatus,
          timestamp: new Date().toISOString()
        });

      case 'logs':
        const tailLines = parseInt(url.searchParams.get('lines') || '50');
        const logs = await BackgroundProcessManager.getProcessLogs(tailLines);
        
        return NextResponse.json({
          success: true,
          logs: logs,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: status, logs'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Background process API GET error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case 'start':
        return await handleStartGeneration(params);
      
      case 'stop':
        return await handleStopGeneration();
      
      case 'resume':
        return await handleResumeSession(params);
      
      case 'smart-generation':
        return await handleSmartGeneration(params);
      
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: start, stop, resume, smart-generation'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Background process API POST error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function handleStartGeneration(params: any) {
  try {
    const { sessionId, totalImages, imagePrompts } = params;

    if (!sessionId || !totalImages) {
      return NextResponse.json({
        success: false,
        error: 'sessionId and totalImages are required'
      }, { status: 400 });
    }

    const config: BackgroundProcessConfig = {
      sessionId,
      totalImages: parseInt(totalImages),
      imagePrompts
    };

    const result = await BackgroundProcessManager.startBackgroundGeneration(config);

    return NextResponse.json({
      success: result.success,
      message: result.message,
      sessionId: result.sessionId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Start generation error'
    }, { status: 500 });
  }
}

async function handleStopGeneration() {
  try {
    const result = await BackgroundProcessManager.stopBackgroundGeneration();

    return NextResponse.json({
      success: result.success,
      message: result.message,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Stop generation error'
    }, { status: 500 });
  }
}

async function handleResumeSession(params: any) {
  try {
    const { sessionId } = params;

    if (!sessionId) {
      return NextResponse.json({
        success: false,
        error: 'sessionId is required'
      }, { status: 400 });
    }

    const result = await BackgroundProcessManager.resumeSession(sessionId);

    return NextResponse.json({
      success: result.success,
      message: result.message,
      sessionId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Resume session error'
    }, { status: 500 });
  }
}

async function handleSmartGeneration(params: any) {
  try {
    const { sessionId, totalImages, imagePrompts, maxExecutionMinutes } = params;

    if (!sessionId || !totalImages) {
      return NextResponse.json({
        success: false,
        error: 'sessionId and totalImages are required'
      }, { status: 400 });
    }

    const config: BackgroundProcessConfig = {
      sessionId,
      totalImages: parseInt(totalImages),
      imagePrompts
    };

    const result = await BackgroundProcessManager.smartGeneration(
      config,
      maxExecutionMinutes ? parseInt(maxExecutionMinutes) : 8
    );

    return NextResponse.json({
      success: result.success,
      mode: result.mode,
      message: result.message,
      sessionId: result.sessionId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Smart generation error'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // セッション強制終了・ファイルクリーンアップ
    const result = await BackgroundProcessManager.stopBackgroundGeneration();
    
    return NextResponse.json({
      success: result.success,
      message: `Process terminated: ${result.message}`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Background process DELETE error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Delete operation error'
    }, { status: 500 });
  }
}