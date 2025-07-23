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

// AI独創性記事の設定
const articleConfig = {
  articleId: 'pnkFeZ6saTOgO27Op2NX5f',
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

async function createAICreativityArticleWithImages(uploadedImages) {
  try {
    console.log('📝 AI独創性記事に画像を統合中...');
    
    // 正しいAI独創性記事のPortable Text形式（画像付き）
    const updatedBody = [
      {
        _type: 'block',
        _key: 'intro-title',
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
        _key: 'intro-content-1',
        style: 'normal',
        children: [{ 
          _type: 'span', 
          text: '最近、我が家の中学生の子どもが「AIが絵を描いてくれるから、もう絵を練習する意味がないんじゃない？」と言ったんですね。その瞬間、私自身もプログラミングをしていて同じような疑問を感じていたことに気づきました。' 
        }]
      },
      {
        _type: 'block',
        _key: 'intro-content-2',
        style: 'normal',
        children: [{ 
          _type: 'span', 
          text: 'AIが文章を書き、絵を描き、音楽を作る時代に、人間の独創性って一体何なのでしょうか。もしかすると、私たちが「独創性」だと思っていたものが、実は違う形で存在しているのかもしれません。' 
        }]
      },
      {
        _type: 'block',
        _key: 'intro-content-3',
        style: 'normal',
        children: [{ 
          _type: 'span', 
          text: '皆さんも、AIツールを使いながら「これって自分の作品と言えるのかな？」と迷ったことはありませんか？今回は、そんな現代の創造性について、家族との会話や日々の体験を通して感じたことを書いていこうと思います。' 
        }]
      },
      {
        _type: 'block',
        _key: 'section1-title',
        style: 'h2',
        children: [{ _type: 'span', text: '子どもの疑問から始まった気づき' }]
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
        _key: 'section1-content-1',
        style: 'normal',
        children: [{ 
          _type: 'span', 
          text: '先ほどの中学生の子どもの発言ですが、実はその後の会話がとても興味深かったんです。妻が「でも、AIに何を描かせるかを考えるのは、あなたでしょ？」と返したところ、子どもがハッとした表情を見せたんですね。' 
        }]
      },
      {
        _type: 'block',
        _key: 'section1-content-2',
        style: 'normal',
        children: [{ 
          _type: 'span', 
          text: 'これを聞いて、私も改めて自分のプログラミング作業を振り返ってみました。最近はChatGPTやClaude、GitHub Copilotなどを頻繁に使っているのですが、コードの大部分をAIが生成していても、何を作るか、どういう機能にするか、どんなユーザー体験を提供するかは、やはり私が考えているんですね。' 
        }]
      },
      {
        _type: 'block',
        _key: 'section1-content-3',
        style: 'normal',
        children: [{ 
          _type: 'span', 
          text: 'プログラマーとして20年近く働いてきて感じるのは、実は昔から私たちはずっと「真似」から始めていたということです。参考書のサンプルコードをコピーして、Stack Overflowから解決策を見つけて、オープンソースライブラリを組み合わせて。' 
        }]
      },
      {
        _type: 'block',
        _key: 'section1-content-4',
        style: 'normal',
        children: [{ 
          _type: 'span', 
          text: 'でも、それらを「どう組み合わせるか」「何のために使うか」「どんな問題を解決するか」という部分は、常に人間が考えてきました。AIが登場した今も、この本質は変わっていないような気がします。' 
        }]
      },
      {
        _type: 'block',
        _key: 'section2-title',
        style: 'h2',
        children: [{ _type: 'span', text: '保護犬ちゃんから学んだ「模倣の力」' }]
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
        _key: 'section2-content-1',
        style: 'normal',
        children: [{ 
          _type: 'span', 
          text: '面白いことに、この「真似から始まる創造」について考えていた時、我が家の保護犬ちゃんの行動を観察していて、ハッとした瞬間があったんですね。' 
        }]
      },
      {
        _type: 'block',
        _key: 'section2-content-2',
        style: 'normal',
        children: [{ 
          _type: 'span', 
          text: '保護犬ちゃんは、最初に家に来た時は人間との関わり方がよく分からなかったようでした。でも、保護猫ちゃんの行動を見て学んでいくんです。猫ちゃんが私の膝の上に乗ると、犬ちゃんも真似して膝に乗ろうとします（サイズ的に無理なんですが）。' 
        }]
      },
      {
        _type: 'block',
        _key: 'section2-content-3',
        style: 'normal',
        children: [{ 
          _type: 'span', 
          text: 'でも、犬ちゃんなりの表現方法を見つけていくんですね。猫のように膝には乗れないけれど、足元にぴったりと寄り添って甘える方法を編み出しました。これって、まさに「模倣から独自性への発展」だなと思ったんです。' 
        }]
      },
      {
        _type: 'block',
        _key: 'section2-content-4',
        style: 'normal',
        children: [{ 
          _type: 'span', 
          text: 'AI時代の創造性も、これと似ているのかもしれません。AIの出力を「真似」するのではなく、AIを「道具として使いながら」自分なりの表現を見つけていく。そんな新しい創造のプロセスが生まれているのかもしれませんね。' 
        }]
      },
      {
        _type: 'block',
        _key: 'section3-title',
        style: 'h2',
        children: [{ _type: 'span', text: '技術と人間性のバランスを見つける' }]
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
        _key: 'section3-content-1',
        style: 'normal',
        children: [{ 
          _type: 'span', 
          text: '最近、プロジェクトでStable DiffusionやGPTを活用したWebアプリケーションを作っているのですが、興味深い発見がありました。AIが生成するコンテンツをそのまま使うよりも、「人間らしい調整」を加えた方が、ユーザーからの反応が良いんですね。' 
        }]
      },
      {
        _type: 'block',
        _key: 'section3-content-2',
        style: 'normal',
        children: [{ 
          _type: 'span', 
          text: '例えば、AIが生成した文章に、実際の体験談を混ぜたり、少し不完全な部分を残したり。完璧すぎるものよりも、人間らしい「揺らぎ」や「個性」があるコンテンツの方が、読者に愛されることが多いんです。' 
        }]
      },
      {
        _type: 'block',
        _key: 'section3-content-3',
        style: 'normal',
        children: [{ 
          _type: 'span', 
          text: 'これは妻との会話でも話題になったのですが、「完璧な料理を作るロボットよりも、たまに味付けを間違えるお母さんの料理の方が愛される」のと似ているかもしれません。' 
        }]
      },
      {
        _type: 'block',
        _key: 'section3-content-4',
        style: 'normal',
        children: [{ 
          _type: 'span', 
          text: 'AI時代の独創性とは、もしかすると「AIと協働しながら、いかに人間らしさを表現するか」なのかもしれませんね。技術の力を借りながらも、最終的には人間の感性や体験、価値観を反映させる。そんなバランス感覚が求められているような気がします。' 
        }]
      },
      {
        _type: 'block',
        _key: 'section3-question',
        style: 'normal',
        children: [{ 
          _type: 'span', 
          text: '皆さんはAIツールを使う時、どのように「自分らしさ」を表現していらっしゃいますか？' 
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
        _key: 'conclusion-content-1',
        style: 'normal',
        children: [{ 
          _type: 'span', 
          text: '今回は「AI時代の独創性」について、家族との会話やペットとの日常から感じたことを書きました。' 
        }]
      },
      {
        _type: 'block',
        _key: 'conclusion-content-2',
        style: 'normal',
        children: [{ 
          _type: 'span', 
          text: '結論として感じるのは、独創性の定義が変わってきているということです。ゼロから何かを作り出すことだけが創造性ではなく、「既存のものをどう組み合わせ、どう活用し、どう人間らしく表現するか」という新しい形の創造性が重要になってきているのかもしれません。' 
        }]
      },
      {
        _type: 'block',
        _key: 'conclusion-content-3',
        style: 'normal',
        children: [{ 
          _type: 'span', 
          text: 'AIは確かに多くのことを代替してくれますが、「何を作りたいか」「誰のために作るか」「なぜ作るのか」という部分は、やはり人間にしかできないことだと思います。そして、その「意図」や「想い」こそが、AI時代の独創性の核心なのかもしれませんね。' 
        }]
      },
      {
        _type: 'block',
        _key: 'conclusion-content-4',
        style: 'normal',
        children: [{ 
          _type: 'span', 
          text: '皆さんも、AIツールを使いながら何かを創作された経験はありますか？その時、どんな部分に「自分らしさ」を感じられたでしょうか。もしよろしければ、コメントで教えていただけると嬉しいです。' 
        }]
      },
      {
        _type: 'block',
        _key: 'conclusion-content-5',
        style: 'normal',
        children: [{ 
          _type: 'span', 
          text: '新しい時代の創造性について、一緒に考えていけたらと思います。' 
        }]
      }
    ];

    const updateResult = await client
      .patch(articleConfig.articleId)
      .set({ body: updatedBody })
      .commit();

    console.log('✅ AI独創性記事更新完了:', updateResult._id);
    return updateResult;
  } catch (error) {
    console.error('❌ 記事更新エラー:', error.message);
    throw error;
  }
}

async function integrateAICreativityImages() {
  try {
    console.log('🚀 AI独創性記事画像統合開始...');
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
    await createAICreativityArticleWithImages(uploadedImages);

    console.log('🎉 AI独創性記事画像統合完了!');
    console.log(`🌐 記事URL: https://hiro-logue.vercel.app/blog/${articleConfig.slug}`);

  } catch (error) {
    console.error('❌ AI独創性記事画像統合エラー:', error.message);
    process.exit(1);
  }
}

// 実行
integrateAICreativityImages();