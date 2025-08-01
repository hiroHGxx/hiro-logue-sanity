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

// Article content
const articleData = {
  title: 'AI活用と余白の作り方〜忙しい日常に「間」を取り戻すコツ〜',
  slug: 'ai-yohaku-balance',
  categories: ['ai', 'tech'],
  excerpt: 'AIツールで効率化しているのに、なぜか余裕がない。そんな現代の悩みを解決する「AI活用と余白の作り方」について、40代プログラマー父親の実体験から考察します。',
  content: `今回は「AI活用と余白の作り方」というテーマで書いていきます。

実は先日、妻から「最近、なんだかいつも忙しそうだね」と言われたんです。確かに、AIツールを使って効率化しているはずなのに、なぜか時間に追われている感覚がありました。

考えてみると、これって現代の多くの人が直面している問題なのかなと思います。技術で効率化しても、なぜか余裕が生まれない。むしろ、やることが増えて忙しくなってしまう。

そんな中で気づいた「AI活用と余白の作り方」について、今回はお話していきたいと思います。

## AI効率化の落とし穴

ということで本題なんですけれども、AIツールを導入して3ヶ月ほど経った我が家の状況から。

最初はChatGPTで記事の下書きを作ったり、Copilotでコーディングを効率化したりして、「これで時間ができる！」と思っていました。でも、なんというか、実際には違ったんですね。

確かに個々の作業は早くなりました。記事を書く時間は半分になったし、プログラミングも明らかに速くなった。でも、気がつくと以前より多くのプロジェクトを抱えて、結果的に忙しくなっていたんです。

皆さんも似たような経験はありませんか？効率化ツールを使っているのに、なぜか余裕がない。そんな感覚をお持ちの方も多いのではないでしょうか。

## 本当の余白とは何か

子どもたちを見ていて気づいたことがあります。息子は宿題をAIに聞いて素早く終わらせるんですが、その後必ず「何もしない時間」を作るんです。ぼーっとベランダで空を見たり、ペットの猫と遊んだり。

「時間があるなら他の勉強もできるよ」と言うと、「でも、考える時間も必要だよ」って返されました。さすがだなと思いました。

実はこれが、私たち大人が見落としがちな「余白」の本質なのかもしれません。余白って、単に空いた時間のことではなくて、何かを考えたり、感じたりするための「間」なんですね。

AIで効率化して生まれた時間を、また別のタスクで埋めてしまっては、本当の意味での余白は生まれない。これが私たちの陥りがちな罠だったんです。

## 我が家で試した3つの方法

そこで、我が家で実践している「AI活用しながら余白を作る」方法を3つご紹介します。

### 1. 意図的な非効率の時間

週に1度、あえてAIを使わない時間を作ります。手書きでメモを取ったり、調べ物も本で探したり。一見非効率ですが、この時間が思考の幅を広げてくれるんです。

妻と一緒に料理をする時も、レシピアプリは使わず、冷蔵庫の中身を見ながら「今日は何作ろうか」と話し合う。こういう時間って、実はとても豊かなんですよね。

### 2. AIとの対話時間

ChatGPTを単なる作業ツールとしてではなく、思考のパートナーとして使う時間を作りました。「今日感じたこと」や「最近考えていること」を相談してみるんです。

すると、自分でも気づかなかった考えが整理されたり、新しい視点が見つかったりします。効率化のためのAIではなく、内省のためのAI。これも一つの余白の作り方だと思います。

### 3. 家族のデジタルデトックス時間

夕食後の1時間は、家族全員がデジタル機器を使わない時間にしています。最初は子どもたちも「つまらない」と言っていましたが、今では貴重な会話の時間になっています。

ペットの猫も、なぜかこの時間になると家族の近くに寄ってきます。動物って、人間の「余白」を敏感に感じ取るのかもしれませんね。

## 改めて感じた余白の価値

こうした実践を通して、改めて余白の価値を感じました。

余白があることで、日々の出来事をゆっくり振り返ることができる。家族との何気ない会話から、新しい発見があったりする。そして何より、「今この瞬間」を味わうことができるんです。

AIは確かに素晴らしいツールです。でも、それによって生まれた時間をどう使うかは、私たち次第。技術と人間らしさのバランスを取ることが、本当の豊かさにつながるのかなと思います。

## おわりに

今回は「AI活用と余白の作り方」というテーマで書きました。

効率化は大切ですが、それ以上に大切なのは、生まれた時間をどう過ごすか。意図的に余白を作ることで、毎日がより豊かになるような気がします。

皆さんも、AIを活用しながら余白を作る方法を、何か実践されていますか？もしよろしければ、コメントで教えてください。

40代になって、改めて「間」の大切さを実感している今日この頃です。技術を使いこなしながらも、人間らしい時間を大切にしていきたいですね。`
}

async function createArticleWithImages() {
  try {
    console.log('Creating new article with images...')
    
    // Image paths mapping (to be updated after image generation)
    const imagePaths = {
      hero: '/Users/gotohiro/Documents/user/Products/ContentFlow/sanity-edition/public/images/blog/ai-articles/ai-balance-hero.png',
      section1: '/Users/gotohiro/Documents/user/Products/ContentFlow/sanity-edition/public/images/blog/ai-articles/ai-efficiency-trap.png',
      section2: '/Users/gotohiro/Documents/user/Products/ContentFlow/sanity-edition/public/images/blog/ai-articles/family-mindful-time.png',
      section3: '/Users/gotohiro/Documents/user/Products/ContentFlow/sanity-edition/public/images/blog/ai-articles/balanced-lifestyle.png'
    }
    
    // Check if images exist
    const imageExists = (path) => {
      try {
        return fs.existsSync(path)
      } catch {
        return false
      }
    }
    
    console.log('Checking image files...')
    Object.entries(imagePaths).forEach(([key, path]) => {
      console.log(`${key}: ${imageExists(path) ? '✅' : '❌'} ${path}`)
    })
    
    // For now, create article without images (images to be added later)
    const articleDoc = {
      _type: 'post',
      title: articleData.title,
      slug: {
        _type: 'slug',
        current: articleData.slug
      },
      categories: articleData.categories,
      excerpt: articleData.excerpt,
      publishedAt: new Date().toISOString(),
      body: [
        {
          _type: 'block',
          _key: 'intro',
          style: 'normal',
          children: [
            {
              _type: 'span',
              text: articleData.content
            }
          ]
        }
      ]
    }
    
    console.log('Creating article in Sanity...')
    const result = await client.create(articleDoc)
    
    console.log(`Article created successfully!`)
    console.log(`Article ID: ${result._id}`)
    console.log(`Article Slug: ${result.slug.current}`)
    console.log(`Title: ${result.title}`)
    
    return result
    
  } catch (error) {
    console.error('Error creating article:', error)
  }
}

module.exports = { createArticleWithImages, articleData }

// Run if called directly
if (require.main === module) {
  createArticleWithImages()
}