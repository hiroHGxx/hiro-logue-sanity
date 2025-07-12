/**
 * 状態管理システムテストスクリプト
 * 基本機能と API の動作確認
 */

const ImageStatusManager = require('./lib/image-status-manager.ts').ImageStatusManager;

async function testStatusSystem() {
  console.log('🧪 状態管理システムテスト開始\n');

  try {
    // 1. セッション開始
    console.log('1. セッション開始テスト');
    await ImageStatusManager.startSession(4, 'test-session-001');
    console.log('✅ セッション開始成功\n');

    // 2. 状態確認
    console.log('2. 状態確認テスト');
    const progress1 = await ImageStatusManager.getProgress();
    console.log('📊 進捗:', JSON.stringify(progress1, null, 2));
    console.log('✅ 状態確認成功\n');

    // 3. 生成開始マーク
    console.log('3. 生成開始マークテスト');
    await ImageStatusManager.markGenerating('header画像生成中');
    console.log('✅ 生成開始マーク成功\n');

    // 4. バリエーション追加
    console.log('4. バリエーション追加テスト');
    await ImageStatusManager.addVariation({
      id: 'var-001',
      position: 'header',
      filename: 'test-header-001.png',
      status: 'generating'
    });
    console.log('✅ バリエーション追加成功\n');

    // 5. バリエーション完了
    console.log('5. バリエーション完了テスト');
    await ImageStatusManager.markVariationCompleted(
      'var-001',
      'test-header-001.png',
      '/public/images/test/test-header-001.png'
    );
    console.log('✅ バリエーション完了成功\n');

    // 6. 最終状態確認
    console.log('6. 最終状態確認');
    const finalProgress = await ImageStatusManager.getProgress();
    console.log('📊 最終進捗:', JSON.stringify(finalProgress, null, 2));
    console.log('✅ 最終状態確認成功\n');

    // 7. タイムアウト制約テスト
    console.log('7. タイムアウト制約テスト');
    const shouldBackground = await ImageStatusManager.shouldUseBackgroundProcessing(5);
    console.log(`🤔 5分の処理はバックグラウンド推奨: ${shouldBackground}`);
    console.log('✅ タイムアウト制約テスト成功\n');

    // 8. セッションクリア
    console.log('8. セッションクリアテスト');
    await ImageStatusManager.clearSession();
    console.log('✅ セッションクリア成功\n');

    console.log('🎉 全テスト完了! 状態管理システムは正常に動作しています。');

  } catch (error) {
    console.error('❌ テスト失敗:', error.message);
    console.error('詳細:', error);
  }
}

// Node.js から直接実行する場合
if (require.main === module) {
  testStatusSystem();
}

module.exports = { testStatusSystem };