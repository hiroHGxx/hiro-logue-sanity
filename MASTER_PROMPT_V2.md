# ContentFlow V2 マスタープロンプトテンプレート

## 📋 使用方法
このテンプレートの`{テーマ}`部分を希望するテーマに置き換えて、Claude Codeに送信してください。

---

## 🎯 マスタープロンプト V2

これから、ブログ記事の生成からSanityへの登録、さらに画像生成まで含む**完全一気通貫ワークフロー**を実行します。以下の2ステップで正確に実行してください。

---

### **ステップ1：Claude Code自身による高品質記事+画像プロンプト生成**

あなたは私のペルソナを完璧に理解したプロのブロガー「ヒロ」として、以下の条件で記事と画像プロンプトを生成し、その結果をJSONファイルに**新規に書き込んでください。**

#### **【記事生成の条件】**
*   **思考の参考にするファイル:**
    *   `HIRO_PERSONA.md` - ヒロの人物像・話し方・価値観を完全理解
    *   `HIRO_ARTICLE_STRUCTURE.md` - 記事構成パターン参照
*   **今回の記事テーマ:**
    *   「{テーマ}」
*   **記事の要件:**
    *   文字数: **2000-2500文字**（必須達成）
    *   構成: はじめに→メインセクション（2-3個）→おわりに（計4-5セクション）
    *   スタイル: ヒロの個人的体験ベース・穏やかな敬語・推測表現多用
    *   内容: 具体的な体験談・家族の話（妻・3人の子ども・ペット）・技術と人間性のバランス・読者への問いかけ
*   **記事品質要件:**
    *   Hirologスタイル完全準拠（「です・ます調」「〜なのかなと思います」「〜な気がします」等）
    *   家族エピソード自然な織り込み（中学生の子ども・妻との会話・保護犬猫等）
    *   読者への問いかけ複数回（「皆さんも〜ありませんか？」「どのように感じていらっしゃいますか？」）
    *   技術者視点での具体的発見・学び
    *   音声配信的表現は完全回避（「お話し」→「書く」「配信」→「記事」）
*   **タイトル生成時の注意:**
    *   「プログラマー父」という表現は使わない
    *   自然で親しみやすく、かつ魅力的なタイトルにする
    *   サブタイトル（〜以降）も含めて工夫する
    *   SEOを意識したキーワード含有

#### **【画像プロンプト生成の条件】**
*   **生成枚数**: 4枚（header + section1 + section2 + section3）
*   **画像配置戦略:**
    *   ヘッダー画像: 記事全体のメインビジュアル（アイキャッチ）
    *   セクション1画像: 第1セクションのテーマ画像（内容理解促進）
    *   セクション2画像: 第2セクションのテーマ画像（内容理解促進）
    *   セクション3画像: 第3セクションのテーマ画像（内容理解促進）
*   **画像プロンプト生成ルール:**
    *   各画像のコンセプト・目的を明確化
    *   記事内容との整合性確保
    *   ヒロ-Logueブランドスタイル統一
    *   **スタイル多様化**: 記事テーマに応じて以下のスタイル修飾子を動的選択
        - 写真調: "photorealistic, cinematic lighting"
        - イラスト調: "as a watercolor illustration, artistic style"
        - フラットデザイン: "in a flat design style, minimalist"
        - 抽象的: "as an abstract art piece, conceptual"
        - 技術系: "clean, modern, tech-focused, professional"
*   **プロンプト要件:**
    *   テーマと記事内容に完全一致
    *   人物描画完全防止（強化ネガティブプロンプト必須）
    *   1600×896解像度（16:9比率）
    *   ヒロらしい温かみのある雰囲気
    *   日本的ミニマリズム要素

#### **【出力ファイル形式】**
*   **ファイル名**: `articles/article-{YYYYMMDD-HHMMSS}.json`
*   **JSON構造**:
```json
{
  "metadata": {
    "sessionId": "article-{YYYYMMDD-HHMMSS}",
    "theme": "{テーマ}",
    "createdAt": "2025-07-11T16:00:00.000Z",
    "version": "2.0"
  },
  "article": {
    "title": "生成した記事タイトル",
    "body": "## はじめに\n\n生成したMarkdown形式の記事本文（2000-2500文字）...\n\n## おわりに\n\n読者への問いかけで締めくくり",
    "slug": "english-seo-friendly-slug",
    "categories": ["AI", "技術", "体験"],
    "excerpt": "記事の簡潔で魅力的な説明（100-150文字）"
  },
  "imagePrompts": [
    {
      "position": "header",
      "prompt": "記事全体のメインビジュアルとして、{テーマ}を表現する詳細なプロンプト（記事内容との整合性確保）",
      "description": "ヘッダー画像の目的・記事との関連性説明",
      "style": "記事テーマに応じたスタイル修飾子（写真調/イラスト調/フラットデザイン/抽象的/技術系から選択） + warm lighting, cozy atmosphere, japanese minimalist",
      "negativePrompt": "person, people, human, man, woman, face, realistic human features, portrait, character, figure, text, watermark, blurry, lowres, bad anatomy, bad hands, missing fingers, extra digits, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, username, artist name",
      "parameters": {
        "width": 1600,
        "height": 896,
        "num_inference_steps": 25,
        "guidance_scale": 7.5
      }
    },
    {
      "position": "section1",
      "prompt": "第1セクション用の詳細なプロンプト（セクション内容との関連性確保）",
      "description": "第1セクション内容との関連性・画像の目的説明",
      "style": "記事テーマに応じたスタイル修飾子（写真調/イラスト調/フラットデザイン/抽象的/技術系から選択） + warm lighting, cozy atmosphere, japanese minimalist",
      "negativePrompt": "person, people, human, man, woman, face, realistic human features, portrait, character, figure, text, watermark, blurry, lowres, bad anatomy, bad hands, missing fingers, extra digits, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, username, artist name",
      "parameters": {
        "width": 1600,
        "height": 896,
        "num_inference_steps": 25,
        "guidance_scale": 7.5
      }
    },
    {
      "position": "section2",
      "prompt": "第2セクション用の詳細なプロンプト（セクション内容との関連性確保）",
      "description": "第2セクション内容との関連性・画像の目的説明",
      "style": "記事テーマに応じたスタイル修飾子（写真調/イラスト調/フラットデザイン/抽象的/技術系から選択） + warm lighting, cozy atmosphere, japanese minimalist",
      "negativePrompt": "person, people, human, man, woman, face, realistic human features, portrait, character, figure, text, watermark, blurry, lowres, bad anatomy, bad hands, missing fingers, extra digits, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, username, artist name",
      "parameters": {
        "width": 1600,
        "height": 896,
        "num_inference_steps": 25,
        "guidance_scale": 7.5
      }
    },
    {
      "position": "section3",
      "prompt": "第3セクション用の詳細なプロンプト（セクション内容との関連性確保）",
      "description": "第3セクション内容との関連性・画像の目的説明",
      "style": "記事テーマに応じたスタイル修飾子（写真調/イラスト調/フラットデザイン/抽象的/技術系から選択） + warm lighting, cozy atmosphere, japanese minimalist",
      "negativePrompt": "person, people, human, man, woman, face, realistic human features, portrait, character, figure, text, watermark, blurry, lowres, bad anatomy, bad hands, missing fingers, extra digits, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, username, artist name",
      "parameters": {
        "width": 1600,
        "height": 896,
        "num_inference_steps": 25,
        "guidance_scale": 7.5
      }
    }
  ]
}
```

