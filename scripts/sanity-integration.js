/**
 * Sanity画像統合スクリプト
 * Next.js API経由でSanity統合を呼び出し
 */

const http = require('http');
const path = require('path');

// 引数取得
const articleId = process.argv[2];
const outputDir = process.argv[3];
const sessionId = process.argv[4] || `integration_${articleId}`;

if (!articleId || !outputDir) {
  console.error('❌ Usage: node sanity-integration.js <articleId> <outputDir> [sessionId]');
  process.exit(1);
}

// Next.js API経由でSanity統合実行
async function integrateSanityImages() {
  try {
    console.log(`🔄 Starting Sanity integration for article: ${articleId}`);
    console.log(`📂 Output directory: ${outputDir}`);

    const postData = JSON.stringify({
      articleId,
      outputDir,
      sessionId
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/integrate-images',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    return new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            
            if (res.statusCode === 200 && response.success) {
              console.log('✅ Sanity integration completed successfully:');
              console.log(`   - Article ID: ${response.result.articleId}`);
              console.log(`   - Hero Image: ${response.result.heroImage ? 'Updated' : 'None'}`);
              console.log(`   - Section Images: ${response.result.sectionImagesCount} images`);
              console.log(`   - Total Uploaded: ${response.result.uploadedImagesCount} images`);
              resolve();
            } else {
              console.error('❌ Sanity integration failed:', response.error || 'Unknown error');
              reject(new Error(response.error || 'API request failed'));
            }
          } catch (parseError) {
            console.error('❌ Failed to parse API response:', parseError);
            reject(parseError);
          }
        });
      });

      req.on('error', (error) => {
        console.error('❌ HTTP request failed:', error);
        reject(error);
      });

      req.write(postData);
      req.end();
    });
    
  } catch (error) {
    console.error('❌ Sanity integration failed:', error);
    process.exit(1);
  }
}

integrateSanityImages()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Integration failed:', error);
    process.exit(1);
  });