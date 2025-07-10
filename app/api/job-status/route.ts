/**
 * ジョブ状況確認API
 * Phase B: バックグラウンドジョブの進行状況確認
 */

import { NextRequest, NextResponse } from 'next/server';
import { jobQueue } from '../../../lib/job-queue';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (jobId) {
      // 特定ジョブの詳細状況取得
      const job = await jobQueue.getJobStatus(jobId);
      
      if (!job) {
        return NextResponse.json(
          { error: 'Job not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        job: {
          id: job.id,
          type: job.type,
          status: job.status,
          createdAt: job.createdAt,
          startedAt: job.startedAt,
          completedAt: job.completedAt,
          error: job.error,
          retryCount: job.retryCount,
          maxRetries: job.maxRetries,
          result: job.data.result || null
        }
      });
    } else {
      // 全体統計情報取得
      const stats = await jobQueue.getQueueStats();
      
      return NextResponse.json({
        success: true,
        stats
      });
    }

  } catch (error) {
    console.error('Error getting job status:', error);
    return NextResponse.json(
      { error: 'Failed to get job status' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, jobId } = body;

    switch (action) {
      case 'retry':
        if (!jobId) {
          return NextResponse.json(
            { error: 'Job ID is required for retry' },
            { status: 400 }
          );
        }

        // 失敗したジョブを再実行キューに追加
        const job = await jobQueue.getJobStatus(jobId);
        if (!job) {
          return NextResponse.json(
            { error: 'Job not found' },
            { status: 404 }
          );
        }

        if (job.status !== 'failed') {
          return NextResponse.json(
            { error: 'Only failed jobs can be retried' },
            { status: 400 }
          );
        }

        // 新しいジョブとして再投入
        const newJobId = await jobQueue.addJob(job.type, job.data, job.maxRetries);
        
        return NextResponse.json({
          success: true,
          message: 'Job retry initiated',
          newJobId
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error handling job action:', error);
    return NextResponse.json(
      { error: 'Failed to handle job action' },
      { status: 500 }
    );
  }
}