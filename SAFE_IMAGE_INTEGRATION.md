# 🛡️ 安全な画像統合システム

## 概要

ContentFlowで生成された記事画像を安全にSanityに統合するための予防ロジック付きシステムです。重複画像の問題を事前に検出し、適切な対処法を選択できます。

## 🚨 従来の問題

- **重複画像**: フィールド画像と本文内画像の重複表示
- **データ破損リスク**: 既存記事の意図しない上書き
- **手動確認不足**: 既存画像状況の見落とし
- **バックアップなし**: 失敗時の復旧困難

## ✅ 解決された機能

### 1. 事前安全性チェック
- 既存のフィールド画像検出
- 本文内画像の存在確認
- 重複リスクの自動評価
- 詳細な現状レポート表示

### 2. 対処法選択システム
```
⚠️ 画像衝突リスクが検出されました！

🎯 選択肢:
  1. replace - 既存画像を新画像で置換
  2. skip - 既存画像を保持、統合をスキップ  
  3. merge - 既存画像を保持、新画像を追加（重複リスク）
  4. cancel - 統合をキャンセル

選択してください (1-4):
```

### 3. 自動バックアップ
- 統合前の記事状態を自動保存
- `./backups/` ディレクトリに日時付きで保存
- 失敗時の迅速な復旧が可能

### 4. 包括的ログ
- 詳細な実行状況の表示
- エラー原因の明確化
- デバッグ情報の充実

## 🚀 使用方法

### 基本的な使用法

```bash
# 安全性チェック付きで実行
node scripts/integrate-current-article-safe.js

# 強制実行（既存画像チェックをスキップ）
node scripts/integrate-current-article-safe.js --force

# ヘルプ表示
node scripts/integrate-current-article-safe.js --help
```

### 実行フロー

1. **記事ファイル検索**: 最新の記事JSONファイルを自動検出
2. **Sanity記事検索**: スラッグベースで対応記事を特定
3. **画像ファイル検出**: 自動生成された画像の最新版を選択
4. **安全性チェック**: 既存画像状況の詳細分析
5. **対処法選択**: ユーザーによる統合方針の決定
6. **バックアップ作成**: 現在の記事状態を保存
7. **画像統合実行**: 選択された方針で安全に統合
8. **結果報告**: 統合結果と次のアクションの提示

## 📁 ファイル構成

```
ContentFlow/sanity-edition/
├── safe-image-integration.js           # 🛡️ 予防ロジック本体
├── scripts/
│   └── integrate-current-article-safe.js # 🔧 安全統合実行スクリプト
├── backups/                           # 💾 自動バックアップ保存先
├── check-duplicate-images.js          # 🔍 事後診断ツール
├── remove-duplicate-images.js         # 🧹 事後修復ツール
└── SAFE_IMAGE_INTEGRATION.md          # 📖 このドキュメント
```

## 🎯 予防ロジックの詳細

### checkExistingImages() 関数
```javascript
// 既存画像状況の包括的チェック
const imageStatus = await checkExistingImages(documentId);

// 戻り値:
{
  post: {...},           // 記事データ
  hasFieldImages: true,  // フィールド画像の有無
  hasBodyImages: false,  // 本文内画像の有無 
  bodyImageCount: 0,     // 本文内画像数
  bodyImageIds: [...],   // 本文内画像ID一覧
  fieldImages: {...}     // 各フィールドの有無詳細
}
```

### safeImageIntegration() 関数
```javascript
// 安全な統合処理の実行
const result = await safeImageIntegration(
  sessionId,    // セッションID
  documentId,   // Sanity記事ID
  slug,         // 記事スラッグ
  imageFiles,   // 統合する画像ファイル一覧
  {
    force: false,    // 強制実行フラグ
    mode: 'replace', // 統合モード
    backup: true     // バックアップ作成
  }
);
```

## 🔄 統合モード詳細

### 1. replace モード
- **動作**: 既存画像を完全に新画像で置換
- **用途**: 画像を更新したい場合
- **安全性**: 高（重複なし）
- **注意**: 既存画像は削除される

### 2. skip モード  
- **動作**: 統合をスキップ、既存画像を保持
- **用途**: 既存画像を維持したい場合
- **安全性**: 最高（変更なし）
- **注意**: 新画像は統合されない

### 3. merge モード
- **動作**: 既存画像を保持、新画像を追加
- **用途**: 両方の画像を保持したい場合
- **安全性**: 低（重複リスク）
- **注意**: 重複表示の可能性

## ⚡ 緊急時の対応

### バックアップからの復旧
```bash
# バックアップファイルの確認
ls -la backups/

# 手動復旧（必要に応じて）
node scripts/restore-from-backup.js backups/article-xxx-timestamp.json
```

### 重複画像の事後修正
```bash
# 重複検出
node check-duplicate-images.js

# 重複削除
node remove-duplicate-images.js
```

## 🎓 ベストプラクティス

### 実行前の確認事項
1. ✅ Sanity Studio で記事が正常に表示されるか
2. ✅ 画像ファイルが期待される場所に存在するか
3. ✅ 重要な記事の場合は事前に手動バックアップ

### 推奨実行手順
1. **通常実行**: `--force` フラグなしで実行
2. **状況確認**: 既存画像の詳細レポートを確認
3. **方針決定**: 適切な統合モードを選択
4. **結果確認**: 統合後にブラウザで表示確認
5. **バックアップ管理**: 定期的な古いバックアップの整理

### 注意事項
- 🚨 `--force` モードは緊急時のみ使用
- 💾 重要な記事は事前にSanity Studio で手動エクスポート
- 🔍 統合後は必ずブラウザで表示確認
- 📝 問題が発生した場合は即座にバックアップから復旧

## 🔧 開発者向け情報

### 新機能の追加
```javascript
// カスタム統合モードの追加例
const customMode = {
  name: 'selective',
  description: 'header画像のみ置換、section画像は保持',
  execute: async (uploadedImages, existingPost) => {
    // カスタムロジック実装
  }
};
```

### 統合先CMS の変更
```javascript
// microCMS等への対応
const cmsAdapter = {
  sanity: require('./adapters/sanity-adapter'),
  microcms: require('./adapters/microcms-adapter'),
  // 他のCMS対応
};
```

---

## 📞 サポート

問題が発生した場合：
1. 実行ログを確認
2. バックアップファイルの存在確認  
3. `check-duplicate-images.js` で現状診断
4. 必要に応じて手動復旧

**更新日**: 2025-07-16  
**バージョン**: v1.0  
**対応ContentFlow**: v2.0+