#!/usr/bin/env node
/**
 * 生成済み画像のSanity記事統合スクリプト
 * image-generation-status.jsonを読み取り、生成済み画像を対象記事に統合
 */

// 環境変数読み込み
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@sanity/client');
const fs = require('fs');
const path = require('path');

// Sanityクライアント設定
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'hbqm9iu5',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
});

/**
 * 生成済み画像をSanity記事に統合
 */
async function integrateGeneratedImages() {
  try {
    console.log('🎨 生成済み画像のSanity統合開始...');
    
    // 状態ファイル読み込み
    const statusFilePath = path.join(process.cwd(), 'image-generation-status.json');
    if (!fs.existsSync(statusFilePath)) {
      throw new Error('状態ファイルが見つかりません: image-generation-status.json');
    }
    
    const statusData = JSON.parse(fs.readFileSync(statusFilePath, 'utf-8'));
    
    console.log(`📋 セッション: ${statusData.sessionId}`);
    console.log(`📄 Sanity Document ID: ${statusData.sanityDocumentId}`);
    console.log(`🌐 記事URL: ${statusData.publishedUrl}`);
    
    // 生成済み画像ファイル検索
    const generatedImagesDir = path.join(process.cwd(), 'public/images/blog/auto-generated');
    const imageFiles = fs.readdirSync(generatedImagesDir)
      .filter(f => f.endsWith('.png'))
      .sort(); // ファイル名順でソート
    
    console.log(`🖼️  生成済み画像: ${imageFiles.length}枚`);
    imageFiles.forEach(file => console.log(`  - ${file}`));
    
    if (imageFiles.length === 0) {
      throw new Error('生成済み画像が見つかりません');
    }
    
    // プロンプト情報から各画像の説明取得
    const prompts = statusData.prompts || [];
    
    // 画像をSanityにアップロード
    const uploadedImages = [];
    for (let i = 0; i < imageFiles.length && i < prompts.length; i++) {
      const imageFile = imageFiles[i];
      const prompt = prompts[i];
      const imagePath = path.join(generatedImagesDir, imageFile);
      
      console.log(`\\n📤 画像アップロード: ${imageFile}`);
      console.log(`🎯 位置: ${prompt.position}`);
      console.log(`📝 説明: ${prompt.description}`);
      
      // Sanityに画像アップロード
      const imageBuffer = fs.readFileSync(imagePath);
      const imageAsset = await client.assets.upload('image', imageBuffer, {
        filename: imageFile,
        title: prompt.description
      });
      
      console.log(`✅ アップロード完了: ${imageAsset._id}`);
      
      uploadedImages.push({
        position: prompt.position,
        assetId: imageAsset._id,
        description: prompt.description,
        filename: imageFile
      });
    }
    
    console.log(`\\n🔄 記事への画像統合開始...`);
    
    // 既存記事取得
    const existingPost = await client.getDocument(statusData.sanityDocumentId);
    if (!existingPost) {
      throw new Error(`記事が見つかりません: ${statusData.sanityDocumentId}`);
    }
    
    console.log(`📖 既存記事: ${existingPost.title}`);
    
    // Portable Text形式で画像を挿入
    const updatedBody = insertImagesIntoPortableText(existingPost.body, uploadedImages);
    
    // ヘッダー画像設定（最初の画像をメイン画像として使用）
    const heroImage = uploadedImages.find(img => img.position === 'header') || uploadedImages[0];
    
    // 記事更新
    const updateData = {
      body: updatedBody,
      mainImage: {
        _type: 'image',
        asset: {
          _type: 'reference',
          _ref: heroImage.assetId
        },
        alt: heroImage.description
      }
    };
    
    console.log(`🔄 記事更新実行...`);
    
    const updatedPost = await client
      .patch(statusData.sanityDocumentId)
      .set(updateData)
      .commit();
    
    console.log(`\\n🎉 画像統合完了!`);
    console.log(`📄 更新記事: ${updatedPost.title}`);
    console.log(`🖼️  統合画像数: ${uploadedImages.length}枚`);
    console.log(`🌐 確認URL: ${statusData.publishedUrl}`);
    
    // 状態ファイル更新
    statusData.status = 'images_integrated';
    statusData.imageGeneration.completed = uploadedImages.length;
    statusData.imageGeneration.uploadedImages = uploadedImages;
    statusData.integrationCompletedAt = new Date().toISOString();
    
    fs.writeFileSync(statusFilePath, JSON.stringify(statusData, null, 2), 'utf-8');
    console.log(`💾 状態ファイル更新完了`);
    
    return {
      success: true,
      documentId: statusData.sanityDocumentId,
      imagesIntegrated: uploadedImages.length,
      publicUrl: statusData.publishedUrl
    };
    
  } catch (error) {
    console.error(`❌ 画像統合エラー: ${error.message}`);
    throw error;
  }
}

