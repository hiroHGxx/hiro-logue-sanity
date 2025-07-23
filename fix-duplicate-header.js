require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@sanity/client');

// Sanity client setup
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION
});

const articleId = 'NqxSZpGEWOJozkIriX9WzR';

async function fixDuplicateHeader() {
  try {
    console.log('🔍 記事の現在の状況を確認中...');
    
    // 現在の記事データを取得
    const currentArticle = await client.getDocument(articleId);
    
    console.log('📄 記事タイトル:', currentArticle.title);
    console.log('📊 Body要素数:', currentArticle.body.length);
    
    // body内の画像要素を確認
    const imageBlocks = currentArticle.body.filter(block => block._type === 'image');
    console.log('🖼️ Body内画像数:', imageBlocks.length);
    
    imageBlocks.forEach((block, index) => {
      console.log(`画像${index + 1}: ${block.alt || '説明なし'}`);
    });
    
    // 重複するヘッダ画像を検出（最初の画像要素を削除対象とする）
    let updatedBody = [...currentArticle.body];
    
    // 最初に見つかった画像要素（重複ヘッダ画像と推定）を削除
    const firstImageIndex = updatedBody.findIndex(block => block._type === 'image');
    
    if (firstImageIndex !== -1) {
      console.log(`🗑️ 重複ヘッダ画像を削除中... (インデックス: ${firstImageIndex})`);
      updatedBody.splice(firstImageIndex, 1);
      
      // 記事を更新
      const result = await client
        .patch(articleId)
        .set({
          body: updatedBody
        })
        .commit();
      
      console.log('✅ 重複ヘッダ画像削除完了');
      console.log('📊 更新後Body要素数:', updatedBody.length);
      
      // 更新後の画像数を確認
      const remainingImages = updatedBody.filter(block => block._type === 'image');
      console.log('🖼️ 残存画像数:', remainingImages.length);
      
    } else {
      console.log('⚠️ Body内に画像要素が見つかりませんでした');
    }
    
    console.log('🔗 記事URL: https://hiro-logue.vercel.app/blog/input-output-learning-balance');
    
  } catch (error) {
    console.error('❌ エラー:', error);
    throw error;
  }
}

// 実行
fixDuplicateHeader()
  .then(() => {
    console.log('🎉 重複画像修正完了');
  })
  .catch((error) => {
    console.error('💥 処理エラー:', error);
    process.exit(1);
  });