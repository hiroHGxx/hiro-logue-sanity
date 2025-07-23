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

// 今回の記事設定
const articleConfig = {
  articleId: 'pnkFeZ6saTOgO27Op2NX5f', // 今回生成された記事ID
  slug: 'ai-era-originality-creativity',
  sessionId: 'article-20250123-205030',
  images: {
    header: {
      path: '/Users/gotohiro/Documents/user/Products/ContentFlow/sanity-edition/public/images/blog/auto-generated/article-20250123-205030/header-20250724_065619.png',
      alt: 'AI時代の創造性 - 現代的な書斎での創作環境',
      filename: 'ai-creativity-header.png'
    },
    section1: {
      path: '/Users/gotohiro/Documents/user/Products/ContentFlow/sanity-edition/public/images/blog/auto-generated/article-20250123-205030/section1-20250724_070419.png',
      alt: '伝統的創作とAI創作の出会い - 子どもの画材とデジタルツール',
      filename: 'ai-creativity-section1.png'
    },
    section2: {
      path: '/Users/gotohiro/Documents/user/Products/ContentFlow/sanity-edition/public/images/blog/auto-generated/article-20250123-205030/section2-20250724_071752.png',
      alt: '動物たちの学習プロセス - 和風インテリアでの調和',
      filename: 'ai-creativity-section2.png'
    },
    section3: {
      path: '/Users/gotohiro/Documents/user/Products/ContentFlow/sanity-edition/public/images/blog/auto-generated/article-20250123-205030/section3-20250724_072235.png',
      alt: 'AIと人間の協働 - 技術と人間性のバランス',
      filename: 'ai-creativity-section3.png'
    }
  }
};

async function uploadImage(imageConfig) {
  try {
    console.log(`📤 画像アップロード中: ${imageConfig.filename}...`);
    
    if (!fs.existsSync(imageConfig.path)) {
      throw new Error(`画像ファイルが見つかりません: ${imageConfig.path}`);
    }
    
    const imageBuffer = fs.readFileSync(imageConfig.path);
    const imageAsset = await client.assets.upload('image', imageBuffer, {
      filename: imageConfig.filename
    });
    
    console.log(`✅ 画像アップロード完了: ${imageAsset._id}`);
    return imageAsset;
  } catch (error) {
    console.error(`❌ 画像アップロードエラー ${imageConfig.filename}:`, error.message);
    throw error;
  }
}

