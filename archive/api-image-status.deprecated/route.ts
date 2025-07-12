/**
 * 画像生成状態管理API
 * 状態確認・制御・進捗追跡エンドポイント
 */

import { NextRequest, NextResponse } from 'next/server';
import { ImageStatusManager } from '@/lib/image-status-manager';

export async function GET() {
  try {
    const progress = await ImageStatusManager.getProgress();
    
    return NextResponse.json({
      success: true,
      data: progress
    });
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to check status',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case 'start':
        await ImageStatusManager.startSession(
          params.totalImages || 4, 
          params.sessionId
        );
        return NextResponse.json({ 
          success: true, 
          message: 'Session started',
          sessionId: params.sessionId 
        });

      case 'mark-generating':
        await ImageStatusManager.markGenerating(params.currentTask);
        return NextResponse.json({ 
          success: true, 
          message: 'Marked as generating' 
        });

      case 'add-variation':
        await ImageStatusManager.addVariation(params.variation);
        return NextResponse.json({ 
          success: true, 
          message: 'Variation added' 
        });

      case 'mark-completed':
        if (params.variationId) {
          await ImageStatusManager.markVariationCompleted(
            params.variationId,
            params.filename,
            params.filePath
          );
        } else {
          await ImageStatusManager.markCompleted();
        }
        return NextResponse.json({ 
          success: true, 
          message: 'Marked as completed' 
        });

      case 'mark-failed':
        if (params.variationId) {
          await ImageStatusManager.markVariationFailed(
            params.variationId,
            params.error
          );
        } else {
          await ImageStatusManager.markFailed(params.errorMessage);
        }
        return NextResponse.json({ 
          success: true, 
          message: 'Marked as failed' 
        });

      case 'clear':
        await ImageStatusManager.clearSession();
        return NextResponse.json({ 
          success: true, 
          message: 'Session cleared' 
        });

      case 'check-timeout':
        const isTimeout = await ImageStatusManager.checkTimeout(
          params.maxMinutes || 2
        );
        return NextResponse.json({ 
          success: true, 
          isTimeout,
          message: isTimeout ? 'Session timed out' : 'Session active'
        });

      case 'should-background':
        const shouldBackground = await ImageStatusManager.shouldUseBackgroundProcessing(
          params.estimatedMinutes || 5
        );
        return NextResponse.json({ 
          success: true, 
          shouldBackground,
          message: shouldBackground 
            ? 'Background processing recommended' 
            : 'Direct processing recommended'
        });

      default:
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid action',
            availableActions: [
              'start', 'mark-generating', 'add-variation', 
              'mark-completed', 'mark-failed', 'clear',
              'check-timeout', 'should-background'
            ]
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Status management error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Status management failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    await ImageStatusManager.clearSession();
    
    return NextResponse.json({
      success: true,
      message: 'Session cleared successfully'
    });
  } catch (error) {
    console.error('Session clear error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to clear session',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}