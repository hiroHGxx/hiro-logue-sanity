# ContentFlow V2: 記事作成・画像生成一気通貫ワークフロー詳細設計書

## 📋 文書情報
- **作成日**: 2025-07-11
- **バージョン**: V2.0
- **対象システム**: ContentFlow Sanity版
- **設計方針**: 既存成功パターンの保持 + 段階的機能追加

---

## 🎯 1. プロジェクト概要・目標

### 1.1 プロジェクトの目的
**Claude Code自体による高品質記事生成 + Stable Diffusion画像生成の完全一気通貫ワークフロー実現**

### 1.2 解決する課題
- **既存の成功パターン保持**: 85/100品質・2000-2500文字記事生成の維持
- **画像生成統合**: テーマに基づいた4枚の高品質画像自動生成
- **Claude Codeタイムアウト制約**: 10分制限に対するバックグラウンド処理対応
- **運用効率化**: 1プロンプト実行による完全自動化

### 1.3 成功指標
- **記事品質**: 85/100以上（Hiro Persona完全準拠）
- **文字数**: 2000-2500文字
- **画像品質**: 1600×896プロ級ビジュアル4枚
- **実行時間**: 記事生成3-5分、画像生成15-20分（バックグラウンド可）
- **成功率**: 記事生成95%以上、画像生成90%以上

---

## 🏗️ 2. システム外部設計

### 2.1 システム境界
```
┌─────────────────────────────────────────────────────┐
│ ContentFlow V2 System                               │
│                                                     │
│ ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│ │ Claude Code │  │ Node.js     │  │ Python      │ │
│ │ AI Engine   │  │ Scripts     │  │ Stable      │ │
│ │             │  │             │  │ Diffusion   │ │
│ └─────────────┘  └─────────────┘  └─────────────┘ │
│                                                     │
└─────────────────────────────────────────────────────┘
              │                    │
              ▼                    ▼
    ┌─────────────┐      ┌─────────────┐
    │ Sanity CMS  │      │ Local Image │
    │             │      │ Storage     │
    └─────────────┘      └─────────────┘
```

### 2.2 外部システム連携
- **Sanity CMS**: 記事投稿・管理
- **Stable Diffusion**: ローカル画像生成
- **File System**: 中間ファイル管理・状態保存

### 2.3 ユーザーインターフェース
**入力**: Claude Codeチャットでのテーマ指定
```
ユーザー: "完全ワークフローを実行してください。テーマ: 'おとなになってからの学び直しについて'"
```

**出力**: 
- 記事公開URL
- 画像生成進捗状況
- エラー情報（該当時）

---

## 🔧 3. システム内部設計

### 3.1 アーキテクチャ概要
```
【Phase 1: AI主導記事生成】
User Request → Claude Code → HIRO_PERSONA.md読込 → 記事+画像プロンプト生成 → JSON出力

【Phase 2: スクリプト連携処理】
Claude Code → start-full-workflow.js実行 → 記事先行投稿 → 画像生成起動

【Phase 3: バックグラウンド画像処理】
background-image-generator.py → 4枚画像生成 → 状態更新 → 完了通知
```

### 3.2 責務分離設計

#### 3.2.1 Claude Code（AI）の責務
- **コンテンツ生成**: 高品質記事・画像プロンプト作成
- **ファイル操作**: JSON出力・スクリプト実行
- **ユーザー応答**: 進捗報告・完了通知

#### 3.2.2 Node.js Scripts の責務
- **オーケストレーション**: ワークフロー制御
- **Sanity連携**: 記事投稿・API呼び出し
- **状態管理**: 進捗・エラー状況の記録

#### 3.2.3 Python Scripts の責務
- **画像生成**: Stable Diffusion実行
- **バックグラウンド処理**: 長時間タスクの継続実行
- **状態更新**: 生成進捗の記録

