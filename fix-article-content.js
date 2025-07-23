const { createClient } = require('@sanity/client');
require('dotenv').config({ path: '.env.local' });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION
});

// 正しい記事内容
const correctContent = `## はじめに

最近、我が家の中学生の子どもが「AIが絵を描いてくれるから、もう絵を練習する意味がないんじゃない？」と言ったんですね。その瞬間、私自身もプログラミングをしていて同じような疑問を感じていたことに気づきました。

AIが文章を書き、絵を描き、音楽を作る時代に、人間の独創性って一体何なのでしょうか。もしかすると、私たちが「独創性」だと思っていたものが、実は違う形で存在しているのかもしれません。

皆さんも、AIツールを使いながら「これって自分の作品と言えるのかな？」と迷ったことはありませんか？今回は、そんな現代の創造性について、家族との会話や日々の体験を通して感じたことを書いていこうと思います。

## 子どもの疑問から始まった気づき

先ほどの中学生の子どもの発言ですが、実はその後の会話がとても興味深かったんです。妻が「でも、AIに何を描かせるかを考えるのは、あなたでしょ？」と返したところ、子どもがハッとした表情を見せたんですね。

これを聞いて、私も改めて自分のプログラミング作業を振り返ってみました。最近はChatGPTやClaude、GitHub Copilotなどを頻繁に使っているのですが、コードの大部分をAIが生成していても、何を作るか、どういう機能にするか、どんなユーザー体験を提供するかは、やはり私が考えているんですね。

プログラマーとして20年近く働いてきて感じるのは、実は昔から私たちはずっと「真似」から始めていたということです。参考書のサンプルコードをコピーして、Stack Overflowから解決策を見つけて、オープンソースライブラリを組み合わせて。

でも、それらを「どう組み合わせるか」「何のために使うか」「どんな問題を解決するか」という部分は、常に人間が考えてきました。AIが登場した今も、この本質は変わっていないような気がします。

## 保護犬ちゃんから学んだ「模倣の力」

面白いことに、この「真似から始まる創造」について考えていた時、我が家の保護犬ちゃんの行動を観察していて、ハッとした瞬間があったんですね。

保護犬ちゃんは、最初に家に来た時は人間との関わり方がよく分からなかったようでした。でも、保護猫ちゃんの行動を見て学んでいくんです。猫ちゃんが私の膝の上に乗ると、犬ちゃんも真似して膝に乗ろうとします（サイズ的に無理なんですが）。

でも、犬ちゃんなりの表現方法を見つけていくんですね。猫のように膝には乗れないけれど、足元にぴったりと寄り添って甘える方法を編み出しました。これって、まさに「模倣から独自性への発展」だなと思ったんです。

AI時代の創造性も、これと似ているのかもしれません。AIの出力を「真似」するのではなく、AIを「道具として使いながら」自分なりの表現を見つけていく。そんな新しい創造のプロセスが生まれているのかもしれませんね。

## 技術と人間性のバランスを見つける

最近、プロジェクトでStable DiffusionやGPTを活用したWebアプリケーションを作っているのですが、興味深い発見がありました。AIが生成するコンテンツをそのまま使うよりも、「人間らしい調整」を加えた方が、ユーザーからの反応が良いんですね。

例えば、AIが生成した文章に、実際の体験談を混ぜたり、少し不完全な部分を残したり。完璧すぎるものよりも、人間らしい「揺らぎ」や「個性」があるコンテンツの方が、読者に愛されることが多いんです。

これは妻との会話でも話題になったのですが、「完璧な料理を作るロボットよりも、たまに味付けを間違えるお母さんの料理の方が愛される」のと似ているかもしれません。

AI時代の独創性とは、もしかすると「AIと協働しながら、いかに人間らしさを表現するか」なのかもしれませんね。技術の力を借りながらも、最終的には人間の感性や体験、価値観を反映させる。そんなバランス感覚が求められているような気がします。

皆さんはAIツールを使う時、どのように「自分らしさ」を表現していらっしゃいますか？

## おわりに

今回は「AI時代の独創性」について、家族との会話やペットとの日常から感じたことを書きました。

結論として感じるのは、独創性の定義が変わってきているということです。ゼロから何かを作り出すことだけが創造性ではなく、「既存のものをどう組み合わせ、どう活用し、どう人間らしく表現するか」という新しい形の創造性が重要になってきているのかもしれません。

AIは確かに多くのことを代替してくれますが、「何を作りたいか」「誰のために作るか」「なぜ作るのか」という部分は、やはり人間にしかできないことだと思います。そして、その「意図」や「想い」こそが、AI時代の独創性の核心なのかもしれませんね。

皆さんも、AIツールを使いながら何かを創作された経験はありますか？その時、どんな部分に「自分らしさ」を感じられたでしょうか。もしよろしければ、コメントで教えていただけると嬉しいです。

新しい時代の創造性について、一緒に考えていけたらと思います。`;

function markdownToBlocks(markdown) {
  const lines = markdown.split('\n');
  const blocks = [];
  let currentParagraph = [];
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (!trimmedLine) {
      if (currentParagraph.length > 0) {
        blocks.push({
          _type: 'block',
          _key: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          style: 'normal',
          children: [{
            _type: 'span',
            text: currentParagraph.join(' '),
            marks: []
          }]
        });
        currentParagraph = [];
      }
    } else if (trimmedLine.startsWith('## ')) {
      if (currentParagraph.length > 0) {
        blocks.push({
          _type: 'block',
          _key: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          style: 'normal',
          children: [{
            _type: 'span',
            text: currentParagraph.join(' '),
            marks: []
          }]
        });
        currentParagraph = [];
      }
      
      blocks.push({
        _type: 'block',
        _key: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        style: 'h2',
        children: [{
          _type: 'span',
          text: trimmedLine.substring(3),
          marks: []
        }]
      });
    } else {
      currentParagraph.push(trimmedLine);
    }
  }
  
  if (currentParagraph.length > 0) {
    blocks.push({
      _type: 'block',
      _key: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      style: 'normal',
      children: [{
        _type: 'span',
        text: currentParagraph.join(' '),
        marks: []
      }]
    });
  }
  
  return blocks;
}

async function updateContent() {
  try {
    console.log('🔄 記事内容を正しく更新中...');
    
    const bodyBlocks = markdownToBlocks(correctContent);
    
    const result = await client
      .patch('pnkFeZ6saTOgO27Op2NX5f')
      .set({ body: bodyBlocks })
      .commit();
    
    console.log('✅ 記事内容を正しく更新しました');
    console.log('📄 Document ID:', result._id);
    console.log('🌐 記事URL: https://hiro-logue.vercel.app/blog/ai-era-originality-creativity');
  } catch (error) {
    console.error('❌ 更新エラー:', error);
  }
}

updateContent();