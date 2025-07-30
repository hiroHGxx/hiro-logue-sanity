#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@sanity/client');

// Sanity設定
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2023-05-03',
  useCdn: false
});

const TARGET_DOCUMENT_ID = '2xyqq5bRAlaQ1ZafpZUygt'; // goal-achievement-three-essentials

async function fixDuplicateImages() {
  console.log('🔧 重複画像修正開始');
  console.log(`📄 対象ドキュメントID: ${TARGET_DOCUMENT_ID}`);

  try {
    // 現在の記事取得
    const currentPost = await client.getDocument(TARGET_DOCUMENT_ID);
    console.log(`📰 記事タイトル: ${currentPost.title}`);
    console.log(`📊 現在のBody要素数: ${currentPost.body?.length || 0}`);

    // フィールド画像の参照ID取得
    const fieldImageRefs = [
      currentPost.headerImage?.asset?._ref,
      currentPost.section1Image?.asset?._ref,
      currentPost.section2Image?.asset?._ref,
      currentPost.section3Image?.asset?._ref
    ].filter(Boolean);

    console.log(`🖼️ フィールド画像参照: ${fieldImageRefs.length}件`);
    fieldImageRefs.forEach((ref, index) => {
      console.log(`  - ${['header', 'section1', 'section2', 'section3'][index]}: ${ref.slice(-12)}...`);
    });

    // Body内の重複画像ブロックを削除
    const cleanedBody = currentPost.body.filter(block => {
      if (block._type === 'image' && block.asset?._ref) {
        const isDuplicate = fieldImageRefs.includes(block.asset._ref);
        if (isDuplicate) {
          console.log(`🗑️ 重複画像ブロック削除: ${block.asset._ref.slice(-12)}...`);
        }
        return !isDuplicate;
      }
      return true;
    });

    console.log(`📊 修正後のBody要素数: ${cleanedBody.length}`);
    console.log(`🔄 削除されたブロック数: ${(currentPost.body?.length || 0) - cleanedBody.length}`);

    // バックアップ作成
    const backupData = {
      documentId: TARGET_DOCUMENT_ID,
      originalTitle: currentPost.title,
      originalBodyLength: currentPost.body?.length || 0,
      cleanedBodyLength: cleanedBody.length,
      removedBlocks: (currentPost.body?.length || 0) - cleanedBody.length,
      timestamp: new Date().toISOString(),
      originalBody: currentPost.body
    };

    const fs = require('fs');
    const backupPath = `./backups/goal-achievement-duplicate-fix-${Date.now()}.json`;
    fs.mkdirSync('./backups', { recursive: true });
    fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
    console.log(`💾 バックアップ作成: ${backupPath}`);

    // 記事更新（Body のみ修正、フィールド画像はそのまま保持）
    await client
      .patch(TARGET_DOCUMENT_ID)
      .set({
        body: cleanedBody
      })
      .commit();

    console.log('✅ 重複画像修正完了');
    console.log('📋 修正内容:');
    console.log('  - Body内の重複画像ブロックを削除');
    console.log('  - フィールド画像（headerImage, section1Image等）は保持');
    console.log('  - EnhancedPortableTextが適切に画像を表示します');
    console.log(`🌐 公開URL: https://hiro-logue.vercel.app/blog/goal-achievement-three-essentials`);
    
  } catch (error) {
    console.error('❌ 修正エラー:', error);
    throw error;
  }
}

// 実行
fixDuplicateImages();