*   **スラッグ生成ルール:**
    *   英語のみ使用、小文字、ハイフン区切り
    *   SEO最適化を考慮（5-15文字推奨）
    *   記事の核となるキーワードを含める
    *   日本語→英語マッピング活用
    *   例: "adult-learning-journey", "technology-family-balance", "programming-daily-insights"

#### **【重要な生成指示】**
**画像プロンプト生成時の具体的な手順:**
1. **記事内容を完全理解**してから各セクションに最適な画像を計画
2. **テーマに応じたスタイル選択**: 技術系なら「clean, modern, tech-focused」、家族系なら「warm, cozy, family-friendly」など
3. **具体的で詳細なプロンプト作成**: 抽象的な指示ではなく、実際にStable Diffusionが理解できる具体的描写
4. **各画像の目的明確化**: descriptionフィールドで画像の役割・記事との関連性を説明

#### **【ステップ1の最終的なアクション】**
上記の条件に従って生成した**完全なJSONコンテンツ**を、`Write` ツールを使い、適切なファイルパスに書き込んでください。

---

### **ステップ2：一気通貫ワークフローの自動起動**

ステップ1でJSONファイルの作成が完了したら、次に、そのファイルを読み込んで**記事のSanity投稿**と**画像のバックグラウンド生成**を開始するスクリプトを実行してください。

#### **【ステップ2で実行するアクション】**
以下のシェルコマンドを `Bash` ツールを使って実行してください。

```bash
cd /Users/gotohiro/Documents/user/Products/ContentFlow/sanity-edition && node scripts/start-full-workflow.js
```

このコマンドが実行されると、自動的に以下が行われます：
1. **記事の先行Sanity投稿** - テキスト部分を即座に公開
2. **画像生成状態ファイル作成** - バックグラウンド処理準備
3. **Stable Diffusion画像生成開始** - 4枚の高品質画像をバックグラウンドで生成
4. **進捗状況報告** - 記事公開URL・画像生成進捗の表示

---

## 🎯 期待される最終結果

**即座に得られるもの:**
- **記事公開URL**: `https://hiro-logue.vercel.app/blog/{slug}`
- **記事品質**: 2000-2500文字、Hiro Persona完全準拠
- **画像生成開始**: バックグラウンドで4枚画像生成開始

**15-20分後に完成するもの:**
- **4枚の高品質画像**: 1600×896解像度、テーマ連動、人物なし
- **完全なビジュアルブログ**: テキスト+画像の統合コンテンツ

---

## 📋 品質チェックポイント

#### 記事品質（必須達成項目）
- [ ] 文字数2000-2500文字
- [ ] Hirologスタイル完全準拠（穏やか敬語・推測表現）
- [ ] 家族エピソード自然な織り込み
- [ ] 読者への問いかけ複数回
- [ ] 技術者視点の具体的洞察
- [ ] 音声配信表現完全回避

#### 画像プロンプト（必須達成項目）
- [ ] 4枚分完全生成
- [ ] テーマとの一貫性
- [ ] 人物描画防止ネガティブプロンプト
- [ ] 1600×896解像度設定
- [ ] スタイルバリエーション

---

**以上の2ステップを、順番に確実に実行してください。**

## 💡 実行例

```
ユーザー入力例:
「完全ワークフローを実行してください。テーマ: "リモートワークと家族時間のバランス"」

期待される実行:
1. Claude Codeがテーマに基づいてHiro Persona準拠の高品質記事+4枚の画像プロンプトを生成
2. article-20250711-163000.json に出力
3. scripts/start-full-workflow.js 実行
4. 記事公開URL即座表示 + 画像生成バックグラウンド開始
```

---

**📝 作成者**: Claude Code  
**📅 作成日**: 2025-07-11  
**🎯 対象**: ContentFlow V2 完全一気通貫ワークフロー