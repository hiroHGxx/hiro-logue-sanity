#!/usr/bin/env node
/**
 * バックグラウンド処理システムテストスクリプト
 * API経由でバックグラウンド画像生成をテストし、状態監視を実行
 */

const BASE_URL = 'http://localhost:3000/api/background-process';

/**
 * API呼び出し関数
 */
async function apiCall(method, action, params = {}) {
  try {
    let url = BASE_URL;
    let options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (method === 'GET') {
      const searchParams = new URLSearchParams({ action, ...params });
      url += `?${searchParams}`;
    } else {
      options.body = JSON.stringify({ action, ...params });
    }

    console.log(`📡 API呼び出し: ${method} ${action}`);
    
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`API Error: ${data.error || 'Unknown error'}`);
    }
    
    return data;
    
  } catch (error) {
    console.error(`❌ API呼び出しエラー (${method} ${action}):`, error.message);
    throw error;
  }
}

/**
 * 現在の状態表示
 */
async function showStatus() {
  try {
    console.log('\n' + '='.repeat(60));
    console.log('📊 バックグラウンドプロセス状態確認');
    console.log('='.repeat(60));

    const statusData = await apiCall('GET', 'status');
    
    const processStatus = statusData.processStatus;
    const generationStatus = statusData.generationStatus;
    
    console.log(`🔄 プロセス実行中: ${processStatus.isRunning ? 'Yes' : 'No'}`);
    
    if (processStatus.isRunning) {
      console.log(`📍 PID: ${processStatus.pid}`);
      console.log(`🔖 セッションID: ${processStatus.sessionId}`);
      console.log(`⏰ 開始時刻: ${processStatus.startedAt}`);
    }
    
    if (generationStatus) {
      console.log(`📈 生成状況: ${generationStatus.status}`);
      console.log(`📊 進捗: ${generationStatus.completed}/${generationStatus.total} (失敗: ${generationStatus.failed})`);
      
      if (generationStatus.variations && generationStatus.variations.length > 0) {
        console.log(`\n📸 生成済み画像:`);
        generationStatus.variations.forEach((variation, index) => {
          const status = variation.status === 'success' ? '✅' : '❌';
          console.log(`  ${status} ${variation.filename || variation.description}`);
        });
      }
    }
    
    console.log(`\n🕐 更新時刻: ${statusData.timestamp}`);
    
  } catch (error) {
    console.error('状態確認エラー:', error.message);
  }
}

/**
 * ログ表示
 */
async function showLogs(lines = 20) {
  try {
    console.log('\n' + '='.repeat(60));
    console.log(`📋 最新ログ (${lines}行)`);
    console.log('='.repeat(60));

    const logData = await apiCall('GET', 'logs', { lines: lines.toString() });
    
    if (logData.logs && logData.logs.length > 0) {
      logData.logs.forEach(log => {
        console.log(log);
      });
    } else {
      console.log('📝 ログがありません');
    }
    
  } catch (error) {
    console.error('ログ取得エラー:', error.message);
  }
}

/**
 * スマート生成テスト
 */
async function testSmartGeneration() {
  try {
    console.log('\n' + '='.repeat(60));
    console.log('🧠 スマート生成テスト開始');
    console.log('='.repeat(60));

    const sessionId = `test-smart-${Date.now()}`;
    const totalImages = 3; // テスト用に3枚
    
    console.log(`🔖 セッションID: ${sessionId}`);
    console.log(`📊 生成予定: ${totalImages}枚`);

    const result = await apiCall('POST', 'smart-generation', {
      sessionId,
      totalImages,
      maxExecutionMinutes: 5
    });

    console.log(`✅ スマート生成開始: ${result.mode}モード`);
    console.log(`💬 メッセージ: ${result.message}`);
    
    if (result.mode === 'background') {
      console.log('\n🔄 バックグラウンド処理が開始されました');
      console.log('状態確認: node test-background-processing.js --status');
    }
    
    return result;
    
  } catch (error) {
    console.error('スマート生成テストエラー:', error.message);
    throw error;
  }
}

/**
 * バックグラウンド生成テスト
 */
async function testBackgroundGeneration() {
  try {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 バックグラウンド生成テスト開始');
    console.log('='.repeat(60));

    const sessionId = `test-bg-${Date.now()}`;
    const totalImages = 2; // テスト用に2枚
    
    console.log(`🔖 セッションID: ${sessionId}`);
    console.log(`📊 生成予定: ${totalImages}枚`);

    const result = await apiCall('POST', 'start', {
      sessionId,
      totalImages
    });

    console.log(`✅ バックグラウンド生成開始: ${result.message}`);
    
    // 30秒間状態監視
    console.log('\n🔍 30秒間状態監視開始...');
    
    for (let i = 0; i < 6; i++) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      console.log(`\n--- 監視 ${i + 1}/6 (${(i + 1) * 5}秒経過) ---`);
      await showStatus();
    }
    
    return result;
    
  } catch (error) {
    console.error('バックグラウンド生成テストエラー:', error.message);
    throw error;
  }
}

/**
 * プロセス停止
 */
async function stopProcess() {
  try {
    console.log('\n🛑 バックグラウンドプロセス停止中...');
    
    const result = await apiCall('POST', 'stop');
    console.log(`✅ ${result.message}`);
    
  } catch (error) {
    console.error('プロセス停止エラー:', error.message);
  }
}

/**
 * 使用方法表示
 */
function showUsage() {
  console.log('🛠️  バックグラウンド処理テストスクリプト');
  console.log('');
  console.log('使用方法:');
  console.log('  node test-background-processing.js [オプション]');
  console.log('');
  console.log('オプション:');
  console.log('  --status                 現在の状態表示');
  console.log('  --logs [lines]           ログ表示 (デフォルト: 20行)');
  console.log('  --test-smart             スマート生成テスト');
  console.log('  --test-background        バックグラウンド生成テスト');
  console.log('  --stop                   プロセス停止');
  console.log('  --help                   この使用方法を表示');
  console.log('');
  console.log('例:');
  console.log('  node test-background-processing.js --status');
  console.log('  node test-background-processing.js --logs 50');
  console.log('  node test-background-processing.js --test-smart');
}

/**
 * メイン処理
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help')) {
    showUsage();
    return;
  }

  console.log('🧪 バックグラウンド処理システムテスト');
  console.log(`🕐 開始時刻: ${new Date().toLocaleString()}`);

  try {
    if (args.includes('--status')) {
      await showStatus();
    }
    
    if (args.includes('--logs')) {
      const linesIndex = args.indexOf('--logs') + 1;
      const lines = args[linesIndex] && !args[linesIndex].startsWith('--') 
        ? parseInt(args[linesIndex]) 
        : 20;
      await showLogs(lines);
    }
    
    if (args.includes('--test-smart')) {
      await testSmartGeneration();
    }
    
    if (args.includes('--test-background')) {
      await testBackgroundGeneration();
    }
    
    if (args.includes('--stop')) {
      await stopProcess();
    }
    
    console.log('\n🎉 テスト完了');
    
  } catch (error) {
    console.error('🚨 テスト実行エラー:', error.message);
    process.exit(1);
  }
}

// 未処理の例外をキャッチ
process.on('uncaughtException', (error) => {
  console.error('🚨 未処理例外:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 未処理Promise拒否:', reason);
  process.exit(1);
});

// Node.js環境でのみ実行
if (typeof require !== 'undefined' && require.main === module) {
  main();
}