/**
 * Portable TextのセクションH2の後に画像を挿入
 */
function insertImagesIntoPortableText(body, uploadedImages) {
  if (!body || !Array.isArray(body)) {
    return body;
  }
  
  const updatedBody = [];
  let sectionIndex = 0;
  
  for (let i = 0; i < body.length; i++) {
    const block = body[i];
    updatedBody.push(block);
    
    // H2見出しの場合、その後に対応する画像を挿入
    if (block._type === 'block' && block.style === 'h2') {
      sectionIndex++;
      
      // 対応する画像を検索
      const sectionImages = uploadedImages.filter(img => 
        img.position === `section${sectionIndex}` || 
        (sectionIndex === 1 && img.position === 'section1') ||
        (sectionIndex === 2 && img.position === 'section2') ||
        (sectionIndex === 3 && img.position === 'section3')
      );
      
      // 画像ブロックを挿入
      sectionImages.forEach(imageData => {
        const imageBlock = {
          _type: 'image',
          _key: `image-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          asset: {
            _type: 'reference',
            _ref: imageData.assetId
          },
          alt: imageData.description
        };
        
        updatedBody.push(imageBlock);
        console.log(`🖼️  ${imageData.position}に画像挿入: ${imageData.filename}`);
      });
    }
  }
  
  return updatedBody;
}

/**
 * 使用方法表示
 */
function showUsage() {
  console.log('🎨 生成済み画像のSanity統合スクリプト');
  console.log('');
  console.log('使用方法:');
  console.log('  node integrate-generated-images.js');
  console.log('');
  console.log('前提条件:');
  console.log('  - image-generation-status.json ファイルが存在すること');
  console.log('  - public/images/blog/auto-generated/ に画像ファイルが存在すること');
  console.log('  - .env.local に SANITY_API_TOKEN が設定されていること');
}

/**
 * メイン処理
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help')) {
    showUsage();
    process.exit(0);
  }
  
  // 環境変数チェック
  if (!process.env.SANITY_API_TOKEN) {
    console.error('❌ 環境変数 SANITY_API_TOKEN が設定されていません');
    console.error('   .env.local ファイルに設定してください');
    process.exit(1);
  }
  
  try {
    console.log('🚀 生成済み画像統合プロセス開始');
    console.log(`🕐 開始時刻: ${new Date().toLocaleString()}`);
    
    const result = await integrateGeneratedImages();
    
    console.log('\\n🎉 統合プロセス完了!');
    console.log(`📄 Document ID: ${result.documentId}`);
    console.log(`🖼️  統合画像数: ${result.imagesIntegrated}枚`);
    console.log(`🌐 公開URL: ${result.publicUrl}`);
    
  } catch (error) {
    console.error('\\n🚨 統合プロセス失敗');
    console.error(`エラー: ${error.message}`);
    process.exit(1);
  }
}

// Node.js環境でのみ実行
if (typeof require !== 'undefined' && require.main === module) {
  main();
}

module.exports = { integrateGeneratedImages, insertImagesIntoPortableText };