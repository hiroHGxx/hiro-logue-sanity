# デプロイメントチェックリスト

## 🚀 必須デプロイ手順（自動化対応）

### Phase 1: 開発完了確認
- [ ] ローカルビルドテスト: `npm run build`
- [ ] 機能動作確認: 主要機能のテスト実行
- [ ] 品質チェック: ESLint・TypeScript エラー確認

### Phase 2: Git操作（必須）
- [ ] **Git Status確認**: `git status`
- [ ] **変更内容確認**: `git diff` 
- [ ] **ファイル追加**: `git add .`
- [ ] **コミット作成**: 意味のあるコミットメッセージ
- [ ] **Push実行**: `git push origin main`

### Phase 3: デプロイ確認
- [ ] Vercel自動デプロイ開始確認
- [ ] 本番サイトでの動作確認
- [ ] 新機能の本番環境テスト

## ⚠️ 今回の問題と対策

### 問題1: デプロイ忘れ
**原因**: 改善完了後にGit操作を忘れた
**対策**: 
- 作業完了時に自動的にGit状態をチェック
- 未commitの変更がある場合は警告表示

### 問題2: 記事品質の初期問題
**原因**: HIROLOG_WRITING_RULES.mdの不適用
**対策**: 
- AI記事生成時に品質チェック機能を追加
- 記事作成後の自動品質評価システム

## 🔄 自動化されたワークフロー

### 推奨作業手順
1. **機能開発・改善**
2. **ローカルテスト**: `npm run build && npm run dev`
3. **Git操作**: 専用スクリプトで自動化
4. **デプロイ確認**: Vercel URL確認

### 自動化スクリプト実装予定
```bash
# デプロイ前チェック
npm run pre-deploy-check

# 自動デプロイ実行
npm run deploy

# デプロイ後確認
npm run post-deploy-verify
```

## 📋 コミット メッセージ テンプレート

```
[TYPE] Brief description of changes

- Detailed change 1
- Detailed change 2
- Impact/benefit description

🤖 Generated with [Claude Code](https://claude.ai/code)
Co-Authored-By: Claude <noreply@anthropic.com>
```

**TYPE選択肢**:
- `feat`: 新機能追加
- `fix`: バグ修正
- `improve`: 品質改善
- `refactor`: リファクタリング
- `docs`: ドキュメント更新

## 🎯 品質保証指標

### 記事品質チェック項目
1. **HIROLOG_WRITING_RULES.md準拠**
2. **適切な構造（はじめに/本文/おわりに）**
3. **読者エンゲージメント要素**
4. **音声配信的表現の除去**
5. **魅力的なタイトル生成**

### 技術品質チェック項目
1. **TypeScript エラー 0件**
2. **ESLint 警告 最小化**
3. **ビルド成功**
4. **主要機能動作確認**

---

**重要**: このチェックリストは作業完了時に必ず実行し、全項目をクリアしてからセッション終了する。