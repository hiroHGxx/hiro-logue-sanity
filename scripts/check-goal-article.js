const { createClient } = require('@sanity/client');
require('dotenv').config({ path: '.env.local' });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01'
});

async function checkArticle() {
  try {
    const query = `*[_type == 'post' && slug.current == 'goal-achievement-three-essentials'][0] {
      _id,
      title,
      slug,
      body,
      headerImage,
      heroImage,
      mainImage,
      section1Image,
      section2Image,
      section3Image
    }`;
    
    const post = await client.fetch(query);
    
    if (!post) {
      console.log('記事が見つかりません');
      return;
    }
    
    console.log('=== 記事基本情報 ===');
    console.log('Title:', post.title);
    console.log('ID:', post._id);
    
    console.log('\n=== フィールド画像 ===');
    console.log('headerImage:', post.headerImage ? 'あり' : 'なし');
    console.log('heroImage:', post.heroImage ? 'あり' : 'なし'); 
    console.log('mainImage:', post.mainImage ? 'あり' : 'なし');
    console.log('section1Image:', post.section1Image ? 'あり' : 'なし');
    console.log('section2Image:', post.section2Image ? 'あり' : 'なし');
    console.log('section3Image:', post.section3Image ? 'あり' : 'なし');
    
    console.log('\n=== Body内の画像ブロック分析 ===');
    let imageCount = 0;
    const imageRefs = [];
    
    post.body.forEach((block, index) => {
      if (block._type === 'image') {
        imageCount++;
        const shortRef = block.asset._ref.substring(6, 20);
        imageRefs.push(shortRef);
        console.log(`画像ブロック ${imageCount} (位置: ${index}):`);
        console.log('  asset._ref:', shortRef + '...');
        console.log('  alt:', block.alt || 'なし');
      } else if (block._type === 'block' && block.style === 'h2') {
        console.log(`見出し (位置: ${index}): ${block.children[0].text}`);
      }
    });
    
    console.log(`\n総画像ブロック数: ${imageCount}`);
    
    // 重複画像の検出
    const duplicates = imageRefs.filter((item, index) => imageRefs.indexOf(item) !== index);
    if (duplicates.length > 0) {
      console.log('\n🚨 重複画像検出:');
      duplicates.forEach(ref => {
        console.log('  重複ref:', ref);
      });
    } else {
      console.log('\n✅ Body内に重複画像なし');
    }
    
    // フィールド画像とBody画像の重複チェック
    const fieldImageRefs = [];
    if (post.headerImage?.asset?._ref) fieldImageRefs.push(post.headerImage.asset._ref.substring(6, 20));
    if (post.heroImage?.asset?._ref) fieldImageRefs.push(post.heroImage.asset._ref.substring(6, 20));
    if (post.mainImage?.asset?._ref) fieldImageRefs.push(post.mainImage.asset._ref.substring(6, 20));
    if (post.section1Image?.asset?._ref) fieldImageRefs.push(post.section1Image.asset._ref.substring(6, 20));
    if (post.section2Image?.asset?._ref) fieldImageRefs.push(post.section2Image.asset._ref.substring(6, 20));
    if (post.section3Image?.asset?._ref) fieldImageRefs.push(post.section3Image.asset._ref.substring(6, 20));
    
    const fieldBodyOverlap = imageRefs.filter(ref => fieldImageRefs.includes(ref));
    if (fieldBodyOverlap.length > 0) {
      console.log('\n⚠️ フィールド画像とBody画像の重複:');
      fieldBodyOverlap.forEach(ref => {
        console.log('  重複ref:', ref);
      });
    } else {
      console.log('\n✅ フィールド画像とBody画像の重複なし');
    }
    
  } catch (error) {
    console.error('エラー:', error.message);
  }
}

checkArticle();