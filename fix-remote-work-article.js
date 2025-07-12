const { createClient } = require('@sanity/client')
const fs = require('fs')
require('dotenv').config({ path: '.env.local' })

// Sanity client setup
const client = createClient({
  projectId: '9dzq8f77',
  dataset: 'production',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2023-05-03'
})

// Article configuration
const articleConfig = {
  articleId: 'VYus6nyHpjKB0SEJ064pu2', // 正しいDocument ID
  slug: 'remote-work-family-benefits',
  title: 'リモートワークの意外な恩恵〜家族との時間が教えてくれた新しい働き方',
  images: {
    hero: {
      path: '/Users/gotohiro/Documents/user/Products/ContentFlow/sanity-edition/public/images/blog/auto-generated/article-20250712-185045/header-20250712_121205.png',
      alt: 'リモートワークの新しい働き方を表現する明るいホームオフィス空間',
      filename: 'header-20250712_121205.png'
    },
    section1: {
      path: '/Users/gotohiro/Documents/user/Products/ContentFlow/sanity-edition/public/images/blog/auto-generated/article-20250712-185045/section1-20250712_122357.png',
      alt: 'リモートワーク環境の技術的セットアップを表現する机上のクローズアップ',
      filename: 'section1-20250712_122357.png'
    },
    section2: {
      path: '/Users/gotohiro/Documents/user/Products/ContentFlow/sanity-edition/public/images/blog/auto-generated/article-20250712-185045/section2-20250712_123541.png',
      alt: '通勤時間の節約が生み出す時間の豊かさを抽象的に表現',
      filename: 'section2-20250712_123541.png'
    },
    section3: {
      path: '/Users/gotohiro/Documents/user/Products/ContentFlow/sanity-edition/public/images/blog/auto-generated/article-20250712-185045/section3-improved-20250712_125319.png',
      alt: 'リモートでのデジタル技術統合と情報フローを俯瞰視点で表現',
      filename: 'section3-improved-20250712_125319.png'
    }
  }
}

async function uploadImage(imageConfig) {
  try {
    console.log(`📤 画像アップロード中: ${imageConfig.filename}...`)
    
    if (!fs.existsSync(imageConfig.path)) {
      throw new Error(`画像ファイルが見つかりません: ${imageConfig.path}`)
    }
    
    const imageBuffer = fs.readFileSync(imageConfig.path)
    const imageAsset = await client.assets.upload('image', imageBuffer, {
      filename: imageConfig.filename
    })
    
    console.log(`✅ 画像アップロード成功: ${imageAsset._id}`)
    return imageAsset
    
  } catch (error) {
    console.error(`❌ 画像アップロードエラー (${imageConfig.filename}): ${error.message}`)
    throw error
  }
}

