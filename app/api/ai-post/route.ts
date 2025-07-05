import { NextRequest, NextResponse } from 'next/server'

// AI-powered post generation endpoint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { topic, authorName = 'AI Assistant', category = 'ai' } = body

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      )
    }

    // Generate Hirolog-style AI content following HIROLOG_WRITING_RULES.md
    const title = `${topic}について考えてみた〜プログラマー父親の気づき〜`
    const excerpt = `${topic}との出会いから見えてきた、日常に活かせるヒントについてお話しします。`
    const content = `
皆さん、${topic}について聞いたり調べたりしたことはありますか？

実は先日、${topic}に触れる機会がありまして。最初は「へぇ、そういうものなんだ」程度の印象だったんですが、プログラマーの視点で、そして3児の父として考えてみると、これって意外と深い話なのかなと気づいたんです。

今回は、この${topic}の体験から見えてきた気づきについて、お話ししていきたいと思います。

## 実際に触れてみて感じたこと

ということで本題なんですけれども、${topic}について少し調べながら試してみました。

最初は「まあ、こんなものかな」という感じだったんですね。でも、実際に使ってみると、想像していたのとちょっと違う部分があったんです。

例えばですね、技術的な側面では確かに興味深い仕組みになっているんですが、それ以上に「これって普段の生活にも応用できそうだな」という発見がありました。

## 家族の反応が面白かった

家で${topic}の話をしていたら、妻が「それって〇〇みたいなものね」と言ったんです。さすがだなと思いました。私が技術的な説明をくどくどしていたのに、彼女は一瞬で本質を捉えていたんですね。

子どもたちも興味を示していて、「パパ、それってゲームにも使えるの？」なんて質問されました。確かに、視点を変えて考えてみると、いろんな分野に応用できそうです。

考えてみると、新しいことを学ぶときって、家族の視点を聞くのが一番勉強になったりしますよね。

## 意外な発見

そんな中ですね、${topic}について調べていて、意外な発見がありました。

表面的には「新しい技術」というイメージが強かったんですが、実は根本的な考え方は、普段プログラミングをしているときの問題解決アプローチと似ているんじゃないかなと思います。

つまり、「問題を分解して、一つずつ解決していく」という基本的な姿勢ですね。これって、仕事だけじゃなくて、家事や子育てでも使える考え方だと改めて感じました。

## 皆さんはどうでしょうか？

皆さんも${topic}について、何か体験や感想はありませんか？

私の場合は、まだ手探りでやっている部分も多いんですが、確実に言えるのは「実際に試してみることの大切さ」ですね。

頭で考えているだけだと見えてこないことが、実際に触ってみると意外とたくさん発見できるものです。きっと皆さんも、それぞれの立場や環境で、違った気づきがあるんじゃないでしょうか。

## これからの活用方法

この${topic}の体験を通して、今後気をつけていきたいなと思ったことがあります。

**新しいものへの向き合い方**
最初から「どう使えるか」を考えるより、まずは「面白そうだから触ってみる」という好奇心を大切にしたいですね。

**家族との共有**
技術的な話でも、家族に話してみると意外な視点がもらえることが多いです。一人で考え込まず、身近な人の意見を聞くのも大事だなと思いました。

**日常への応用**
新しく学んだことを、仕事だけじゃなく、普段の生活にも活かせないか考えてみる習慣をつけたいと思います。

## 最後に

${topic}について考える時間を通して、改めて「学び続けること」の楽しさを感じています。

40代になって、子どもたちも大きくなってきましたが、まだまだ知らないことや面白いことがたくさんあるんだなと実感しています。

皆さんも、もし${topic}について興味を持たれたら、ぜひ一度触れてみてください。そして、もしよろしければ、コメントでどんな印象を持たれたか教えてくださいね。

皆さんの体験談も、ぜひお聞きしたいです。
    `.trim()

    // Create the post using our API
    const response = await fetch(`${request.nextUrl.origin}/api/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        content,
        excerpt,
        category,
        authorName
      })
    })

    if (!response.ok) {
      throw new Error('Failed to create post')
    }

    const result = await response.json()

    return NextResponse.json({
      success: true,
      post: result.post,
      message: `AI記事「${title}」が正常に作成されました`,
      details: {
        title,
        excerpt,
        category,
        authorName,
        topic
      }
    })

  } catch (error) {
    console.error('Error generating AI post:', error)
    return NextResponse.json(
      { error: 'Failed to generate AI post' },
      { status: 500 }
    )
  }
}