### 3.3 データフロー設計
```
[User Input] → [AI記事生成] → [article-{timestamp}.json]
                                        ↓
[start-full-workflow.js] → [記事先行投稿] → [Sanity Document ID]
                                        ↓
[image-generation.json] → [background-image-generator.py] → [4枚画像]
                                        ↓
[状態更新] → [完了通知] → [User Response]
```

---

## 📡 4. API設計

### 4.1 内部API仕様

#### 4.1.1 ファイルベースAPI
**記事・画像プロンプトJSON構造**:
```json
{
  "metadata": {
    "sessionId": "article-{timestamp}",
    "theme": "ユーザー指定テーマ",
    "createdAt": "2025-07-11T16:00:00.000Z",
    "version": "2.0"
  },
  "article": {
    "title": "AIが生成したタイトル",
    "body": "## はじめに\n\n高品質なMarkdown記事本文...",
    "slug": "seo-optimized-slug",
    "categories": ["AI", "技術", "体験"],
    "excerpt": "記事の要約説明"
  },
  "imagePrompts": [
    {
      "position": "header",
      "prompt": "A peaceful cozy room representing {theme}, modern technology harmoniously integrated with natural elements, empty comfortable seating area, japanese minimalist interior design, warm atmosphere, professional photography",
      "negativePrompt": "person, people, human, man, woman, face, realistic human features, portrait, character, figure, text, watermark, blurry, lowres, bad anatomy",
      "style": "warm_minimal",
      "description": "温かみのあるミニマルスタイル",
      "parameters": {
        "width": 1600,
        "height": 896,
        "num_inference_steps": 25,
        "guidance_scale": 7.5
      }
    }
    // ... 4枚分
  ]
}
```

#### 4.1.2 状態管理API
**image-generation-status.json構造**:
```json
{
  "sessionId": "article-{timestamp}",
  "status": "generating|completed|failed",
  "sanityDocumentId": "VYus6nyHpjKB0SEJ05X1c6",
  "publishedUrl": "https://hiro-logue.vercel.app/blog/{slug}",
  "imageGeneration": {
    "startedAt": "2025-07-11T16:00:00.000Z",
    "total": 4,
    "completed": 2,
    "failed": 0,
    "variations": [
      {
        "position": "header",
        "filename": "header-warm_minimal-20250711_160054.png",
        "filepath": "public/images/blog/auto-generated/header-warm_minimal-20250711_160054.png",
        "status": "success",
        "generationTime": "172.63秒",
        "generatedAt": "2025-07-11T16:00:54.953661"
      }
      // ... 完了分
    ]
  },
  "backgroundProcess": {
    "pid": 33811,
    "startedAt": "2025-07-11T16:00:00.000Z"
  },
  "completedAt": "2025-07-11T16:15:00.000Z" // 完了時のみ
}
```

### 4.2 外部API連携

#### 4.2.1 Sanity CMS API
```javascript
// 記事投稿API呼び出し
const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  useCdn: false,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
});

const result = await sanityClient.create({
  _type: 'post',
  title: articleData.article.title,
  slug: { _type: 'slug', current: articleData.article.slug },
  body: portableTextBody,
  publishedAt: new Date().toISOString(),
  categories: articleData.article.categories
});
```

---

## 🗂️ 5. システム構成設計

### 5.1 ディレクトリ構造
```
sanity-edition/
├── articles/                          # 記事JSONファイル
│   ├── article-{timestamp}.json       # 記事・画像プロンプト
│   ├── article-{timestamp}-status.json # 投稿結果
│   └── processed/                     # 処理済みアーカイブ
├── scripts/                           # Node.jsスクリプト
│   ├── start-full-workflow.js         # メインオーケストレーター
│   ├── upload-article.js              # Sanity投稿機能
│   └── utils/                         # 共通ユーティリティ
├── lib/                               # TypeScript共通ライブラリ
│   ├── sanity-client.ts               # Sanity接続管理
│   ├── file-manager.ts                # ファイル操作
│   └── status-tracker.ts              # 状態管理
├── python/                            # Python画像生成
│   ├── background-image-generator.py   # メイン画像生成
│   ├── image-utils.py                 # 画像処理ユーティリティ
│   └── requirements.txt               # Python依存関係
├── public/images/blog/auto-generated/  # 生成画像保存
├── docs/                              # 設計・仕様書
│   ├── COMPLETE_WORKFLOW_V2_DESIGN.md  # 本設計書
│   ├── MASTER_PROMPT_V2.md            # 新マスタープロンプト
│   └── TROUBLESHOOTING.md             # トラブルシューティング
└── HIRO_PERSONA.md                    # ペルソナ定義（既存）
```

