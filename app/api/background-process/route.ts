/**
 * バックグラウンドプロセス管理API V2
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
      
      case 'start-from-article':
        return await handleStartFromArticle(params);
      
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: start, stop, start-from-article'
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

    // 状態ファイル初期化
    await BackgroundProcessManager.initializeStatus(config);

    // バックグラウンドプロセス開始
    const result = await BackgroundProcessManager.startBackgroundGeneration(config);

    return NextResponse.json({
      success: result.success,
      message: result.message,
      data: {
        pid: result.pid,
        sessionId,
        totalImages,
        estimatedCompletionTime: '15-20分後'
      }
    });

  } catch (error) {
    console.error('Start generation error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function handleStartFromArticle(params: any) {
  try {
    const { sessionId } = params;

    if (!sessionId) {
      return NextResponse.json({
        success: false,
        error: 'sessionId is required'
      }, { status: 400 });
    }

    // 記事JSONファイルから画像プロンプトを読み込み
    const fs = require('fs').promises;
    const path = require('path');
    const articleFile = path.join(process.cwd(), 'articles', `${sessionId}.json`);

    try {
      const articleContent = await fs.readFile(articleFile, 'utf-8');
      const articleData = JSON.parse(articleContent);

      if (!articleData.imagePrompts || articleData.imagePrompts.length === 0) {
        return NextResponse.json({
          success: false,
          error: '記事ファイルに画像プロンプトが含まれていません'
        }, { status: 400 });
      }

      const config: BackgroundProcessConfig = {
        sessionId,
        totalImages: articleData.imagePrompts.length,
        imagePrompts: articleData.imagePrompts
      };

      // 状態ファイル初期化
      await BackgroundProcessManager.initializeStatus(config);

      // バックグラウンドプロセス開始
      const result = await BackgroundProcessManager.startBackgroundGeneration(config);

      return NextResponse.json({
        success: result.success,
        message: result.message,
        data: {
          pid: result.pid,
          sessionId,
          totalImages: config.totalImages,
          articleTitle: articleData.article?.title || 'Unknown',
          estimatedCompletionTime: '15-20分後'
        }
      });

    } catch (fileError) {
      return NextResponse.json({
        success: false,
        error: `記事ファイル読み込みエラー: ${fileError instanceof Error ? fileError.message : 'Unknown error'}`
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Start from article error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function handleStopGeneration() {
  try {
    const result = await BackgroundProcessManager.stopBackgroundGeneration();

    return NextResponse.json({
      success: result.success,
      message: result.message
    });

  } catch (error) {
    console.error('Stop generation error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}