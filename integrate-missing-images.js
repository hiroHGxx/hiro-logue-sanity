#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@sanity/client');
const fs = require('fs').promises;

// Sanity設定
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2023-05-03',
  useCdn: false
});

async function integrateImagesForArticle(sessionId, documentId, slug, imageFiles) {
  console.log(`🎨 記事への画像統合開始: ${slug}`);
  console.log(`📋 記事ID: ${documentId}`);
  
  // 画像ファイル存在確認
  console.log('🔍 画像ファイル存在確認中...');
  for (const imageFile of imageFiles) {
    try {
      await fs.access(imageFile.path);
      console.log(`✅ ${imageFile.position}: ${imageFile.filename}`);
    } catch (error) {
      console.error(`❌ 画像ファイルが見つかりません: ${imageFile.path}`);
      return false;
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
      return false;
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
    console.log(`🌐 記事URL: https://hiro-logue.vercel.app/blog/${slug}`);
    return true;
    
  } catch (error) {
    console.error('❌ 記事更新エラー:', error);
    return false;
  }
}

async function main() {
  console.log('🎨 欠失画像統合処理開始...');
  
  // 統合が必要な記事一覧
  const articlesToIntegrate = [
    {
      sessionId: 'article-20250113-165200',
      documentId: 'CamHzSyS1JT3ENpT8Dde2Q',
      slug: 'adult-learning-reskilling-journey',
      imageFiles: [
        {
          position: 'header',
          filename: 'header-20250714_091056.png',
          path: 'public/images/blog/auto-generated/article-20250113-165200/header-20250714_091056.png'
        },
        {
          position: 'section1',
          filename: 'section1-20250714_093114.png',
          path: 'public/images/blog/auto-generated/article-20250113-165200/section1-20250714_093114.png'
        },
        {
          position: 'section2',
          filename: 'section2-20250714_094043.png',
          path: 'public/images/blog/auto-generated/article-20250113-165200/section2-20250714_094043.png'
        },
        {
          position: 'section3',
          filename: 'section3-20250714_095324.png',
          path: 'public/images/blog/auto-generated/article-20250113-165200/section3-20250714_095324.png'
        }
      ]
    },
    {
      sessionId: 'article-20250712-185045',
      documentId: 'vCfOT9yCEZ5e5C73QRfwmx',
      slug: 'remote-work-family-benefits',
      imageFiles: [
        {
          position: 'header',
          filename: 'header-20250714_074939.png',
          path: 'public/images/blog/auto-generated/article-20250712-185045/header-20250714_074939.png'
        },
        {
          position: 'section1',
          filename: 'section1-20250714_075308.png',
          path: 'public/images/blog/auto-generated/article-20250712-185045/section1-20250714_075308.png'
        },
        {
          position: 'section2',
          filename: 'section2-20250714_075954.png',
          path: 'public/images/blog/auto-generated/article-20250712-185045/section2-20250714_075954.png'
        },
        {
          position: 'section3',
          filename: 'section3-20250714_080722.png',
          path: 'public/images/blog/auto-generated/article-20250712-185045/section3-20250714_080722.png'
        }
      ]
    }
  ];
  
  for (const article of articlesToIntegrate) {
    const success = await integrateImagesForArticle(
      article.sessionId,
      article.documentId,
      article.slug,
      article.imageFiles
    );
    
    if (success) {
      console.log(`✅ ${article.slug} の画像統合完了\n`);
    } else {
      console.log(`❌ ${article.slug} の画像統合失敗\n`);
    }
  }
  
  console.log('🎉 欠失画像統合処理完了!');
}

main().catch(console.error);