### 5.2 ファイル命名規則
```bash
# 記事関連
article-{YYYYMMDDHHmmss}.json         # メイン記事データ
article-{YYYYMMDDHHmmss}-status.json  # 処理状況
article-{YYYYMMDDHHmmss}-uploaded.json # 投稿結果

# 画像関連
{position}-{style}-{YYYYMMDDHHmmss}.png # 生成画像
image-generation-status.json           # 画像生成状況

# ログ関連
workflow-{YYYYMMDDHHmmss}.log         # ワークフローログ
background-generation.log              # バックグラウンド処理ログ
```

### 5.3 環境設定
```bash
# 必須環境変数
NEXT_PUBLIC_SANITY_PROJECT_ID=hbqm9iu5
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN={token}

# Python環境
PYTHON_PATH=/Users/gotohiro/Documents/user/Products/stable-diffusion-local/venv310/bin/python
MODEL_PATH=/Users/gotohiro/Documents/user/Products/AI/models/diffusers/juggernaut-xl

# システム設定
MAX_EXECUTION_MINUTES=8
IMAGE_OUTPUT_DIR=public/images/blog/auto-generated
ARTICLE_OUTPUT_DIR=articles
```

---

## 🔄 6. ワークフロー詳細設計

### 6.1 Phase 1: AI主導記事生成（同期処理）

#### 6.1.1 入力・前提条件
- **ユーザー入力**: テーマ文字列
- **参照ファイル**: `HIRO_PERSONA.md`, `HIRO_ARTICLE_STRUCTURE.md`
- **実行環境**: Claude Code Write tool使用可能

#### 6.1.2 処理フロー
```
1. テーマ受信・解析
   ↓
2. HIRO_PERSONA.md読み込み・内容理解
   ↓
3. 記事構成計画（はじめに・本文・おわりに）
   ↓
4. 高品質記事本文生成（2000-2500文字）
   ↓
5. SEO最適化スラッグ生成
   ↓
6. 画像配置戦略立案
   ↓
7. 4つの画像プロンプト生成（position別）
   ↓
8. 統合JSONファイル出力（Write tool）
```

#### 6.1.3 品質保証条件
- **文字数**: 2000-2500文字
- **構成**: はじめに・メイン3セクション・おわりに
- **Hiro特徴**: 家族話・穏やか敬語・読者問いかけ
- **画像整合性**: テーマとの一貫性・人物描画防止

### 6.2 Phase 2: スクリプト連携処理（同期処理）

