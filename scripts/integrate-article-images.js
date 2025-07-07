const { createClient } = require('@sanity/client')
const fs = require('fs')

// Sanity client setup
const client = createClient({
  projectId: '9dzq8f77',
  dataset: 'production',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2023-05-03'
})

// Article and image mapping
const articleConfig = {
  articleId: 'B23yufD62yhoU0aT5pzb2s',
  slug: 'ai-yohaku-balance',
  images: {
    hero: {
      path: '/Users/gotohiro/Documents/user/Products/ContentFlow/sanity-edition/public/images/blog/ai-articles/ai-balance-hero-001-a.png',
      alt: 'AI技術と平和な生活のバランスを表現したミニマルなイラスト - デジタルウェルネスの概念',
      filename: 'ai-balance-hero-001-a.png'
    },
    section1: {
      path: '/Users/gotohiro/Documents/user/Products/ContentFlow/sanity-edition/public/images/blog/ai-articles/ai-efficiency-trap-001-a.png',
      alt: 'デジタル通知に圧倒される現代人と穏やかな家庭環境の対比 - AI効率化の落とし穴',
      filename: 'ai-efficiency-trap-001-a.png'
    },
    section2: {
      path: '/Users/gotohiro/Documents/user/Products/ContentFlow/sanity-edition/public/images/blog/ai-articles/family-mindful-time-001-a.png',
      alt: '父親と子どもたちが空を見上げる平和な家族の時間 - 本当の余白の価値',
      filename: 'family-mindful-time-001-a.png'
    },
    section3: {
      path: '/Users/gotohiro/Documents/user/Products/ContentFlow/sanity-edition/public/images/blog/ai-articles/balanced-lifestyle-001-a.png',
      alt: 'デジタル効率性とアナログなマインドフルネスの調和 - バランスの取れたライフスタイル',
      filename: 'balanced-lifestyle-001-a.png'
    }
  }
}

async function uploadImage(imageConfig) {
  try {
    console.log(`Uploading ${imageConfig.filename}...`)
    
    const imageBuffer = fs.readFileSync(imageConfig.path)
    const imageAsset = await client.assets.upload('image', imageBuffer, {
      filename: imageConfig.filename
    })
    
    console.log(`✅ Image uploaded: ${imageAsset._id}`)
    return imageAsset
  } catch (error) {
    console.error(`❌ Error uploading ${imageConfig.filename}:`, error)
    return null
  }
}

