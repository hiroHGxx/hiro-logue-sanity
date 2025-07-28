# PRD: ContentFlow N8N自動化プラットフォーム

## 📋 プロジェクト概要

### 目的
既存のContentFlow sanity-editionで培った技術資産を活用し、n8nワークフローエンジンによる完全自動化されたAI記事生成・画像統合プラットフォームを構築する。

### 背景
- **Claude Code版の制約**: APIタイムアウト2分制限により一連処理が困難
- **手動介入の必要性**: Phase分離による人的介入が必要
- **スケーラビリティの限界**: 手動実行による処理量制限

### 解決する課題
1. **Claude APIタイムアウト**: 2分制限による処理中断
2. **手動プロセス**: Phase 2→3の手動トリガー必要
3. **処理効率**: 20-30分の手動監視・操作
4. **スケール性**: 大量記事生成の自動化不可

## 🎯 プロジェクト目標

### 主要目標
- **完全自動化**: トリガー→完了まで無人実行
- **高速処理**: 15-20分での記事+画像完成
- **安定性**: 95%以上の成功率確保
- **スケーラビリティ**: 並列処理・大量生成対応

### 成功指標
- **実行時間**: 30分→15分（50%削減）
- **人的工数**: 15分/記事→0分/記事（100%自動化）
- **成功率**: 85%→95%以上
- **スループット**: 月4記事→月20記事

## 🏗️ システム設計

### アーキテクチャ概要
```
独立プロジェクト: ContentFlow-N8N/
├── n8n Engine（ワークフロー実行）
├── Scripts Library（sanity-edition移植）
├── Stable Diffusion（画像生成）
└── Sanity CMS（データ保存）
```

### 技術構成
- **ワークフローエンジン**: n8n（オープンソース）
- **記事生成**: Claude API（分割実行）
- **画像生成**: Stable Diffusion（ローカル実行）
- **CMS**: Sanity（既存プロジェクト活用）
- **実行環境**: Docker + Node.js + Python

## 📁 プロジェクト構造

### ディレクトリ設計
```
/Users/gotohiro/Documents/user/Products/ContentFlow-N8N/
├── README.md
├── PRD_n8n.md（このファイル）
├── docker-compose.yml
├── package.json
├── .env.example
├── .gitignore
├── n8n-workflows/           # n8nワークフロー定義
│   ├── contentflow-main.json
│   ├── image-generation.json
│   ├── quality-check.json
│   └── deployment.json
├── scripts/                 # sanity-edition移植スクリプト
│   ├── claude/
│   │   ├── article-generator.js
│   │   ├── image-prompt-generator.js
│   │   └── quality-checker.js
│   ├── sanity/
│   │   ├── uploader.js
│   │   ├── image-integrator.js
│   │   └── mutations.js
│   ├── stable-diffusion/
│   │   ├── image-generator.py
│   │   ├── batch-processor.py
│   │   └── monitor.py
│   └── utils/
│       ├── file-manager.js
│       ├── logger.js
│       └── status-tracker.js
├── templates/               # 共有リソース
│   ├── personas/
│   │   ├── hiro-persona.md
│   │   └── article-structure.md
│   ├── prompts/
│   │   ├── master-prompt-split.md
│   │   ├── image-prompts.md
│   │   └── quality-rules.md
│   └── configs/
│       ├── workflow-config.json
│       ├── style-templates.json
│       └── gemini-rules.json
├── config/                  # システム設定
│   ├── n8n/
│   │   ├── environment.yml
│   │   └── credentials.json
│   ├── stable-diffusion/
│   │   ├── model-config.json
│   │   └── generation-params.json
│   └── sanity/
│       ├── schema-sync.js
│       └── client-config.js
├── docs/                    # ドキュメント
│   ├── setup-guide.md
│   ├── workflow-design.md
│   ├── troubleshooting.md
│   └── api-reference.md
├── tests/                   # テストファイル
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── logs/                    # ログファイル
    ├── n8n/
    ├── workflows/
    └── errors/
```

## 🔄 ワークフロー設計

### メインワークフロー: contentflow-main
```
1. Trigger（HTTP Webhook/Schedule）
   ↓
2. Claude記事生成（分割実行）
   ├── Part 1: 記事本文生成（2分以内）
   └── Part 2: 画像プロンプト生成（2分以内）
   ↓
3. Sanity記事投稿（テキストのみ）
   ↓
4. 画像生成開始（並列実行）
   ├── Header画像
   ├── Section1画像
   ├── Section2画像
   └── Section3画像
   ↓
5. 画像完了待機・監視
   ↓
6. 画像統合・記事更新
   ↓
7. Git自動コミット・デプロイ
   ↓
8. 完了通知（Slack/Email）
```

### エラーハンドリングワークフロー
```
各ステップでのエラー検知
↓
自動リトライ（指数バックオフ）
↓
フォールバック処理
↓
管理者通知
↓
手動介入ポイント明示
```