#### 6.2.1 start-full-workflow.js仕様
```javascript
// メイン処理フロー
async function executeFullWorkflow() {
  try {
    // 1. 最新記事JSONファイル検索
    const latestArticleFile = findLatestArticleFile();
    
    // 2. 記事データ読み込み・検証
    const articleData = await loadAndValidateArticle(latestArticleFile);
    
    // 3. Sanity記事先行投稿
    const sanityResult = await uploadArticleToSanity(articleData.article);
    
    // 4. 画像生成状態ファイル初期化
    await initializeImageGenerationStatus(articleData, sanityResult);
    
    // 5. バックグラウンド画像生成起動
    const backgroundProcess = await startBackgroundImageGeneration();
    
    // 6. 状態更新・ユーザー応答
    await updateWorkflowStatus('article_published', {
      sanityDocumentId: sanityResult._id,
      publishedUrl: `https://hiro-logue.vercel.app/blog/${articleData.article.slug}`,
      backgroundPid: backgroundProcess.pid
    });
    
    console.log('✅ 記事投稿完了・画像生成開始');
    return { success: true, ...sanityResult };
    
  } catch (error) {
    await handleWorkflowError(error);
    throw error;
  }
}
```

#### 6.2.2 エラーハンドリング設計
```javascript
// 段階別エラー処理
const errorHandlers = {
  file_not_found: async (error) => {
    console.error('❌ 記事JSONファイルが見つかりません');
    // Claude Codeに再生成要求
  },
  
  validation_failed: async (error) => {
    console.error('❌ 記事データ検証失敗:', error.details);
    // 検証項目詳細出力
  },
  
  sanity_upload_failed: async (error) => {
    console.error('❌ Sanity投稿失敗:', error.message);
    // リトライ機構・手動投稿ガイド
  },
  
  background_start_failed: async (error) => {
    console.error('❌ バックグラウンド処理開始失敗');
    // 画像生成スキップして記事のみ完了
  }
};
```

### 6.3 Phase 3: バックグラウンド画像処理（非同期処理）

#### 6.3.1 background-image-generator.py仕様
```python
class BackgroundImageGenerator:
    def __init__(self):
        self.status_file = "image-generation-status.json"
        self.model_path = os.getenv("MODEL_PATH")
        self.pipeline = None
    
    async def execute_generation_workflow(self):
        """メイン画像生成ワークフロー"""
        try:
            # 1. 状態ファイル読み込み
            status_data = await self.load_status()
            
            # 2. Stable Diffusion パイプライン初期化
            self.pipeline = await self.initialize_pipeline()
            
            # 3. 4枚画像順次生成
            for prompt_config in status_data['imagePrompts']:
                await self.generate_single_image(prompt_config)
                await self.update_progress(prompt_config)
            
            # 4. 完了処理・状態更新
            await self.finalize_generation()
            
        except Exception as error:
            await self.handle_generation_error(error)
    
    async def generate_single_image(self, prompt_config):
        """個別画像生成"""
        start_time = time.time()
        
        # 画像生成実行
        image = self.pipeline(
            prompt=prompt_config['prompt'],
            negative_prompt=prompt_config['negativePrompt'],
            **prompt_config['parameters']
        ).images[0]
        
        # ファイル保存
        filename = f"{prompt_config['position']}-{prompt_config['style']}-{timestamp}.png"
        filepath = os.path.join(IMAGE_OUTPUT_DIR, filename)
        image.save(filepath)
        
        # 結果記録
        generation_time = time.time() - start_time
        return {
            'filename': filename,
            'filepath': filepath,
            'generationTime': f"{generation_time:.2f}秒",
            'status': 'success'
        }
