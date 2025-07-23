require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@sanity/client');
const fs = require('fs');

// Sanity client setup
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION
});

// 今回のセッション設定
const sessionConfig = {
  articleId: 'NqxSZpGEWOJozkIriX9WzR', // 記事ID（前のセッションで作成済み）
  sessionId: 'article-20250123-145823',
  images: {
    header: {
      path: '/Users/gotohiro/Documents/user/Products/ContentFlow/sanity-edition/public/images/blog/auto-generated/article-20250123-145823/header-20250723_100415.png',
      alt: '温かい午後の光が差し込む、インプットとアウトプットのバランスを象徴する学習空間',
      filename: 'input-output-header.png'
    },
    section1: {
      path: '/Users/gotohiro/Documents/user/Products/ContentFlow/sanity-edition/public/images/blog/auto-generated/article-20250123-145823/section1-20250723_112036.png',
      alt: 'プログラミング関連の書籍とオンライン学習を表現した水彩画風イラスト',
      filename: 'input-output-section1.png'
    },
    section2: {
      path: '/Users/gotohiro/Documents/user/Products/ContentFlow/sanity-edition/public/images/blog/auto-generated/article-20250123-145823/section2-20250723_120107.png',
      alt: '創造的な活動と理解の深化プロセスを表現したフラットデザイン',
      filename: 'input-output-section2.png'
    },
    section3: {
      path: '/Users/gotohiro/Documents/user/Products/ContentFlow/sanity-edition/public/images/blog/auto-generated/article-20250123-145823/section3-20250723_133329.png',
      alt: '段階的な成長と小さな習慣の積み重ねを表現した抽象アート',
      filename: 'input-output-section3.png'
    }
  }
};

async function uploadImage(imageConfig) {
  try {
    console.log(`📤 画像アップロード中: ${imageConfig.filename}...`);
    
    if (!fs.existsSync(imageConfig.path)) {
      throw new Error(`画像ファイルが見つかりません: ${imageConfig.path}`);
    }
    
    const imageAsset = await client.assets.upload('image', fs.createReadStream(imageConfig.path), {
      filename: imageConfig.filename
    });
    
    console.log(`✅ 画像アップロード完了: ${imageConfig.filename}`);
    return imageAsset;
  } catch (error) {
    console.error(`❌ 画像アップロードエラー: ${imageConfig.filename}`, error.message);
    throw error;
  }
}

async function updateArticleWithImages() {
  try {
    console.log('🚀 記事画像統合開始...');
    console.log(`📋 記事ID: ${sessionConfig.articleId}`);
    
    // 画像をアップロード
    const uploadedImages = {};
    for (const [position, imageConfig] of Object.entries(sessionConfig.images)) {
      const asset = await uploadImage(imageConfig);
      uploadedImages[position] = {
        _type: 'image',
        asset: {
          _type: 'reference',
          _ref: asset._id
        },
        alt: imageConfig.alt
      };
    }
    
    // 記事の現在の body を取得
    const currentArticle = await client.getDocument(sessionConfig.articleId);
    console.log('📄 現在の記事データ取得完了');
    
    // body に画像ブロックを追加
    const updatedBody = [
      // はじめに画像（header）
      uploadedImages.header,
      ...currentArticle.body.slice(0, 5), // はじめにセクション（推定）
      
      // セクション1画像
      uploadedImages.section1,
      ...currentArticle.body.slice(5, 10), // セクション1（推定）
      
      // セクション2画像  
      uploadedImages.section2,
      ...currentArticle.body.slice(10, 15), // セクション2（推定）
      
      // セクション3画像
      uploadedImages.section3,
      ...currentArticle.body.slice(15), // セクション3以降
    ];
    
    // 記事を更新
    const updatedArticle = await client
      .patch(sessionConfig.articleId)
      .set({
        body: updatedBody,
        headerImage: uploadedImages.header,
        heroImage: uploadedImages.header,
        mainImage: uploadedImages.header
      })
      .commit();
    
    console.log('✅ 記事画像統合完了');
    console.log(`🔗 記事URL: https://hiro-logue.vercel.app/blog/input-output-learning-balance`);
    
    return updatedArticle;
    
  } catch (error) {
    console.error('❌ 画像統合エラー:', error);
    throw error;
  }
}

// 実行
updateArticleWithImages()
  .then(() => {
    console.log('🎉 画像統合処理完了');
  })
  .catch((error) => {
    console.error('💥 処理エラー:', error);
    process.exit(1);
  });