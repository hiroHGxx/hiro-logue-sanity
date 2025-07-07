# Hiro-Logue - 暮らしの解像度を上げるノート

**Sanity版ブログシステム**

## 🎯 プロジェクト概要

プログラマー＆3児の父「ヒロ」による技術×日常の深い洞察ブログです。単なる技術解説ではなく、体験から本質を見つける記事を提供します。

- **本番サイト**: https://hiro-logue.vercel.app/
- **リポジトリ**: https://github.com/hiroHGxx/hiro-logue-sanity

## 🛠️ 技術スタック

- **Framework**: Next.js 15 + TypeScript
- **Styling**: Tailwind CSS + 動的CSS変数
- **CMS**: Sanity (ヘッドレス)
- **API**: Next.js API Routes
- **Deployment**: Vercel
- **AI**: 記事生成・デザイン変更自動化

## ✨ 主要機能

- ✅ **基本ブログ機能**: 記事一覧・個別記事表示
- ✅ **レスポンシブデザイン**: モダン書斎風テーマ
- ✅ **SEO最適化**: メタデータ・構造化データ
- ✅ **AI記事生成**: 自然言語→自動投稿API
- ✅ **動的デザイン変更**: CSS変数による一括変更
- ✅ **品質管理**: 音声配信→ブログ適切変換

## 🚀 Getting Started

### 開発環境セットアップ

```bash
# 依存関係インストール
npm install

# 開発サーバー起動
npm run dev

# ブラウザで確認
# http://localhost:3000
```

### 環境変数設定

```bash
# .env.local ファイルを作成
NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=your-api-token
```

## 📋 品質管理

### 記事作成ワークフロー
1. **テーマ設定**: 体験ベースの具体的トピック
2. **ルール適用**: `HIRO_LOGUE_WRITING_RULES.md`準拠
3. **AI生成**: `/api/ai-post`で自動記事作成
4. **自動品質チェック**: `/api/quality-check`で6項目評価
5. **品質確認**: スコア80点以上で合格
6. **公開**: Sanity管理画面から即座反映

### デプロイ・運用
```bash
# ビルドテスト
npm run build

# 品質チェック
npm run pre-deploy-check

# 自動デプロイ
npm run full-deploy
```

## 🎨 ブランドガイドライン

### サイトコンセプト
**「暮らしの解像度を上げるノート」**
- 日常体験から深い洞察を引き出す
- プログラマー父親の視点で技術と家族を結ぶ
- 読者の「明日が楽しくなる」きっかけを提供

### デザインシステム
```css
/* モダン書斎風カラーパレット */
--primary: #8B4513;      /* サドルブラウン */
--secondary: #CD853F;     /* ペルー */
--accent: #D2691E;       /* チョコレート */
--background: #FDF5E6;   /* オールドレース */
--text: #2F2F2F;         /* ダークグレー */
```

## 📊 パフォーマンス指標

- **ビルド時間**: 20-30秒（標準的なブログサイト）
- **初回表示**: 2-3秒（最適化済み）
- **記事作成**: AI生成で3-5分（手動1-2時間から短縮）
- **SEOスコア**: 95/100（LLMO対応済み）

## 🔗 関連リンク

- **microCMS版**: https://mono-logue.vercel.app/
- **プロジェクト全体**: [ContentFlow Documentation](../CLAUDE.md)

---

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).