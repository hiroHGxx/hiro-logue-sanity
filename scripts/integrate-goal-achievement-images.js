const { createClient } = require('@sanity/client');
const fs = require('fs');
const path = require('path');

// 環境変数読み込み
require('dotenv').config({ path: '.env.local' });

// Sanity クライアント設定
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-03-15'
});

const TARGET_DOCUMENT_ID = '2xyqq5bRAlaQ1ZafpZUygt'; // goal-achievement-three-essentials
const IMAGE_DIR = 'public/images/blog/auto-generated/article-250731-063153';

async function uploadImageToSanity(imagePath, position, description) {
  try {
    console.log(`📤 ${position}画像アップロード開始: ${path.basename(imagePath)}`);
    
    const imageBuffer = fs.readFileSync(imagePath);
    const asset = await client.assets.upload('image', imageBuffer, {
      filename: path.basename(imagePath)
    });
    
    console.log(`✅ ${position}画像アップロード完了: ${asset._id}`);
    return {
      _type: 'image',
      asset: {
        _type: 'reference',
        _ref: asset._id
      },
      alt: description,
      caption: description
    };
  } catch (error) {
    console.error(`❌ ${position}画像アップロードエラー:`, error);
    throw error;
  }
}

async function integrateImages() {
  console.log('🚀 目標達成記事への画像統合開始');
  console.log(`📄 対象ドキュメントID: ${TARGET_DOCUMENT_ID}`);
  console.log(`📁 画像ディレクトリ: ${IMAGE_DIR}`);

  try {
    // 現在の記事取得
    const currentPost = await client.getDocument(TARGET_DOCUMENT_ID);
    console.log(`📰 記事タイトル: ${currentPost.title}`);

    // 4枚の画像をアップロード
    const headerImage = await uploadImageToSanity(
      path.join(IMAGE_DIR, 'header-20250731_063515.png'),
      'header',
      '目標達成のための静かで集中できる環境を表現した画像'
    );

    const section1Image = await uploadImageToSanity(
      path.join(IMAGE_DIR, 'section1-20250731_073129.png'),
      'section1',
      '目的と方向性を見つけることのメタファーを表現した画像'
    );

    const section2Image = await uploadImageToSanity(
      path.join(IMAGE_DIR, 'section2-20250731_073547.png'),
      'section2',
      '継続的な小さな進歩のビジュアル表現'
    );

    const section3Image = await uploadImageToSanity(
      path.join(IMAGE_DIR, 'section3-20250731_073956.png'),
      'section3',
      'ネットワークとサポートシステムの概念を表現した画像'
    );

    // 記事の本文にBody画像として統合
    const updatedBody = [
      {
        _type: 'block',
        _key: 'intro-block',
        style: 'h2',
        children: [{ _type: 'span', text: 'はじめに' }]
      },
      {
        _type: 'block',
        _key: 'intro-content',
        style: 'normal',
        children: [
          {
            _type: 'span',
            text: '今回は「目標達成に必要な３つのこと」について書いていきます。\n\n実はですね、年明けから子どもの受験勉強を見ていて、改めて「継続すること」の大切さを感じたんです。中学生の息子が「英単語覚えるのが続かない」と相談してきた時に、妻と一緒に話し合ったのがきっかけでした。\n\nプログラマーとして長年仕事をしてきて、また3人の子どもを育てる中で気づいたことがあります。目標を達成する人とそうでない人の違いって、実は能力の差よりも「やり方」の差なのかもしれません。\n\n皆さんも、新年に立てた目標がいつの間にか忘れ去られてしまった経験はありませんか？'
          }
        ]
      },
      headerImage,
      {
        _type: 'block',
        _key: 'section1-title',
        style: 'h2',
        children: [{ _type: 'span', text: '目標達成の第一歩：「見える化」の力' }]
      },
      {
        _type: 'block',
        _key: 'section1-content',
        style: 'normal',
        children: [
          {
            _type: 'span',
            text: '最初にお話ししたいのは、目標を「見える化」することの重要性です。\n\n息子の勉強を見ていて気づいたのですが、「英単語を覚える」という目標があっても、どこまでやったかが分からないと続かないんですね。そこで、妻のアイデアで壁に大きなカレンダーを貼って、英単語を覚えた日にシールを貼ることにしました。\n\nこれが想像以上に効果的だったんです。息子も「今日もシール貼れた」と嬉しそうにしていて、1ヶ月経った頃には習慣として定着していました。\n\n私自身も、新しいプログラミング技術を学ぶ時に似たような方法を使っています。GitHubのコミット履歴を緑にすることを目標にして、毎日少しずつでもコードを書くようにしているんです。視覚的に進捗が分かると、モチベーションが維持しやすいなと感じています。\n\n皆さんは、目標の進捗をどのように管理していらっしゃいますか？'
          }
        ]
      },
      section1Image,
      {
        _type: 'block',
        _key: 'section2-title',
        style: 'h2',
        children: [{ _type: 'span', text: '継続のコツ：「小さな習慣」から始める' }]
      },
      {
        _type: 'block',
        _key: 'section2-content',
        style: 'normal',
        children: [
          {
            _type: 'span',
            text: '二つ目のポイントは、「小さな習慣」から始めることです。\n\n以前、健康のためにジョギングを始めようと思ったことがあります。最初は張り切って「毎日5km走る」という目標を立てたのですが、3日で挫折してしまいました。その時に妻から「最初は玄関まで行くだけでもいいんじゃない？」と言われて、はっとしたんです。\n\nそれから、まずは「運動靴を履いて玄関に立つ」ことから始めました。慣れてきたら「家の周りを1周歩く」、その次は「軽くジョギング」という風に、少しずつハードルを上げていったんです。結果的に、半年後には週3回のペースで走れるようになりました。\n\nプログラミングでも同じことが言えるなと思います。新しいフレームワークを学ぶ時も、いきなり大きなアプリケーションを作ろうとするのではなく、まずは「Hello World」から始めて、少しずつ機能を追加していく方が確実ですよね。\n\n保護犬ちゃんも、最初は人に慣れるまで時間がかかりましたが、毎日少しずつ距離を縮めることで、今では家族の一員として過ごしています。小さな積み重ねの力を改めて感じました。'
          }
        ]
      },
      section2Image,
      {
        _type: 'block',
        _key: 'section3-title',
        style: 'h2',
        children: [{ _type: 'span', text: '挫折を防ぐ：「仲間」の存在' }]
      },
      {
        _type: 'block',
        _key: 'section3-content',
        style: 'normal',
        children: [
          {
            _type: 'span',
            text: '三つ目のポイントは、「仲間」の存在です。\n\n一人で目標に向かっていると、どうしても孤独感を感じることがありますよね。私の場合、プログラミングの勉強を続けられているのは、オンラインコミュニティや勉強会で出会った仲間たちのおかげなのかなと思います。\n\n家族の支えも大きいです。新しい技術を学んでいる時に、妻が「今日も勉強頑張ってるね」と声をかけてくれたり、子どもたちが「お父さん、何作ってるの？」と興味を示してくれたりすると、続ける励みになります。\n\n息子の英単語学習も、家族みんなで応援することで継続できているんです。保護猫ちゃんまで、息子が勉強している時は隣に座って見守ってくれています。ペットの存在も、意外と大きな支えになっているのかもしれませんね。\n\n仲間がいることで、「一人じゃない」という安心感を得られますし、お互いに励まし合うことで、困難な時期も乗り越えやすくなる気がします。\n\n皆さんには、目標を一緒に頑張れる仲間はいらっしゃいますか？'
          }
        ]
      },
      section3Image,
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
        children: [
          {
            _type: 'span',
            text: '今回は「目標達成に必要な３つのこと」について書きました。\n\n「見える化」「小さな習慣」「仲間の存在」という３つのポイントをお話ししましたが、どれも特別なことではありません。でも、この当たり前のことを続けることが、実は一番難しくて、一番大切なことなのかなと思います。\n\n私自身、まだまだ完璧ではありませんが、家族や仲間たちに支えられながら、少しずつでも前に進んでいければと思っています。目標達成は、決してゴールではなく、日々の積み重ねの結果なのかもしれませんね。\n\n皆さんも、もしよろしければ、どのような目標に向かって頑張っていらっしゃるか、コメントで教えてください。お互いに励まし合いながら、一歩ずつ前進していけたらと思います。'
          }
        ]
      }
    ];

    // 記事更新
    await client
      .patch(TARGET_DOCUMENT_ID)
      .set({
        body: updatedBody,
        headerImage: headerImage,
        section1Image: section1Image,
        section2Image: section2Image,
        section3Image: section3Image
      })
      .commit();

    console.log('✅ 記事更新完了');
    console.log(`🌐 公開URL: https://hiro-logue.vercel.app/blog/goal-achievement-three-essentials`);
    
  } catch (error) {
    console.error('❌ 統合エラー:', error);
    throw error;
  }
}

// 実行
integrateImages();