## 📋 sanity-edition資産活用計画

### 移植対象ファイル一覧

#### 🔄 **即座移植（高優先）**
```
sanity-edition/scripts/
├── upload-from-json.js        → scripts/sanity/uploader.js
├── start-full-workflow.js     → scripts/claude/workflow-manager.js
├── quality-checker.js         → scripts/claude/quality-checker.js
├── integrate-current-article-safe.js → scripts/sanity/image-integrator.js
└── upload-article.js          → scripts/sanity/article-poster.js

sanity-edition/lib/
├── sanity.ts                   → config/sanity/client-config.js
├── sanity-image-upload.ts      → scripts/sanity/image-uploader.js
├── background-process-manager.ts → scripts/utils/process-manager.js
└── markdown-to-portable-text.ts → scripts/utils/content-converter.js

sanity-edition/
├── background-image-generator.py → scripts/stable-diffusion/image-generator.py
├── HIRO_PERSONA.md            → templates/personas/hiro-persona.md
├── HIRO_ARTICLE_STRUCTURE.md  → templates/personas/article-structure.md
└── MASTER_PROMPT_V2.md        → templates/prompts/master-prompt-split.md
```

#### 🔧 **適応移植（中優先）**
```
sanity-edition/app/api/
├── background-process/route.ts → scripts/utils/api-endpoints.js
├── quality-check/route.ts     → scripts/claude/quality-api.js
└── integrate-images/route.ts  → scripts/sanity/integration-api.js

sanity-edition/
├── image-generation-status.json → templates/configs/status-template.json
├── .env.local                  → .env.example（テンプレート化）
└── package.json               → package.json（依存関係抽出）
```

#### 📊 **参考活用（低優先）**
```
sanity-edition/
├── CLAUDE.md                   → docs/lessons-learned.md
├── PHASE1_COMPLETION_REPORT.md → docs/success-patterns.md
├── SAFE_IMAGE_INTEGRATION.md  → docs/best-practices.md
└── logs/                       → 参考ログパターン
```

### 設定・環境変数移植

#### **必須環境変数**
```bash
# Claude API
ANTHROPIC_API_KEY=

# Sanity CMS
SANITY_PROJECT_ID=
SANITY_DATASET=
SANITY_API_TOKEN=
SANITY_API_VERSION=

# Stable Diffusion
PYTHON_PATH=
SD_MODEL_PATH=
SD_OUTPUT_PATH=

# n8n
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=
N8N_BASIC_AUTH_PASSWORD=
```

#### **Sanity設定同期**
```javascript
// config/sanity/schema-sync.js
// sanity-edition/schemas/ から同期
- post.ts → post-schema.json
- author.ts → author-schema.json
- blockContent.ts → block-content-schema.json
```

## 🛠️ 実装フェーズ

### Phase 1: 基盤構築（1週間）
#### **目標**: n8n環境構築・基本スクリプト移植
```
Day 1-2: プロジェクト構造作成・n8n環境構築
Day 3-4: 核心スクリプト移植（Claude統合・Sanity投稿）
Day 5-7: 基本ワークフロー作成・テスト
```

#### **成果物**
- [ ] Docker環境構築完了
- [ ] n8n起動・基本設定完了
- [ ] Claude記事生成n8nノード作成
- [ ] Sanity投稿n8nノード作成
- [ ] 最小限ワークフローで記事生成成功

### Phase 2: 画像統合・自動化（1週間）
#### **目標**: Stable Diffusion統合・完全自動化
```
Day 8-10: Stable Diffusion統合・並列処理実装
Day 11-12: 画像統合・記事更新ワークフロー
Day 13-14: エラーハンドリング・監視機能
```

#### **成果物**
- [ ] 画像生成並列処理ワークフロー
- [ ] 自動画像統合機能
- [ ] エラー時自動リトライ・通知
- [ ] 完全自動ワークフロー動作確認

### Phase 3: 最適化・運用準備（1週間）
#### **目標**: 運用レベル品質・監視・スケーラビリティ
```
Day 15-17: 品質チェック・最適化
Day 18-19: 監視・ログ・通知システム
Day 20-21: ドキュメント・テスト・本格稼働
```

#### **成果物**
- [ ] 品質保証システム統合
- [ ] 監視・アラート・ダッシュボード
- [ ] スケジュール実行・大量処理対応
- [ ] 運用マニュアル・トラブルシューティング

## 🔧 技術要件

### システム要件
- **OS**: macOS/Linux（Docker対応）
- **メモリ**: 8GB以上（画像生成並列実行）
- **ストレージ**: 20GB以上（モデル・画像保存）
- **GPU**: 推奨（Stable Diffusion高速化）

### ソフトウェア要件
- **Docker**: 最新版
- **Node.js**: 18.x以上
- **Python**: 3.10.x
- **n8n**: 1.0以上

