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

async function checkDuplicateImages() {
  console.log('🔍 重複画像チェック開始...');
  
  // 問題の記事を取得
  const post = await client.fetch(`
    *[_type == "post" && slug.current == "adult-learning-reskilling-journey"][0] {
      _id,
      title,
      slug,
      mainImage,
      heroImage,
      headerImage,
      section1Image,
      section2Image,
      section3Image,
      sectionImages,
      body
    }
  `);
  
  if (!post) {
    console.log('❌ 記事が見つかりません');
    return;
  }
  
  console.log(`📄 記事: ${post.title}`);
  console.log(`🆔 ID: ${post._id}`);
  
  console.log('\n🖼️ 画像フィールド:');
  console.log('mainImage:', post.mainImage ? `✅ ${post.mainImage.asset._ref}` : '❌ なし');
  console.log('heroImage:', post.heroImage ? `✅ ${post.heroImage.asset._ref}` : '❌ なし');
  console.log('headerImage:', post.headerImage ? `✅ ${post.headerImage.asset._ref}` : '❌ なし');
  console.log('section1Image:', post.section1Image ? `✅ ${post.section1Image.asset._ref}` : '❌ なし');
  console.log('section2Image:', post.section2Image ? `✅ ${post.section2Image.asset._ref}` : '❌ なし');
  console.log('section3Image:', post.section3Image ? `✅ ${post.section3Image.asset._ref}` : '❌ なし');
  console.log('sectionImages:', post.sectionImages ? `✅ ${post.sectionImages.length}枚` : '❌ なし');
  
  // body内の画像も確認
  console.log('\n📝 本文内の画像:');
  let bodyImageCount = 0;
  if (post.body && Array.isArray(post.body)) {
    post.body.forEach((block, index) => {
      if (block._type === 'image') {
        bodyImageCount++;
        console.log(`  画像 ${bodyImageCount}: ${block.asset._ref}`);
      } else if (block._type === 'sectionImage') {
        bodyImageCount++;
        console.log(`  セクション画像 ${bodyImageCount}: ${block.image.asset._ref}`);
      }
    });
  }
  
  if (bodyImageCount === 0) {
    console.log('  本文内に画像はありません');
  }
  
  console.log(`\n📊 合計画像数: ${bodyImageCount + (post.headerImage ? 1 : 0) + (post.section1Image ? 1 : 0) + (post.section2Image ? 1 : 0) + (post.section3Image ? 1 : 0)}`);
}

checkDuplicateImages().catch(console.error);