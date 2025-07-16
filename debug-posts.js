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

async function debugPosts() {
  console.log('🔍 投稿データ調査開始...');
  
  // すべての投稿を取得
  const posts = await client.fetch(`
    *[_type == "post" && !(_id in path("drafts.**"))] | order(publishedAt desc) {
      _id,
      title,
      slug,
      mainImage,
      heroImage,
      headerImage,
      section1Image,
      section2Image,
      section3Image,
      publishedAt
    }
  `);
  
  console.log(`📊 総投稿数: ${posts.length}`);
  
  posts.forEach((post, index) => {
    console.log(`\n📄 記事 ${index + 1}: ${post.title}`);
    console.log(`🔗 スラッグ: ${post.slug?.current}`);
    console.log(`🆔 ID: ${post._id}`);
    
    const images = {
      headerImage: !!post.headerImage,
      heroImage: !!post.heroImage,
      mainImage: !!post.mainImage,
      section1Image: !!post.section1Image,
      section2Image: !!post.section2Image,
      section3Image: !!post.section3Image
    };
    
    console.log(`🖼️  画像フィールド:`, images);
    
    // 画像の詳細情報
    if (post.headerImage) {
      console.log(`   📷 headerImage: ${post.headerImage.asset?._ref || 'No asset ref'}`);
    }
    if (post.heroImage) {
      console.log(`   📷 heroImage: ${post.heroImage.asset?._ref || 'No asset ref'}`);
    }
    if (post.mainImage) {
      console.log(`   📷 mainImage: ${post.mainImage.asset?._ref || 'No asset ref'}`);
    }
  });
}

debugPosts().catch(console.error);