async function createStructuredContent(imageAssets) {
  const content = [
    // 導入部分
    {
      _type: 'block',
      _key: 'intro1',
      style: 'normal',
      children: [
        {
          _type: 'span',
          text: '今回は「AI活用と余白の作り方」というテーマで書いていきます。'
        }
      ]
    },
    {
      _type: 'block',
      _key: 'intro2', 
      style: 'normal',
      children: [
        {
          _type: 'span',
          text: '実は先日、妻から「最近、なんだかいつも忙しそうだね」と言われたんです。確かに、AIツールを使って効率化しているはずなのに、なぜか時間に追われている感覚がありました。'
        }
      ]
    },
    {
      _type: 'block',
      _key: 'intro3',
      style: 'normal', 
      children: [
        {
          _type: 'span',
          text: '考えてみると、これって現代の多くの人が直面している問題なのかなと思います。技術で効率化しても、なぜか余裕が生まれない。むしろ、やることが増えて忙しくなってしまう。'
        }
      ]
    },
    {
      _type: 'block',
      _key: 'intro4',
      style: 'normal',
      children: [
        {
          _type: 'span', 
          text: 'そんな中で気づいた「AI活用と余白の作り方」について、今回はお話していきたいと思います。'
        }
      ]
    },

    // セクション1: AI効率化の落とし穴
    {
      _type: 'block',
      _key: 'section1-title',
      style: 'h2',
      children: [
        {
          _type: 'span',
          text: 'AI効率化の落とし穴'
        }
      ]
    },
    
    // セクション1画像
    ...(imageAssets.section1 ? [{
      _type: 'image',
      _key: 'section1-image',
      asset: {
        _type: 'reference',
        _ref: imageAssets.section1._id
      },
      alt: articleConfig.images.section1.alt
    }] : []),

    {
      _type: 'block',
      _key: 'section1-content1',
      style: 'normal',
      children: [
        {
          _type: 'span',
          text: 'ということで本題なんですけれども、AIツールを導入して3ヶ月ほど経った我が家の状況から。'
        }
      ]
    },
    {
      _type: 'block',
      _key: 'section1-content2',
      style: 'normal',
      children: [
        {
          _type: 'span',
          text: '最初はChatGPTで記事の下書きを作ったり、Copilotでコーディングを効率化したりして、「これで時間ができる！」と思っていました。でも、なんというか、実際には違ったんですね。'
        }
      ]
    },
    {
      _type: 'block',
      _key: 'section1-content3',
      style: 'normal',
      children: [
        {
          _type: 'span',
          text: '確かに個々の作業は早くなりました。記事を書く時間は半分になったし、プログラミングも明らかに速くなった。でも、気がつくと以前より多くのプロジェクトを抱えて、結果的に忙しくなっていたんです。'
        }
      ]
    },
    {
      _type: 'block',
      _key: 'section1-content4',
      style: 'normal',
      children: [
        {
          _type: 'span',
          text: '皆さんも似たような経験はありませんか？効率化ツールを使っているのに、なぜか余裕がない。そんな感覚をお持ちの方も多いのではないでしょうか。'
        }
      ]
    },

    // セクション2: 本当の余白とは何か
    {
      _type: 'block',
      _key: 'section2-title',
      style: 'h2',
      children: [
        {
          _type: 'span',
          text: '本当の余白とは何か'
        }
      ]
    },

    // セクション2画像
    ...(imageAssets.section2 ? [{
      _type: 'image',
      _key: 'section2-image',
      asset: {
        _type: 'reference',
        _ref: imageAssets.section2._id
      },
      alt: articleConfig.images.section2.alt
    }] : []),

    {
      _type: 'block',
      _key: 'section2-content1',
      style: 'normal',
      children: [
        {
          _type: 'span',
          text: '子どもたちを見ていて気づいたことがあります。息子は宿題をAIに聞いて素早く終わらせるんですが、その後必ず「何もしない時間」を作るんです。ぼーっとベランダで空を見たり、ペットの猫と遊んだり。'
        }
      ]
    },
    {
      _type: 'block',
      _key: 'section2-content2',
      style: 'normal',
      children: [
        {
          _type: 'span',
          text: '「時間があるなら他の勉強もできるよ」と言うと、「でも、考える時間も必要だよ」って返されました。さすがだなと思いました。'
        }
      ]
    },
    {
      _type: 'block',
      _key: 'section2-content3',
      style: 'normal',
      children: [
        {
          _type: 'span',
          text: '実はこれが、私たち大人が見落としがちな「余白」の本質なのかもしれません。余白って、単に空いた時間のことではなくて、何かを考えたり、感じたりするための「間」なんですね。'
        }
      ]
    },
    {
      _type: 'block',
      _key: 'section2-content4',
      style: 'normal',
      children: [
        {
          _type: 'span',
          text: 'AIで効率化して生まれた時間を、また別のタスクで埋めてしまっては、本当の意味での余白は生まれない。これが私たちの陥りがちな罠だったんです。'
        }
      ]
    },

    // セクション3: 実践方法
    {
      _type: 'block',
      _key: 'section3-title',
      style: 'h2',
      children: [
        {
          _type: 'span',
          text: '我が家で試した3つの方法'
        }
      ]
    },

    // セクション3画像
    ...(imageAssets.section3 ? [{
      _type: 'image',
      _key: 'section3-image',
      asset: {
        _type: 'reference',
        _ref: imageAssets.section3._id
      },
      alt: articleConfig.images.section3.alt
    }] : []),

    {
      _type: 'block',
      _key: 'section3-content1',
      style: 'normal',
      children: [
        {
          _type: 'span',
          text: 'そこで、我が家で実践している「AI活用しながら余白を作る」方法を3つご紹介します。'
        }
      ]
    },

    // 方法1
    {
      _type: 'block',
      _key: 'method1-title',
      style: 'h3',
      children: [
        {
          _type: 'span',
          text: '1. 意図的な非効率の時間'
        }
      ]
    },
    {
      _type: 'block',
      _key: 'method1-content1',
      style: 'normal',
      children: [
        {
          _type: 'span',
          text: '週に1度、あえてAIを使わない時間を作ります。手書きでメモを取ったり、調べ物も本で探したり。一見非効率ですが、この時間が思考の幅を広げてくれるんです。'
        }
      ]
    },
    {
      _type: 'block',
      _key: 'method1-content2',
      style: 'normal',
      children: [
        {
          _type: 'span',
          text: '妻と一緒に料理をする時も、レシピアプリは使わず、冷蔵庫の中身を見ながら「今日は何作ろうか」と話し合う。こういう時間って、実はとても豊かなんですよね。'
        }
      ]
    },

    // 方法2
    {
      _type: 'block',
      _key: 'method2-title',
      style: 'h3',
      children: [
        {
          _type: 'span',
          text: '2. AIとの対話時間'
        }
      ]
    },
    {
      _type: 'block',
      _key: 'method2-content1',
      style: 'normal',
      children: [
        {
          _type: 'span',
          text: 'ChatGPTを単なる作業ツールとしてではなく、思考のパートナーとして使う時間を作りました。「今日感じたこと」や「最近考えていること」を相談してみるんです。'
        }
      ]
    },
    {
      _type: 'block',
      _key: 'method2-content2',
      style: 'normal',
      children: [
        {
          _type: 'span',
          text: 'すると、自分でも気づかなかった考えが整理されたり、新しい視点が見つかったりします。効率化のためのAIではなく、内省のためのAI。これも一つの余白の作り方だと思います。'
        }
      ]
    },

    // 方法3
    {
      _type: 'block',
      _key: 'method3-title',
      style: 'h3',
      children: [
        {
          _type: 'span',
          text: '3. 家族のデジタルデトックス時間'
        }
      ]
    },
    {
      _type: 'block',
      _key: 'method3-content1',
      style: 'normal',
      children: [
        {
          _type: 'span',
          text: '夕食後の1時間は、家族全員がデジタル機器を使わない時間にしています。最初は子どもたちも「つまらない」と言っていましたが、今では貴重な会話の時間になっています。'
        }
      ]
    },
    {
      _type: 'block',
      _key: 'method3-content2',
      style: 'normal',
      children: [
        {
          _type: 'span',
          text: 'ペットの猫も、なぜかこの時間になると家族の近くに寄ってきます。動物って、人間の「余白」を敏感に感じ取るのかもしれませんね。'
        }
      ]
    },

    // まとめセクション
    {
      _type: 'block',
      _key: 'conclusion-title',
      style: 'h2',
      children: [
        {
          _type: 'span',
          text: '改めて感じた余白の価値'
        }
      ]
    },
    {
      _type: 'block',
      _key: 'conclusion-content1',
      style: 'normal',
      children: [
        {
          _type: 'span',
          text: 'こうした実践を通して、改めて余白の価値を感じました。'
        }
      ]
    },
    {
      _type: 'block',
      _key: 'conclusion-content2',
      style: 'normal',
      children: [
        {
          _type: 'span',
          text: '余白があることで、日々の出来事をゆっくり振り返ることができる。家族との何気ない会話から、新しい発見があったりする。そして何より、「今この瞬間」を味わうことができるんです。'
        }
      ]
    },
    {
      _type: 'block',
      _key: 'conclusion-content3',
      style: 'normal',
      children: [
        {
          _type: 'span',
          text: 'AIは確かに素晴らしいツールです。でも、それによって生まれた時間をどう使うかは、私たち次第。技術と人間らしさのバランスを取ることが、本当の豊かさにつながるのかなと思います。'
        }
      ]
    },

    // おわりに
    {
      _type: 'block',
      _key: 'outro-title',
      style: 'h2',
      children: [
        {
          _type: 'span',
          text: 'おわりに'
        }
      ]
    },
    {
      _type: 'block',
      _key: 'outro-content1',
      style: 'normal',
      children: [
        {
          _type: 'span',
          text: '今回は「AI活用と余白の作り方」というテーマで書きました。'
        }
      ]
    },
    {
      _type: 'block',
      _key: 'outro-content2',
      style: 'normal',
      children: [
        {
          _type: 'span',
          text: '効率化は大切ですが、それ以上に大切なのは、生まれた時間をどう過ごすか。意図的に余白を作ることで、毎日がより豊かになるような気がします。'
        }
      ]
    },
    {
      _type: 'block',
      _key: 'outro-content3',
      style: 'normal',
      children: [
        {
          _type: 'span',
          text: '皆さんも、AIを活用しながら余白を作る方法を、何か実践されていますか？もしよろしければ、コメントで教えてください。'
        }
      ]
    },
    {
      _type: 'block',
      _key: 'outro-content4',
      style: 'normal',
      children: [
        {
          _type: 'span',
          text: '40代になって、改めて「間」の大切さを実感している今日この頃です。技術を使いこなしながらも、人間らしい時間を大切にしていきたいですね。'
        }
      ]
    }
  ]

  return content
}

