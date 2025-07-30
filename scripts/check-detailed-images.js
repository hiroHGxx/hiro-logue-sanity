const { createClient } = require('@sanity/client');
require('dotenv').config({ path: '.env.local' });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01'
});

async function checkDetailedImages() {
  try {
    const query = `*[_type == 'post' && slug.current == 'goal-achievement-three-essentials'][0] {
      _id,
      title,
      headerImage {
        asset->{_id, url},
        alt
      },
      section1Image {
        asset->{_id, url},
        alt
      },
      section2Image {
        asset->{_id, url},
        alt
      },
      section3Image {
        asset->{_id, url},
        alt
      },
      body[] {
        _type,
        _key,
        asset->{_id, url},
        alt,
        style,
        children[] {
          text
        }
      }
    }`;
    
    const post = await client.fetch(query);
    
    console.log('=== フィールド画像詳細 ===');
    console.log('headerImage:');
    if (post.headerImage) {
      console.log('  ID:', post.headerImage.asset._id.substring(6, 20) + '...');
      console.log('  alt:', post.headerImage.alt);
    }
    
    console.log('\nsection1Image:');
    if (post.section1Image) {
      console.log('  ID:', post.section1Image.asset._id.substring(6, 20) + '...');
      console.log('  alt:', post.section1Image.alt);
    }
    
    console.log('\nsection2Image:');
    if (post.section2Image) {
      console.log('  ID:', post.section2Image.asset._id.substring(6, 20) + '...');
      console.log('  alt:', post.section2Image.alt);
    }
    
    console.log('\nsection3Image:');
    if (post.section3Image) {
      console.log('  ID:', post.section3Image.asset._id.substring(6, 20) + '...');
      console.log('  alt:', post.section3Image.alt);
    }
    
    console.log('\n=== Body画像詳細 ===');
    post.body.forEach((block, index) => {
      if (block._type === 'image') {
        console.log(`Body画像 (位置: ${index}):`);
        console.log('  ID:', block.asset._id.substring(6, 20) + '...');
        console.log('  alt:', block.alt);
      }
    });
    
    console.log('\n=== 重複マッピング ===');
    const mappings = [
      { field: 'headerImage', bodyPosition: 2 },
      { field: 'section1Image', bodyPosition: 5 },
      { field: 'section2Image', bodyPosition: 8 },
      { field: 'section3Image', bodyPosition: 11 }
    ];
    
    mappings.forEach(mapping => {
      const fieldImage = post[mapping.field];
      const bodyImage = post.body[mapping.bodyPosition];
      
      if (fieldImage && bodyImage && bodyImage._type === 'image') {
        const fieldId = fieldImage.asset._id.substring(6, 20);
        const bodyId = bodyImage.asset._id.substring(6, 20);
        
        console.log(`${mapping.field} vs Body位置${mapping.bodyPosition}:`);
        console.log(`  Field ID: ${fieldId}...`);
        console.log(`  Body ID:  ${bodyId}...`);
        console.log(`  重複: ${fieldId === bodyId ? '⚠️ YES' : '✅ NO'}`);
      }
    });
    
  } catch (error) {
    console.error('エラー:', error.message);
  }
}

checkDetailedImages();