```

---

## 🛡️ 7. 品質保証・テスト設計

### 7.1 段階別テスト戦略

#### 7.1.1 Unit Test（単体テスト）
```bash
# 各コンポーネント個別テスト
npm test scripts/upload-article.test.js     # Sanity投稿機能
npm test lib/file-manager.test.js           # ファイル操作
python -m pytest python/test_image_gen.py  # 画像生成機能
```

#### 7.1.2 Integration Test（統合テスト）
```bash
# Phase単位での統合テスト
node scripts/test-article-generation.js    # Phase 1テスト
node scripts/test-full-workflow.js         # Phase 2テスト
python python/test-background-process.py   # Phase 3テスト
```

#### 7.1.3 End-to-End Test（E2Eテスト）
```bash
# 完全ワークフローテスト
node scripts/e2e-workflow-test.js --theme "テストテーマ"
# 期待結果: 記事投稿 + 4枚画像生成 + 状態管理
```

### 7.2 品質メトリクス
```javascript
// 自動品質評価システム
const qualityMetrics = {
  article: {
    wordCount: { min: 2000, max: 2500, weight: 0.3 },
    hiroPersona: { score: 0.8, weight: 0.3 },
    structure: { sections: 5, weight: 0.2 },
    engagement: { questions: 2, weight: 0.2 }
  },
  images: {
    resolution: { expected: "1600x896", weight: 0.3 },
    humanDetection: { allowed: false, weight: 0.4 },
    themeConsistency: { score: 0.8, weight: 0.3 }
  },
  workflow: {
    articleSuccess: { rate: 0.95, weight: 0.4 },
    imageSuccess: { rate: 0.90, weight: 0.4 },
    totalTime: { max: 1800, weight: 0.2 } // 30分
  }
};
```

---

## 🚨 8. エラーハンドリング・復旧設計

### 8.1 エラー分類・対応マトリクス

| エラーカテゴリ | 発生フェーズ | 自動復旧 | 手動介入 | 影響度 |
|---|---|---|---|---|
| 記事生成失敗 | Phase 1 | ❌ | ✅ | 高 |
| ファイル出力失敗 | Phase 1 | ✅ | ✅ | 高 |
| Sanity投稿失敗 | Phase 2 | ✅ | ✅ | 中 |
| 画像生成失敗 | Phase 3 | ✅ | ✅ | 低 |
| バックグラウンド異常終了 | Phase 3 | ✅ | ✅ | 低 |

### 8.2 復旧シナリオ設計

#### 8.2.1 記事生成失敗時
```bash
1. エラー詳細をログ出力
2. Claude Codeに再実行要求
3. 3回失敗で手動介入エスカレーション
```

#### 8.2.2 Sanity投稿失敗時
```bash
1. 自動リトライ（3回まで）
2. 認証・ネットワーク確認
3. 手動投稿用JSONファイル保持
4. エラー詳細をユーザーに報告
```

#### 8.2.3 画像生成失敗時
```bash
1. 失敗画像のみ再生成
2. 状態ファイル更新継続
3. 部分的成功でも記事公開維持
4. 後日画像追加可能な設計
```

---

## 📈 9. 運用・監視設計

### 9.1 ログ管理設計
```bash
# ログファイル構成
logs/
├── workflow-{YYYYMMDD}.log           # 日次ワークフローログ
├── article-generation-{session}.log  # 記事生成詳細
├── image-generation-{session}.log    # 画像生成詳細
└── error-{YYYYMMDD}.log              # エラー専用ログ

# ログ出力形式
[2025-07-11 16:00:00] [INFO] [Phase1] 記事生成開始: テーマ=おとなになってからの学び直し
[2025-07-11 16:02:15] [SUCCESS] [Phase1] 記事生成完了: 2,347文字
[2025-07-11 16:02:20] [INFO] [Phase2] Sanity投稿開始
[2025-07-11 16:02:45] [SUCCESS] [Phase2] Sanity投稿完了: ID=VYus6nyHpjKB0SEJ05X1c6
```

### 9.2 監視・アラート設計
```javascript
// 監視項目
const monitoringTargets = {
  performance: {
    articleGenerationTime: { threshold: 300 }, // 5分
    sanityUploadTime: { threshold: 60 },       // 1分
    imageGenerationTime: { threshold: 1800 }   // 30分
  },
  
  quality: {
    articleWordCount: { min: 2000, max: 2500 },
    imageResolution: { expected: "1600x896" },
    humanDetectionInImages: { allowed: false }
  },
  
  reliability: {
    workflowSuccessRate: { threshold: 0.95 },
    backgroundProcessHealth: { checkInterval: 300 }
  }
};
```

---

## 🗃️ 10. データ管理・バックアップ設計

### 10.1 データ分類・保持ポリシー
```bash
# Hot Data（アクティブ処理中）
articles/article-{timestamp}.json     # 30日保持
image-generation-status.json          # セッション完了まで

# Warm Data（処理完了・参照可能）
articles/processed/                   # 1年保持
public/images/blog/auto-generated/    # 永続保持
logs/                                 # 6ヶ月保持

# Cold Data（アーカイブ）
archives/{YYYY}/{MM}/                 # 長期保管
```

### 10.2 バックアップ戦略
```bash
# 日次バックアップ
#!/bin/bash
# daily-backup.sh
DATE=$(date +%Y%m%d)
tar -czf backups/contentflow-${DATE}.tar.gz \
  articles/ \
  public/images/blog/ \
  logs/ \
  docs/