async function updateArticleWithImages(uploadedImages) {
  try {
    console.log('📝 記事に画像を統合中...');
    
    // Portable Text形式で画像を含む記事構造を作成
    const updatedBody = [
      {
        _type: 'block',
        _key: 'intro',
        style: 'h2',
        children: [{ _type: 'span', text: 'はじめに' }]
      },
      {
        _type: 'image',
        _key: 'heroImage',
        asset: {
          _type: 'reference',
          _ref: uploadedImages.header._id
        },
        alt: articleConfig.images.header.alt
      },
      {
        _type: 'block',
        _key: 'intro-content',
        style: 'normal',
        children: [{ 
          _type: 'span', 
          text: '40代になってから、「学び直し」という言葉をよく耳にするようになりました。リスキリングという横文字で表現されることも多いですが、要するに新しいスキルを身につけて時代の変化に対応していこうということなのかなと思います。\n\n実はですね、我が家でもこの話題が最近よく出てきまして。妻が「最近のAIって本当にすごいのね」と言いながら、「私たちの仕事もいつまであるのかしら」なんて心配していたんです。そんな中、中学生の子どもが「お父さんもプログラミング以外のことやってみたら？」と無邪気に提案してくれて、改めて自分自身の学びについて考えるきっかけになりました。\n\n皆さんも40代を過ぎて、「今から新しいことを始めるのは遅いのかな」と感じることはありませんか？今回は、そんな気持ちと向き合いながら実際に学び直しを始めてみた体験について書いていきます。' 
        }]
      },
      {
        _type: 'block',
        _key: 'section1-title',
        style: 'h2',
        children: [{ _type: 'span', text: '最初の一歩は思っていたより重かった' }]
      },
      {
        _type: 'image',
        _key: 'section1Image',
        asset: {
          _type: 'reference',
          _ref: uploadedImages.section1._id
        },
        alt: articleConfig.images.section1.alt
      },
      {
        _type: 'block',
        _key: 'section1-content',
        style: 'normal',
        children: [{ 
          _type: 'span', 
          text: '正直なところ、「リスキリング」という言葉を聞いた時の最初の印象は「また新しい横文字が出てきたな」というものでした。プログラマーとして日々新しい技術に触れているつもりでしたが、それとは違う分野の学習となると話は別なんですね。\n\n実際に始めてみようと思ったのは、地域活性化の副業をしている中で、マーケティングやデザインの知識が必要だと感じたからでした。でも、いざ学習を始めようとすると、「本当に覚えられるのかな」「時間はあるのかな」という不安がわいてきました。\n\n妻に相談したところ、「技術のことはあんなに熱心に勉強してるじゃない」と言われたんですが、それが逆に盲点だったんです。プログラミングの学習は積み重ねてきた経験があるから自然にできるけれど、全く新しい分野となると勝手が違うんですね。\n\n保護犬ちゃんが新しい環境に慣れるまで時間がかかったように、私たちも新しい学びには慣れが必要なのかもしれません。最初は戸惑いながらも、少しずつ前に進んでいく姿勢が大切なのかなと思います。' 
        }]
      },
      {
        _type: 'block',
        _key: 'section2-title',
        style: 'h2',
        children: [{ _type: 'span', text: '年齢は制限ではなく、むしろ強みになる' }]
      },
      {
        _type: 'image',
        _key: 'section2Image',
        asset: {
          _type: 'reference',
          _ref: uploadedImages.section2._id
        },
        alt: articleConfig.images.section2.alt
      },
      {
        _type: 'block',
        _key: 'section2-content',
        style: 'normal',
        children: [{ 
          _type: 'span', 
          text: '学習を続けていく中で気づいたのは、40代だからこその強みがあるということでした。若い頃は勢いで学習していたところがありましたが、今は経験に基づいて効率的に学べるんです。\n\n例えば、マーケティングを学ぶ時も、これまでの仕事経験や人間関係の中で感じてきたことと結びつけて理解できました。「ああ、あの時のお客さんの反応はこういうことだったのか」といった具合に、過去の体験が学習の材料になるんですね。\n\n中学生の子どもに「お父さん、すごいじゃん」と言われた時は、正直びっくりしました。子どもから見ても、大人が新しいことを学ぶ姿は魅力的に映るみたいです。そんな姿を見せることで、家族にも良い影響を与えられているのかもしれません。\n\nまた、40代という年齢だからこそ、学習の目的も明確なんです。若い頃のように「とりあえず勉強する」のではなく、「この知識をどう活用するか」を考えながら学べるので、身につくスピードも早い気がします。\n\n皆さんも、これまでの経験を学習の土台として活用できることがたくさんあるのではないでしょうか。' 
        }]
      },
      {
        _type: 'block',
        _key: 'section3-title',
        style: 'h2',
        children: [{ _type: 'span', text: '技術と人間らしさのバランスを見つける' }]
      },
      {
        _type: 'image',
        _key: 'section3Image',
        asset: {
          _type: 'reference',
          _ref: uploadedImages.section3._id
        },
        alt: articleConfig.images.section3.alt
      },
      {
        _type: 'block',
        _key: 'section3-content',
        style: 'normal',
        children: [{ 
          _type: 'span', 
          text: '学び直しを進める中で、特に感じるのは技術と人間らしさのバランスの大切さです。AIやデジタル技術が急速に発達する中で、人間にしかできないことを磨いていくことも重要なのかなと思います。\n\n実際に新しいスキルを身につけていく過程で、技術的な知識だけでなく、コミュニケーションや創造性といった人間的な能力の重要性を改めて感じました。保護猫ちゃんとの毎日のやり取りから学ぶような、相手の気持ちを理解する力は、どんなに技術が進歩しても必要なスキルですよね。\n\n妻が「技術を学ぶのも大切だけど、人との関わり方を忘れちゃダメよ」と言っていたのが印象的でした。確かに、新しいスキルを学ぶ時も、それを人とのつながりの中で活かしていけるかどうかが重要なポイントなのかもしれません。\n\n40代からの学び直しは、単に新しい技術を覚えることではなく、これまでの人生経験と新しい知識を融合させて、より豊かな人間性を育んでいくことなのかなと感じています。' 
        }]
      },
      {
        _type: 'block',
        _key: 'conclusion-title',
        style: 'h2',
        children: [{ _type: 'span', text: 'おわりに' }]
      },
      {
        _type: 'block',
        _key: 'conclusion-content',
        style: 'normal',
        children: [{ 
          _type: 'span', 
          text: '今回は「40代からのリスキリングについて」書きました。最初は不安もありましたが、実際に始めてみると、年齢を重ねたからこその学び方があることを発見できました。\n\n技術の進歩は確かに早いですが、それに振り回されるのではなく、自分のペースで必要なスキルを身につけていけばいいのかなと思います。何より、新しいことを学ぶ姿勢を持ち続けることで、家族や周りの人たちにも良い影響を与えられるのが嬉しいですね。\n\n皆さんも、何か新しく学んでみたいことはありませんか？40代だからこそできる学び方について、もしよろしければコメントで教えてください。一緒に学び続けていけたら素敵ですね。\n\n毎日の小さな積み重ねが、きっと大きな成長につながっていくのだと信じています。' 
        }]
      }
    ];

    const updateResult = await client
      .patch(articleConfig.articleId)
      .set({ body: updatedBody })
      .commit();

    console.log('✅ 記事更新完了:', updateResult._id);
    return updateResult;
  } catch (error) {
    console.error('❌ 記事更新エラー:', error.message);
    throw error;
  }
}

async function integrateArticleImages() {
  try {
    console.log('🚀 記事画像統合開始...');
    console.log(`📋 記事ID: ${articleConfig.articleId}`);
    console.log(`🔗 スラッグ: ${articleConfig.slug}`);

    // 画像ファイル存在確認
    const missingImages = [];
    for (const [position, imageConfig] of Object.entries(articleConfig.images)) {
      if (!fs.existsSync(imageConfig.path)) {
        missingImages.push(`${position}: ${imageConfig.path}`);
      }
    }

    if (missingImages.length > 0) {
      throw new Error(`画像ファイルが見つかりません:\n${missingImages.join('\n')}`);
    }

    console.log('✅ すべての画像ファイル確認完了');

    // 画像アップロード
    const uploadedImages = {};
    for (const [position, imageConfig] of Object.entries(articleConfig.images)) {
      uploadedImages[position] = await uploadImage(imageConfig);
    }

    console.log('✅ すべての画像アップロード完了');

    // 記事更新
    await updateArticleWithImages(uploadedImages);

    console.log('🎉 記事画像統合完了!');
    console.log(`🌐 記事URL: https://hiro-logue.vercel.app/blog/${articleConfig.slug}`);

  } catch (error) {
    console.error('❌ 記事画像統合エラー:', error.message);
    process.exit(1);
  }
}

// 実行
integrateArticleImages();