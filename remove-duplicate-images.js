#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2023-05-03',
  useCdn: false
});

async function removeDuplicateImages() {
  console.log('🧹 重複画像削除処理開始...');
  
  const articleId = 'CamHzSyS1JT3ENpT8Dde2Q'; // adult-learning-reskilling-journey
  
  // 記事を取得
  const post = await client.fetch(`
    *[_type == "post" && _id == $id][0] {
      _id,
      title,
      body,
      headerImage,
      section1Image,
      section2Image,
      section3Image
    }
  `, { id: articleId });
  
  if (!post) {
    console.log('❌ 記事が見つかりません');
    return;
  }
  
  console.log(`📄 記事: ${post.title}`);
  
  // フィールド画像のIDを取得
  const fieldImageIds = [
    post.headerImage?.asset._ref,
    post.section1Image?.asset._ref,
    post.section2Image?.asset._ref,
    post.section3Image?.asset._ref
  ].filter(Boolean);
  
  console.log('🖼️ フィールド画像IDs:', fieldImageIds);
  
  // 本文から重複画像を除去
  const cleanedBody = [];
  let removedCount = 0;
  
  if (post.body && Array.isArray(post.body)) {
    for (const block of post.body) {
      if (block._type === 'image' && fieldImageIds.includes(block.asset._ref)) {
        console.log(`🗑️ 重複画像を削除: ${block.asset._ref}`);
        removedCount++;
        continue; // この画像ブロックをスキップ
      }
      
      if (block._type === 'sectionImage' && fieldImageIds.includes(block.image?.asset._ref)) {
        console.log(`🗑️ 重複セクション画像を削除: ${block.image.asset._ref}`);
        removedCount++;
        continue; // この画像ブロックをスキップ
      }
      
      cleanedBody.push(block);
    }
  }
  
  console.log(`📊 削除した重複画像数: ${removedCount}`);
  console.log(`📝 残った本文ブロック数: ${cleanedBody.length}`);
  
  // 記事を更新
  if (removedCount > 0) {
    try {
      await client
        .patch(articleId)
        .set({
          body: cleanedBody,
          updatedAt: new Date().toISOString()
        })
        .commit();
      
      console.log('✅ 重複画像削除完了');
      console.log('🌐 記事URL: https://hiro-logue.vercel.app/blog/adult-learning-reskilling-journey');
      
    } catch (error) {
      console.error('❌ 更新エラー:', error);
    }
  } else {
    console.log('ℹ️ 削除すべき重複画像はありませんでした');
  }
}

removeDuplicateImages().catch(console.error);