# リモートバックアップ（オプション）
# rsync -av backups/ user@backup-server:/contentflow-backups/
```

---

## 🔧 11. 実装フェーズ計画

### 11.1 Phase 1: 記事生成復活（最優先）
**期間**: 2-3時間
**目標**: 既存品質レベルの記事生成完全復活

```bash
✅ 実装項目:
1. MASTER_PROMPT_V2.md作成
2. scripts/start-full-workflow.js基本版
3. scripts/upload-article.js（既存改修）
4. 品質評価システム復活
5. E2Eテスト実行・検証

🎯 成功基準:
- 2000-2500文字記事生成
- Hiro Persona完全適用
- Sanity投稿成功率95%以上
```

### 11.2 Phase 2: 画像統合（段階的追加）
**期間**: 4-5時間
**目標**: 画像プロンプト生成・バックグラウンド処理統合

```bash
✅ 実装項目:
1. 画像プロンプト生成機能追加
2. background-image-generator.py改修
3. 状態管理システム統合
4. エラーハンドリング強化
5. 画像品質評価システム

🎯 成功基準:
- 4枚高品質画像自動生成
- バックグラウンド処理安定動作
- 人物描画完全防止
```

### 11.3 Phase 3: 運用最適化（継続改善）
**期間**: 継続的
**目標**: 安定運用・品質向上・機能拡張

```bash
✅ 実装項目:
1. 監視・ログシステム充実
2. 自動品質評価システム
3. エラー復旧自動化
4. パフォーマンス最適化
5. 新機能追加（動画・音声等）
```

---

## 📚 12. 付録・参考資料

### 12.1 関連ファイル一覧
```bash
# 設計・仕様書
COMPLETE_WORKFLOW_V2_DESIGN.md        # 本設計書
MASTER_PROMPT_V2.md                   # 新マスタープロンプト
HIRO_PERSONA.md                       # ペルソナ定義
TROUBLESHOOTING.md                    # トラブルシューティング

# 実装ファイル
scripts/start-full-workflow.js        # メインオーケストレーター
scripts/upload-article.js             # Sanity投稿
python/background-image-generator.py  # 画像生成
lib/file-manager.ts                   # ファイル操作
lib/status-tracker.ts                 # 状態管理
```

### 12.2 外部依存関係
```bash
# Node.js依存関係
@sanity/client: Sanity CMS接続
fs/promises: ファイル操作
child_process: Python実行

# Python依存関係
diffusers: Stable Diffusion
torch: ディープラーニング
PIL: 画像処理
```

### 12.3 設定・環境要件
```bash
# システム要件
OS: macOS (Apple Silicon推奨)
Node.js: v20.11.0以上
Python: 3.10以上
GPU: Metal Performance Shaders対応

# ストレージ要件
記事データ: 100MB/月
画像データ: 2GB/月
ログデータ: 500MB/月
```

---

## ✅ 13. 設計検証チェックリスト

### 13.1 機能要件検証
- [ ] 2000-2500文字高品質記事生成
- [ ] Hiro Persona完全適用
- [ ] 4枚テーマ連動画像生成
- [ ] Claude Codeタイムアウト対応
- [ ] 1プロンプト完全自動化

### 13.2 非機能要件検証
- [ ] 記事生成成功率95%以上
- [ ] 画像生成成功率90%以上
- [ ] バックグラウンド処理安定性
- [ ] エラーハンドリング完全性
- [ ] 運用監視システム

### 13.3 技術的整合性検証
- [ ] 既存成功パターンの保持
- [ ] 段階的実装による安全性
- [ ] 責務分離の明確性
- [ ] スケーラビリティの確保
- [ ] 保守性・拡張性の考慮

---

**文書作成者**: Claude Code  
**作成日時**: 2025-07-11 16:30  
**承認**: Gemini検証待ち  
**次回更新**: 実装開始後、知見に基づく改訂