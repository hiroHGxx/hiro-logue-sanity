#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@sanity/client');
const fs = require('fs').promises;
const path = require('path');

// Sanity設定
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2023-05-03',
  useCdn: false
});

async function integrateZeroToOneImages() {
  try {
    console.log('🚀 経験値ゼロとイチ記事の画像統合開始...');
    
    // 記事ID（固定）
    const documentId = 'ZvxiW5JwCbzpvY83ZKywLY';
    const sessionId = 'article-250725-114200';
    
    // 画像ファイルパス
    const imageDir = `public/images/blog/auto-generated/${sessionId}`;
    const imageFiles = {
      headerImage: `${imageDir}/header-20250725_132949.png`,
      section1Image: `${imageDir}/section1-20250725_133314.png`,
      section2Image: `${imageDir}/section2-20250725_133630.png`,
      section3Image: `${imageDir}/section3-20250725_134104.png`
    };
    
    console.log('📤 画像をSanityにアップロード中...');
    
    // 画像アップロード
    const uploadedImages = {};
    for (const [key, filePath] of Object.entries(imageFiles)) {
      console.log(`📤 アップロード中: ${path.basename(filePath)}...`);
      
      const imageBuffer = await fs.readFile(filePath);
      const uploadedAsset = await client.assets.upload('image', imageBuffer, {
        filename: path.basename(filePath)
      });
      
      uploadedImages[key] = {
        _type: 'image',
        asset: {
          _type: 'reference',
          _ref: uploadedAsset._id
        }
      };
      
      console.log(`✅ アップロード完了: ${uploadedAsset._id}`);
    }
    
    console.log('📝 記事を更新中...');
    
    // 記事更新
    await client
      .patch(documentId)
      .set(uploadedImages)
      .commit();
    
    console.log('✅ 記事更新完了');
    console.log('🌐 記事URL: https://hiro-logue.vercel.app/blog/zero-to-one-experience-difference');
    
    // アーカイブ処理
    console.log('\n📦 処理済みファイルのアーカイブ中...');
    
    const processedDir = './articles/processed';
    try {
      await fs.access(processedDir);
    } catch {
      await fs.mkdir(processedDir, { recursive: true });
    }
    
    const newArticleFile = './articles/new-article.json';
    const archiveFile = path.join(processedDir, `${sessionId}.json`);
    
    await fs.rename(newArticleFile, archiveFile);
    
    console.log(`✅ ファイルアーカイブ完了: ${sessionId}.json`);
    console.log(`📂 アーカイブ先: articles/processed/`);
    
    console.log('\n🎉 画像統合とアーカイブが完了しました！');
    
  } catch (error) {
    console.error('❌ エラー:', error.message);
    process.exit(1);
  }
}

integrateZeroToOneImages();