function createCompletePortableText(imageAssets) {
  // 完全なPortable Text構造を作成（画像を適切な位置に配置）
  return [
    // はじめに
    {
      _type: 'block',
      _key: 'heading-intro',
      style: 'h2',
      children: [{ _type: 'span', text: 'はじめに', marks: [] }]
    },
    {
      _type: 'block',
      _key: 'intro-p1',
      style: 'normal',
      children: [{ _type: 'span', text: '今回は「リモートワークのすすめ」について書いていきます。', marks: [] }]
    },
    {
      _type: 'block',
      _key: 'intro-p2',
      style: 'normal',
      children: [{ _type: 'span', text: '実はですね、私がリモートワークを本格的に始めたのは3年ほど前のことでした。当初は「家だと集中できないんじゃないか」「コミュニケーションがうまくいくのか」と心配していたんですね。でも実際にやってみると、想像していた以上にメリットが多くて、特に家族との関係性に大きな変化があったんです。', marks: [] }]
    },
    {
      _type: 'block',
      _key: 'intro-p3',
      style: 'normal',
      children: [{ _type: 'span', text: '皆さんもリモートワークについて、「本当に効率的なのかな？」「チームワークは大丈夫なのかな？」といった疑問をお持ちかもしれませんね。今回は、実際にリモートワークを3年間続けてきた私の体験から、技術者視点での具体的なメリットと、家族との時間が増えたことで見えてきた新しい働き方の可能性について、率直に書いてみたいと思います。', marks: [] }]
    },

    // セクション1: 環境構築から始まった新しい日常
    {
      _type: 'block',
      _key: 'section1-heading',
      style: 'h2',
      children: [{ _type: 'span', text: '環境構築から始まった新しい日常', marks: [] }]
    },
    {
      _type: 'image',
      _key: 'section1-image',
      asset: { _type: 'reference', _ref: imageAssets.section1._id },
      alt: articleConfig.images.section1.alt,
      caption: 'リモートワーク環境の技術的セットアップ'
    },
    {
      _type: 'block',
      _key: 'section1-p1',
      style: 'normal',
      children: [{ _type: 'span', text: 'リモートワーク開始当初、一番悩んだのは作業環境の構築でした。自宅の一角を仕事場にするために、机やモニター、照明などを整えていたのですが、これが思いの外、家族にとっても興味深い出来事だったようなんですね。', marks: [] }]
    },
    {
      _type: 'block',
      _key: 'section1-p2',
      style: 'normal',
      children: [{ _type: 'span', text: '特に中学生の子どもが「お父さん、なんで家で会社の仕事ができるの？」と質問してきたときは、プログラミングやクラウドサービスについて説明する良い機会になりました。GitHubでコードを管理していることや、SlackやZoomでチームメンバーとやり取りしていることを話すと、「未来みたい！」と目を輝かせていたのが印象的でした。', marks: [] }]
    },
    {
      _type: 'block',
      _key: 'section1-p3',
      style: 'normal',
      children: [{ _type: 'span', text: '妻も最初は「本当に家で集中できるの？」と心配していましたが、実際に仕事をしている様子を見て、「思っていたより静かに集中してるのね」と安心してくれました。保護犬ちゃんと保護猫ちゃんも、最初は私の存在に戸惑っていましたが、今では仕事中にそっと近くで寝ているような、穏やかな関係性ができています。', marks: [] }]
    },
    {
      _type: 'block',
      _key: 'section1-p4',
      style: 'normal',
      children: [{ _type: 'span', text: '環境面での工夫としては、ノイズキャンセリングヘッドホンの導入や、Web会議用の背景設定なども重要でした。これらの技術的な準備が整うと、オフィスにいる時と変わらない集中力で作業ができるようになったんです。', marks: [] }]
    },

    // セクション2: 通勤時間がもたらした時間の豊かさ
    {
      _type: 'block',
      _key: 'section2-heading',
      style: 'h2',
      children: [{ _type: 'span', text: '通勤時間がもたらした時間の豊かさ', marks: [] }]
    },
    {
      _type: 'image',
      _key: 'section2-image',
      asset: { _type: 'reference', _ref: imageAssets.section2._id },
      alt: articleConfig.images.section2.alt,
      caption: '通勤時間の節約が生み出す時間の豊かさ'
    },
    {
      _type: 'block',
      _key: 'section2-p1',
      style: 'normal',
      children: [{ _type: 'span', text: 'リモートワークで一番実感したメリットは、やはり通勤時間がなくなったことですね。私の場合、往復で約2時間の通勤時間があったので、その時間がそのまま自分の時間になったんです。', marks: [] }]
    },
    {
      _type: 'block',
      _key: 'section2-p2',
      style: 'normal',
      children: [{ _type: 'span', text: '朝の時間に余裕ができたことで、家族との朝食時間が格段に充実しました。以前は慌ただしく家を出ていたのが、今はゆっくりと中学生の子どもと今日の予定について話したり、妻と一日のスケジュールを確認したりできるようになりました。「お父さんが朝にいるって、なんか安心する」と子どもに言われたときは、改めてリモートワークの価値を感じましたね。', marks: [] }]
    },
    {
      _type: 'block',
      _key: 'section2-p3',
      style: 'normal',
      children: [{ _type: 'span', text: '夕方も同様で、定時で仕事を終えたらすぐに家族と過ごせるため、子どもの宿題を見てあげたり、一緒にご飯の準備をしたりする機会が増えました。以前は帰宅時間が遅くて、平日は子どもが寝た後に帰ることも多かったのですが、今では平日でも十分に家族との時間を確保できています。', marks: [] }]
    },
    {
      _type: 'block',
      _key: 'section2-p4',
      style: 'normal',
      children: [{ _type: 'span', text: '技術的な面でも、通勤に使っていた2時間を自己学習に充てることができるようになりました。新しいプログラミング言語の習得や、最新の開発ツールの検証など、以前はなかなか時間が取れなかった分野にも取り組めるようになったんです。この継続的な学習が、結果的に仕事の質の向上にもつながっているような気がします。', marks: [] }]
    },
    {
      _type: 'block',
      _key: 'section2-p5',
      style: 'normal',
      children: [{ _type: 'span', text: '皆さんも通勤時間について、「もしその時間が自由に使えたら何をしたいか」考えてみたことはありませんか？', marks: [] }]
    },

    // セクション3: チームワークと個人の成長の両立
    {
      _type: 'block',
      _key: 'section3-heading',
      style: 'h2',
      children: [{ _type: 'span', text: 'チームワークと個人の成長の両立', marks: [] }]
    },
    {
      _type: 'image',
      _key: 'section3-image',
      asset: { _type: 'reference', _ref: imageAssets.section3._id },
      alt: articleConfig.images.section3.alt,
      caption: 'リモートでのデジタル技術統合と効率的なコミュニケーション'
    },
    {
      _type: 'block',
      _key: 'section3-p1',
      style: 'normal',
      children: [{ _type: 'span', text: 'リモートワークで心配だったのは、チームとのコミュニケーションでした。でも実際にやってみると、むしろ以前より効率的になった面もあるんですね。', marks: [] }]
    },
    {
      _type: 'block',
      _key: 'section3-p2',
      style: 'normal',
      children: [{ _type: 'span', text: 'SlackやMicrosoft Teamsを使った非同期コミュニケーションに慣れると、お互いの集中時間を尊重しながら、必要な情報共有ができるようになりました。以前のオフィスでは、ちょっとした質問でも相手の作業を中断してしまうことが気になっていたのですが、リモートワークでは相手のペースに合わせて返信してもらえるので、かえって気遣いが減ったような気がします。', marks: [] }]
    },
    {
      _type: 'block',
      _key: 'section3-p3',
      style: 'normal',
      children: [{ _type: 'span', text: 'Web会議についても、最初は画面越しでの議論に違和感がありましたが、画面共有機能を使ったコードレビューや、オンラインホワイトボードを活用したアイデア出しなど、むしろ対面より効率的な場面も多いことに気づきました。', marks: [] }]
    },
    {
      _type: 'block',
      _key: 'section3-p4',
      style: 'normal',
      children: [{ _type: 'span', text: '家族の理解も大きな支えになっています。Web会議中は静かにしてもらう必要があるのですが、家族みんなが協力してくれるおかげで、集中して参加できています。妻は「お父さんの仕事の様子が見えるから、どんな風に働いているのかがわかって面白い」と言ってくれます。', marks: [] }]
    },
    {
      _type: 'block',
      _key: 'section3-p5',
      style: 'normal',
      children: [{ _type: 'span', text: '個人的な成長という面では、自己管理能力が格段に向上したと思います。オフィスにいると、周りの人の動きに合わせて行動することが多かったのですが、リモートワークでは自分でスケジュールを組み、集中すべき時間と休憩時間を意識的に分ける必要があります。この自律性が、仕事以外の面でも良い影響を与えているのかなと思います。', marks: [] }]
    },
    {
      _type: 'block',
      _key: 'section3-p6',
      style: 'normal',
      children: [{ _type: 'span', text: '技術者として、どのような環境でも成果を出せるスキルが身についたことも大きな収穫です。オフィスという特定の環境に依存せず、どこでも質の高い開発ができるようになったことで、より柔軟な働き方の選択肢が広がりました。', marks: [] }]
    },

    // おわりに
    {
      _type: 'block',
      _key: 'conclusion-heading',
      style: 'h2',
      children: [{ _type: 'span', text: 'おわりに', marks: [] }]
    },
    {
      _type: 'block',
      _key: 'conclusion-p1',
      style: 'normal',
      children: [{ _type: 'span', text: '今回は「リモートワークのすすめ」について、私の3年間の体験を通じて書きました。', marks: [] }]
    },
    {
      _type: 'block',
      _key: 'conclusion-p2',
      style: 'normal',
      children: [{ _type: 'span', text: '当初抱いていた不安は確かにありましたが、実際にやってみると家族との時間の質が向上し、仕事の効率性も維持できることがわかりました。特に、通勤時間の有効活用や、家族との関係性の深まりは、予想していた以上の恩恵でした。', marks: [] }]
    },
    {
      _type: 'block',
      _key: 'conclusion-p3',
      style: 'normal',
      children: [{ _type: 'span', text: 'もちろん、リモートワークが全ての人や職種に適しているとは限りませんし、オフィスでの対面でのコミュニケーションには独特の価値があることも理解しています。でも、技術の進歩によって、私たちの働き方の選択肢は確実に広がってきているなと感じています。', marks: [] }]
    },
    {
      _type: 'block',
      _key: 'conclusion-p4',
      style: 'normal',
      children: [{ _type: 'span', text: '皆さんのお仕事では、リモートワークの可能性はいかがでしょうか？もし機会があれば、一度試してみることで新しい発見があるかもしれません。また、現在リモートワークをされている方がいらっしゃいましたら、どのような工夫や発見があったか、ぜひコメントで教えてください。お互いの経験を共有することで、より良い働き方を見つけていけるといいですね。', marks: [] }]
    },
    {
      _type: 'block',
      _key: 'conclusion-p5',
      style: 'normal',
      children: [{ _type: 'span', text: '今日も最後まで読んでいただき、ありがとうございました。', marks: [] }]
    }
  ]
}

