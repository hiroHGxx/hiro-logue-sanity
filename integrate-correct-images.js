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

async function integrateImages() {
  console.log('🎨 正しい記事への画像統合開始...');
  
  const sessionId = 'article-20250716-121500';
  const documentId = 'CamHzSyS1JT3ENpT8F5hTU';
  const slug = 'programming-volunteer-teaching-insights';
  
  console.log(`📋 記事ID: ${documentId}`);
  console.log(`🔗 スラッグ: ${slug}`);
  
  // 画像ファイルパス（新しいヘッダー画像を含む）
  const imageFiles = [
    {
      position: 'header',
      filename: 'header-20250716_112550.png', // 新しく生成されたヘッダー画像
      path: `public/images/blog/auto-generated/${sessionId}/header-20250716_112550.png`
    },
    {
      position: 'section1',
      filename: 'section1-20250716_094352.png',
      path: `public/images/blog/auto-generated/${sessionId}/section1-20250716_094352.png`
    },
    {
      position: 'section2',
      filename: 'section2-20250716_094721.png',
      path: `public/images/blog/auto-generated/${sessionId}/section2-20250716_094721.png`
    },
    {
      position: 'section3',
      filename: 'section3-20250716_095522.png',
      path: `public/images/blog/auto-generated/${sessionId}/section3-20250716_095522.png`
    }
  ];
  
  // 画像ファイル存在確認
  console.log('🔍 画像ファイル存在確認中...');
  for (const imageFile of imageFiles) {
    try {
      await fs.access(imageFile.path);
      console.log(`✅ ${imageFile.position}: ${imageFile.filename}`);
    } catch (error) {
      console.error(`❌ 画像ファイルが見つかりません: ${imageFile.path}`);
      return;
    }
  }
  
  // 画像をSanityにアップロード
  const uploadedImages = {};
  console.log('📤 画像アップロード開始...');
  
  for (const imageFile of imageFiles) {
    try {
      console.log(`📤 画像アップロード中: ${imageFile.filename}...`);
      
      const buffer = await fs.readFile(imageFile.path);
      const asset = await client.assets.upload('image', buffer, {
        filename: imageFile.filename,
        title: `${slug}-${imageFile.position}`
      });
      
      uploadedImages[imageFile.position] = {
        _type: 'image',
        asset: {
          _type: 'reference',
          _ref: asset._id
        },
        alt: `${imageFile.position} image for ${slug}`
      };
      
      console.log(`✅ 画像アップロード完了: ${asset._id}`);
      
    } catch (error) {
      console.error(`❌ 画像アップロードエラー (${imageFile.filename}):`, error);
      return;
    }
  }
  
  console.log('✅ すべての画像アップロード完了');
  
  // 記事を画像付きで更新
  console.log('📝 記事に画像を統合中...');
  
  try {
    await client
      .patch(documentId)
      .set({
        headerImage: uploadedImages.header,
        section1Image: uploadedImages.section1,
        section2Image: uploadedImages.section2,
        section3Image: uploadedImages.section3,
        updatedAt: new Date().toISOString()
      })
      .commit();
    
    console.log(`✅ 記事更新完了: ${documentId}`);
    console.log('🎉 画像統合処理完了!');
    console.log(`🌐 記事URL: https://hiro-logue.vercel.app/blog/${slug}`);
    console.log(`📝 新しいヘッダー画像: header-20250716_112550.png を含む4枚の画像を統合しました`);
    
  } catch (error) {
    console.error('❌ 記事更新エラー:', error);
  }
}

// 実行
integrateImages().catch(console.error);