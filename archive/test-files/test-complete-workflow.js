#!/usr/bin/env node
/**
 * 完全一気通貫ワークフローテストスクリプト
 * 記事生成 → 画像生成 → Sanity統合の全プロセスをテスト
 */

const BASE_URL = 'http://localhost:3000/api/complete-workflow';

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
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams}`;
    } else {
      options.body = JSON.stringify({ action, ...params });
    }

    console.log(`📡 API呼び出し: ${method} ${action || 'status'}`);
    
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`API Error: ${data.error || 'Unknown error'}`);
    }
    
    return data;
    
  } catch (error) {
    console.error(`❌ API呼び出しエラー (${method} ${action || 'status'}):`, error.message);
    throw error;
  }
}

/**
 * 完全ワークフロー開始
 */
async function startCompleteWorkflow(theme, options = {}) {
  try {
    console.log('\n' + '='.repeat(80));
    console.log('🚀 完全一気通貫ワークフロー開始');
    console.log('='.repeat(80));

    const sessionId = `complete-${Date.now()}`;
    const config = {
      sessionId,
      theme,
      articleType: options.articleType || 'blog',
      generateImages: options.generateImages !== false,
      imageCount: options.imageCount || 4,
      autoPublish: options.autoPublish !== false
    };

    console.log(`🔖 セッションID: ${sessionId}`);
    console.log(`📝 テーマ: ${theme}`);
    console.log(`📄 記事タイプ: ${config.articleType}`);
    console.log(`🎨 画像生成: ${config.generateImages ? `Yes (${config.imageCount}枚)` : 'No'}`);
    console.log(`📤 自動投稿: ${config.autoPublish ? 'Yes' : 'No'}`);

    const result = await apiCall('POST', 'start', config);

    console.log(`✅ ワークフロー開始成功`);
    console.log(`💬 メッセージ: ${result.message}`);
    
    if (options.monitor) {
      console.log('\n🔍 ワークフロー監視開始...');
      await monitorWorkflow(sessionId, options.monitorTimeout || 300); // 5分間監視
    }
    
    return result;

  } catch (error) {
    console.error('完全ワークフロー開始エラー:', error.message);
    throw error;
  }
}

/**
 * ワークフロー監視
 */
async function monitorWorkflow(sessionId, timeoutSeconds = 300) {
  const startTime = Date.now();
  const timeoutMs = timeoutSeconds * 1000;
  let lastPhase = '';

  while (Date.now() - startTime < timeoutMs) {
    try {
      const statusData = await apiCall('GET', '', { sessionId });
      const workflow = statusData.status;

      if (!workflow) {
        console.log('⏳ ワークフロー状態未取得...');
        await sleep(10000);
        continue;
      }

      if (workflow.phase !== lastPhase) {
        console.log(`\n📊 フェーズ変更: ${lastPhase} → ${workflow.phase}`);
        lastPhase = workflow.phase;

        switch (workflow.phase) {
          case 'article':
            console.log('📝 記事生成中...');
            break;
          case 'images':
            console.log('🎨 画像生成中...');
            break;
          case 'integration':
            console.log('🔄 Sanity統合中...');
            break;
          case 'completed':
            console.log('🎉 ワークフロー完了!');
            showWorkflowResult(workflow);
            return workflow;
          case 'error':
            console.log('❌ ワークフロー失敗');
            showWorkflowErrors(workflow);
            return workflow;
        }
      }

      // 進捗表示
      if (workflow.images) {
        const progress = workflow.images;
        console.log(`🎨 画像生成進捗: ${progress.generated}/${progress.total}`);
      }

      if (workflow.phase === 'completed' || workflow.phase === 'error') {
        showWorkflowResult(workflow);
        return workflow;
      }

      await sleep(15000); // 15秒間隔

    } catch (error) {
      console.error('監視エラー:', error.message);
      await sleep(10000);
    }
  }

  console.log('\n⏰ 監視タイムアウト');
  console.log('状態確認: node test-complete-workflow.js --status SESSION_ID');
}

/**
 * ワークフロー結果表示
 */
function showWorkflowResult(workflow) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 ワークフロー結果レポート');
  console.log('='.repeat(60));

  console.log(`✨ セッションID: ${workflow.sessionId}`);
  console.log(`📈 フェーズ: ${workflow.phase}`);
  console.log(`🎯 成功: ${workflow.success ? 'Yes' : 'No'}`);

  if (workflow.article) {
    console.log('\n📝 記事情報:');
    console.log(`  📄 ファイル: ${workflow.article.filename}`);
    console.log(`  📰 タイトル: ${workflow.article.title}`);
    console.log(`  🔗 スラッグ: ${workflow.article.slug}`);
    console.log(`  📏 文字数: ${workflow.article.wordCount}文字`);
  }

  if (workflow.images) {
    console.log('\n🎨 画像情報:');
    console.log(`  🖼️  生成数: ${workflow.images.generated}/${workflow.images.total}`);
    if (workflow.images.files?.length > 0) {
      console.log(`  📁 ファイル:`);
      workflow.images.files.forEach(file => {
        console.log(`    • ${file}`);
      });
    }
  }

  if (workflow.publication) {
    console.log('\n📤 投稿情報:');
    if (workflow.publication.sanityDocumentId) {
      console.log(`  📄 Document ID: ${workflow.publication.sanityDocumentId}`);
    }
    if (workflow.publication.publishedUrl) {
      console.log(`  🌐 公開URL: ${workflow.publication.publishedUrl}`);
    }
  }

  if (workflow.errors?.length > 0) {
    console.log('\n🚨 エラー:');
    workflow.errors.forEach(error => {
      console.log(`  ❌ ${error}`);
    });
  }

  if (workflow.nextSteps?.length > 0) {
    console.log('\n📋 次のステップ:');
    workflow.nextSteps.forEach(step => {
      console.log(`  📌 ${step}`);
    });
  }
}

/**
 * ワークフローエラー表示
 */
function showWorkflowErrors(workflow) {
  console.log('\n🚨 ワークフローエラー詳細:');
  if (workflow.errors) {
    workflow.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
  }
}

/**
 * 記事のみ生成テスト
 */
async function testArticleOnly(theme) {
  try {
    console.log('\n' + '='.repeat(60));
    console.log('📝 記事のみ生成テスト');
    console.log('='.repeat(60));

    const sessionId = `article-only-${Date.now()}`;

    const result = await apiCall('POST', 'article-only', {
      sessionId,
      theme,
      articleType: 'blog'
    });

    console.log(`✅ 記事生成: ${result.success ? '成功' : '失敗'}`);
    console.log(`💬 メッセージ: ${result.message}`);

    if (result.result?.article) {
      const article = result.result.article;
      console.log(`📄 ファイル: ${article.filename}`);
      console.log(`📰 タイトル: ${article.title}`);
      console.log(`📏 文字数: ${article.wordCount}文字`);
    }

    return result;

  } catch (error) {
    console.error('記事生成テストエラー:', error.message);
    throw error;
  }
}

/**
 * ワークフロー状態確認
 */
async function checkWorkflowStatus(sessionId) {
  try {
    console.log('\n' + '='.repeat(60));
    console.log(`📊 ワークフロー状態確認: ${sessionId}`);
    console.log('='.repeat(60));

    const statusData = await apiCall('GET', '', { sessionId });

    if (statusData.status) {
      showWorkflowResult(statusData.status);
    } else {
      console.log('❌ ワークフローセッションが見つかりません');
    }

    return statusData;

  } catch (error) {
    console.error('状態確認エラー:', error.message);
    throw error;
  }
}

/**
 * 使用方法表示
 */
function showUsage() {
  console.log('🛠️  完全一気通貫ワークフローテストスクリプト');
  console.log('');
  console.log('使用方法:');
  console.log('  node test-complete-workflow.js [オプション] [テーマ]');
  console.log('');
  console.log('基本オプション:');
  console.log('  --complete THEME          完全ワークフロー実行（記事+画像+投稿）');
  console.log('  --article-only THEME      記事生成のみ');
  console.log('  --status SESSION_ID       ワークフロー状態確認');
  console.log('  --monitor                 ワークフロー監視（--completeと併用）');
  console.log('  --help                    この使用方法を表示');
  console.log('');
  console.log('詳細オプション:');
  console.log('  --no-images               画像生成スキップ');
  console.log('  --no-publish              自動投稿スキップ');
  console.log('  --images COUNT            画像生成数（デフォルト: 4）');
  console.log('  --type TYPE               記事タイプ（blog/experience/technical）');
  console.log('');
  console.log('例:');
  console.log('  node test-complete-workflow.js --complete "AI技術と日常生活" --monitor');
  console.log('  node test-complete-workflow.js --article-only "プログラミング学習"');
  console.log('  node test-complete-workflow.js --status complete-1625123456789');
  console.log('  node test-complete-workflow.js --complete "家族との時間" --no-images');
}

/**
 * スリープ関数
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
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

  console.log('🧪 完全一気通貫ワークフローテスト');
  console.log(`🕐 開始時刻: ${new Date().toLocaleString()}`);

  try {
    if (args.includes('--complete')) {
      const themeIndex = args.indexOf('--complete') + 1;
      const theme = args[themeIndex];
      
      if (!theme) {
        console.error('❌ テーマが指定されていません');
        return;
      }

      const options = {
        monitor: args.includes('--monitor'),
        generateImages: !args.includes('--no-images'),
        autoPublish: !args.includes('--no-publish'),
        articleType: args.includes('--type') ? args[args.indexOf('--type') + 1] : 'blog',
        imageCount: args.includes('--images') ? parseInt(args[args.indexOf('--images') + 1]) : 4,
        monitorTimeout: 300 // 5分
      };

      await startCompleteWorkflow(theme, options);
    }
    
    if (args.includes('--article-only')) {
      const themeIndex = args.indexOf('--article-only') + 1;
      const theme = args[themeIndex];
      
      if (!theme) {
        console.error('❌ テーマが指定されていません');
        return;
      }

      await testArticleOnly(theme);
    }
    
    if (args.includes('--status')) {
      const sessionIndex = args.indexOf('--status') + 1;
      const sessionId = args[sessionIndex];
      
      if (!sessionId) {
        console.error('❌ セッションIDが指定されていません');
        return;
      }

      await checkWorkflowStatus(sessionId);
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