async function fixRemoteWorkArticle() {
  try {
    console.log('🚀 リモートワーク記事修正開始')
    console.log('=' * 50)
    
    // 環境変数チェック
    if (!process.env.SANITY_API_TOKEN) {
      throw new Error('SANITY_API_TOKEN環境変数が設定されていません')
    }
    
    console.log(`📰 記事: ${articleConfig.title}`)
    console.log(`🆔 Document ID: ${articleConfig.articleId}`)
    console.log(`🔗 スラッグ: ${articleConfig.slug}`)
    
    // 全画像のアップロード（既存画像IDを再利用する場合は省略可能）
    const imageAssets = {}
    for (const [position, imageConfig] of Object.entries(articleConfig.images)) {
      console.log(`📤 画像処理中: ${position}`)
      imageAssets[position] = await uploadImage(imageConfig)
    }
    
    console.log(`✅ 全画像アップロード完了: ${Object.keys(imageAssets).length}枚`)
    
    // 完全なPortable Text構造を作成
    const completeBody = createCompletePortableText(imageAssets)
    
    // 記事を完全な内容で更新
    const result = await client
      .patch(articleConfig.articleId)
      .set({
        body: completeBody,
        mainImage: {
          _type: 'image',
          asset: { _type: 'reference', _ref: imageAssets.hero._id },
          alt: articleConfig.images.hero.alt
        }
      })
      .commit()
    
    console.log('🎉 記事修正完了!')
    console.log(`🌐 記事URL: https://hiro-logue.vercel.app/blog/${articleConfig.slug}`)
    console.log(`📊 修正内容:`)
    console.log(`   ✅ ヒーロー画像重複問題解決`)
    console.log(`   ✅ 全セクション内容復元完了`)
    console.log(`   ✅ おわりに内容復元完了`)
    console.log(`   ✅ 4枚画像適切配置完了`)
    
    return {
      success: true,
      articleId: articleConfig.articleId,
      imageCount: Object.keys(imageAssets).length,
      url: `https://hiro-logue.vercel.app/blog/${articleConfig.slug}`,
      fixes: [
        'ヒーロー画像重複除去',
        '環境構築から始まった新しい日常セクション完全復元',
        '通勤時間がもたらした時間の豊かさセクション完全復元', 
        'チームワークと個人の成長の両立セクション完全復元',
        'おわりにセクション完全復元'
      ]
    }
    
  } catch (error) {
    console.error('❌ 記事修正失敗:', error.message)
    return { success: false, error: error.message }
  }
}

// スクリプト実行
if (require.main === module) {
  fixRemoteWorkArticle()
    .then(result => {
      if (result.success) {
        console.log(`\n🎉 修正成功: ${result.imageCount}枚の画像で記事構造を完全修正`)
        console.log(`🔗 URL: ${result.url}`)
        console.log('📋 修正項目:')
        result.fixes.forEach(fix => console.log(`   ✅ ${fix}`))
      } else {
        console.error(`\n❌ 修正失敗: ${result.error}`)
        process.exit(1)
      }
    })
    .catch(error => {
      console.error('予期しないエラー:', error)
      process.exit(1)
    })
}

module.exports = { fixRemoteWorkArticle }