### API・サービス要件
- **Claude API**: Anthropic APIキー
- **Sanity CMS**: 既存プロジェクト継続利用
- **Stable Diffusion**: ローカルモデル

## 📊 品質保証

### テスト戦略
```
Unit Tests:
- 個別スクリプト機能テスト
- API統合テスト
- データ変換テスト

Integration Tests:
- ワークフロー全体テスト
- エラー処理テスト
- パフォーマンステスト

E2E Tests:
- 実際の記事生成テスト
- 品質チェック・検証
- 本番環境模擬テスト
```

### 品質指標
- **成功率**: 95%以上
- **実行時間**: 20分以内
- **品質スコア**: 80/100以上
- **エラー復旧**: 自動復旧90%以上

## 🚀 デプロイメント

### 環境構成
```
Development:
- ローカルDocker環境
- 開発用Sanityデータセット
- テスト用Stable Diffusionモデル

Production:
- 本番Docker環境
- 本番Sanityプロジェクト
- 高品質Stable Diffusionモデル
```

### CI/CD
```
Git Hooks:
- pre-commit: Lint・テスト実行
- pre-push: Integration Test

Automated Deployment:
- Docker image自動ビルド
- n8nワークフロー自動デプロイ
- 設定ファイル同期
```

## 📈 運用・監視

### 監視項目
- **ワークフロー実行状況**: 成功/失敗/実行時間
- **リソース使用量**: CPU/メモリ/ディスク
- **API使用量**: Claude/Sanity/外部サービス
- **品質指標**: 記事品質スコア・画像品質

### アラート設定
- **ワークフロー失敗**: 即座通知
- **リソース逼迫**: 警告通知
- **API制限**: 事前警告
- **品質低下**: 品質閾値下回り時

### ダッシュボード
- **実行統計**: 成功率・実行時間・スループット
- **品質トレンド**: 記事品質・画像品質の推移
- **リソース状況**: システム負荷・容量状況
- **エラー分析**: エラー種別・頻度・対処状況

## 🔄 移行計画

### 段階的移行戦略
```
Phase A: 並行運用（2週間）
- sanity-edition: 継続運用
- ContentFlow-N8N: 開発・テスト
- 品質・機能比較検証

Phase B: 部分移行（2週間）
- 定期記事: ContentFlow-N8N
- 実験記事: sanity-edition
- 運用ノウハウ蓄積

Phase C: 完全移行（1週間）
- 全記事生成: ContentFlow-N8N
- sanity-edition: バックアップ・緊急用
- 運用体制確立
```

### リスク軽減策
- **ロールバック準備**: sanity-edition即座復旧可能
- **データバックアップ**: 移行前完全バックアップ
- **段階的移行**: 急激な変更回避
- **監視強化**: 移行期間中の徹底監視

## 📋 成果・効果測定

### 定量効果
| 指標 | 現在 | 目標 | 改善率 |
|------|------|------|--------|
| 実行時間 | 30分（手動含む） | 15分（完全自動） | 50%削減 |
| 人的工数 | 15分/記事 | 0分/記事 | 100%削減 |
| 成功率 | 85% | 95%以上 | 12%向上 |
| 月間記事数 | 4記事 | 20記事 | 5倍増加 |

### 定性効果
- **運用負荷削減**: 手動監視・介入の削除
- **品質安定化**: 自動品質チェック・一貫性確保
- **スケーラビリティ**: 大量記事生成対応
- **技術習得**: n8n・ワークフロー自動化スキル

## 🔚 プロジェクト完了条件

### 必須条件
- [ ] 完全自動ワークフロー実装完了
- [ ] sanity-edition同等以上の品質確保
- [ ] 95%以上の成功率達成
- [ ] 運用マニュアル・ドキュメント完備

### 成功条件
- [ ] 月20記事自動生成達成
- [ ] 運用コスト50%以上削減
- [ ] 他プロジェクトへの横展開可能
- [ ] コミュニティ・事例として公開可能

## 📚 参考資料

### 技術ドキュメント
- [n8n公式ドキュメント](https://docs.n8n.io/)
- [Sanity CMS API](https://www.sanity.io/docs/api)
- [Claude API](https://docs.anthropic.com/)
- [Stable Diffusion](https://github.com/CompVis/stable-diffusion)

### ContentFlow関連
- `sanity-edition/CLAUDE.md`: 開発履歴・技術課題
- `sanity-edition/PHASE1_COMPLETION_REPORT.md`: 成功パターン
- `sanity-edition/SAFE_IMAGE_INTEGRATION.md`: 画像統合ベストプラクティス

---

**📝 作成日**: 2025-01-27  
**🎯 プロジェクト期間**: 3週間  
**👥 担当**: Claude Code + 人的監督  
**🔄 更新**: 実装進捗に応じて随時更新  