async function integrateArticleImages() {
  try {
    console.log('Starting article image integration...')

    // Check if all images exist
    const missingImages = []
    Object.entries(articleConfig.images).forEach(([key, config]) => {
      if (!fs.existsSync(config.path)) {
        missingImages.push(`${key}: ${config.path}`)
      }
    })

    if (missingImages.length > 0) {
      console.log('❌ Missing images:')
      missingImages.forEach(img => console.log(`  ${img}`))
      return
    }

    console.log('✅ All images found, starting upload...')

    // Upload all images
    const imageAssets = {}
    for (const [key, config] of Object.entries(articleConfig.images)) {
      const asset = await uploadImage(config)
      if (asset) {
        imageAssets[key] = asset
      }
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    console.log('✅ All images uploaded, updating article content...')

    // Create structured content with images
    const structuredContent = await createStructuredContent(imageAssets)

    // Update article with hero image and structured content
    const updatedArticle = await client
      .patch(articleConfig.articleId)
      .set({
        mainImage: imageAssets.hero ? {
          _type: 'image',
          asset: {
            _type: 'reference',
            _ref: imageAssets.hero._id
          },
          alt: articleConfig.images.hero.alt
        } : undefined,
        body: structuredContent
      })
      .commit()

    console.log('🎉 Article integration completed successfully!')
    console.log(`✅ Article URL: https://hiro-logue.vercel.app/blog/${articleConfig.slug}`)
    console.log(`✅ Title: ${updatedArticle.title}`)
    console.log(`✅ Images integrated: ${Object.keys(imageAssets).length}/4`)

  } catch (error) {
    console.error('❌ Error integrating article images:', error)
  }
}

module.exports = { integrateArticleImages }

// Run if called directly
if (require.main === module) {
  integrateArticleImages()
}