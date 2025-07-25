#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@sanity/client');
const fs = require('fs').promises;
const path = require('path');
const { safeImageIntegration, checkExistingImages } = require('../safe-image-integration');

// Sanity設定
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2023-05-03',
  useCdn: false
});

async function findLatestArticleFile() {
  console.log('🔍 最新記事ファイルを検索中...');
  
  try {
    const files = await fs.readdir('./articles');
    
    // 記事ファイルをフィルタリング（新形式のみ対象）
    const articleFiles = [];
    
    for (const file of files) {
      if ((file.startsWith('article-') || file === 'new-article.json') && 
          file.endsWith('.json') && 
          !file.includes('-status') && 
          !file.includes('-uploaded')) {
        
        try {
          const filePath = path.join('./articles', file);
          const data = JSON.parse(await fs.readFile(filePath, 'utf-8'));
          
          // 新しい形式（metadata + article + imagePrompts）のみ対象
          if (data.metadata && data.article && data.article.title) {
            const stats = await fs.stat(filePath);
            articleFiles.push({
              file,
              filePath,
              createdAt: data.metadata.createdAt || stats.mtime.toISOString(),
              mtime: stats.mtime,
              data
            });
          }
        } catch (error) {
          console.warn(`⚠️ ファイル ${file} をスキップ: ${error.message}`);
        }
      }
    }
    
    if (articleFiles.length === 0) {
      throw new Error('有効な記事ファイルが見つかりません');
    }
    
    // 作成日時でソートして最新を取得
    articleFiles.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const latest = articleFiles[0];
    
    console.log(`📄 最新記事ファイル: ${latest.file}`);
    console.log(`📅 作成日時: ${latest.createdAt}`);
    
    return latest;
    
  } catch (error) {
    throw new Error(`記事ファイル検索エラー: ${error.message}`);
  }
}

async function findArticleInSanity(slug) {
  console.log(`🔍 Sanity内で記事を検索: ${slug}`);
  
  const posts = await client.fetch(`
    *[_type == "post" && slug.current == $slug] {
      _id,
      title,
      slug,
      publishedAt,
      _createdAt
    }
  `, { slug });
  
  if (posts.length === 0) {
    throw new Error(`記事が見つかりません: ${slug}`);
  }
  
  if (posts.length > 1) {
    console.warn(`⚠️ 同じスラッグの記事が複数見つかりました: ${posts.length}件`);
    posts.forEach((post, index) => {
      console.log(`  ${index + 1}. ${post._id} (作成: ${post._createdAt})`);
    });
    
    // 最新の記事を選択
    const latestPost = posts.sort((a, b) => new Date(b._createdAt) - new Date(a._createdAt))[0];
    console.log(`✅ 最新記事を選択: ${latestPost._id}`);
    return latestPost;
  }
  
  return posts[0];
}

async function archiveProcessedFile(filePath, sessionId) {
  try {
    console.log('\n📦 処理済みファイルのアーカイブ中...');
    
    // processed ディレクトリの確認・作成
    const processedDir = path.join('./articles', 'processed');
    try {
      await fs.access(processedDir);
    } catch {
      await fs.mkdir(processedDir, { recursive: true });
      console.log(`📁 processedディレクトリを作成: ${processedDir}`);
    }
    
    // アーカイブファイル名（sessionIdベース）
    const archiveFileName = `${sessionId}.json`;
    const archiveFilePath = path.join(processedDir, archiveFileName);
    
    // ファイル移動
    await fs.rename(filePath, archiveFilePath);
    
    console.log(`✅ ファイルアーカイブ完了: ${archiveFileName}`);
    console.log(`📂 アーカイブ先: articles/processed/`);
    
  } catch (error) {
    console.error(`❌ ファイルアーカイブエラー: ${error.message}`);
    console.log('⚠️ アーカイブ失敗 - 統合は正常完了');
  }
}

async function buildImageFilesPaths(sessionId) {
  console.log(`🖼️ 画像ファイルパスを構築: ${sessionId}`);
  
  const baseDir = `public/images/blog/auto-generated/${sessionId}`;
  
  try {
    await fs.access(baseDir);
  } catch (error) {
    throw new Error(`画像ディレクトリが見つかりません: ${baseDir}`);
  }
  
  const files = await fs.readdir(baseDir);
  console.log(`📁 ディレクトリ内ファイル数: ${files.length}`);
  
  // 最新の画像ファイルを自動検出
  const imageFiles = [];
  const positions = ['header', 'section1', 'section2', 'section3'];
  
  for (const position of positions) {
    const matchingFiles = files
      .filter(file => file.startsWith(position) && file.endsWith('.png'))
      .sort()
      .reverse(); // 最新のファイルを選択
    
    if (matchingFiles.length > 0) {
      const selectedFile = matchingFiles[0];
      imageFiles.push({
        position,
        filename: selectedFile,
        path: `${baseDir}/${selectedFile}`
      });
      console.log(`✅ ${position}: ${selectedFile}`);
    } else {
      console.warn(`⚠️ ${position}の画像が見つかりません`);
    }
  }
  
  if (imageFiles.length === 0) {
    throw new Error('統合可能な画像ファイルが見つかりません');
  }
  
  console.log(`📊 検出された画像: ${imageFiles.length}枚`);
  return imageFiles;
}

async function integrateCurrentArticleSafe() {
  console.log('🛡️ 安全な記事画像統合開始...');
  console.log('=====================================\n');
  
  try {
    // Step 1: 最新記事ファイルを取得
    const latestArticle = await findLatestArticleFile();
    const { data: articleData, filePath } = latestArticle;
    
    console.log(`📄 記事タイトル: ${articleData.article.title}`);
    console.log(`🔗 スラッグ: ${articleData.article.slug}`);
    console.log(`🎯 セッションID: ${articleData.metadata.sessionId}`);
    
    // Step 2: Sanity内で対応する記事を検索
    const sanityPost = await findArticleInSanity(articleData.article.slug);
    console.log(`🆔 Sanity記事ID: ${sanityPost._id}`);
    
    // Step 3: 画像ファイルパスを構築
    const imageFiles = await buildImageFilesPaths(articleData.metadata.sessionId);
    
    // Step 4: 安全な画像統合を実行
    console.log('\n🛡️ 安全性チェックと統合処理開始...');
    const result = await safeImageIntegration(
      articleData.metadata.sessionId,
      sanityPost._id,
      articleData.article.slug,
      imageFiles,
      {
        force: process.argv.includes('--force'),
        backup: true
      }
    );
    
    // Step 5: 結果報告
    console.log('\n📊 統合結果:');
    if (result.success) {
      if (result.skipped) {
        console.log('⏭️  統合がスキップされました');
        console.log('💡 理由: ユーザーによる選択またはリスク回避');
      } else if (result.cancelled) {
        console.log('❌ 統合がキャンセルされました');
        console.log('💡 理由: ユーザーによるキャンセル');
      } else {
        console.log('✅ 画像統合が正常に完了しました！');
        console.log(`📊 統合画像数: ${result.uploadedCount}枚`);
        console.log(`🔄 統合モード: ${result.mode}`);
        console.log(`🌐 記事URL: https://hiro-logue.vercel.app/blog/${articleData.article.slug}`);
        
        // 画像統合完了後にファイルアーカイブを実行
        await archiveProcessedFile(filePath, articleData.metadata.sessionId);
        
        if (result.backupPath) {
          console.log(`💾 バックアップ: ${result.backupPath}`);
        }
        
        // 成功時は uploadedマークファイルを作成
        const uploadedFilePath = filePath.replace('.json', '-uploaded.json');
        await fs.copyFile(filePath, uploadedFilePath);
        console.log(`📝 アップロード完了マーク作成: ${path.basename(uploadedFilePath)}`);
      }
    } else {
      console.error('❌ 画像統合に失敗しました');
      if (result.error) {
        console.error(`🔍 エラー詳細: ${result.error}`);
      }
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n💥 処理エラー:', error.message);
    console.error('🔍 スタックトレース:', error.stack);
    process.exit(1);
  }
}

// ヘルプ表示
function showHelp() {
  console.log(`
🛡️ 安全な記事画像統合ツール
============================

使用方法:
  node scripts/integrate-current-article-safe.js [オプション]

オプション:
  --force    既存画像チェックをスキップして強制実行
  --help     このヘルプを表示

機能:
  ✅ 最新記事ファイルの自動検出
  ✅ 既存画像の安全性チェック
  ✅ 重複画像の検出と対処法選択
  ✅ 自動バックアップ作成
  ✅ 段階的な統合処理
  ✅ 詳細な実行ログ

例:
  # 通常実行（安全性チェック有効）
  node scripts/integrate-current-article-safe.js

  # 強制実行（安全性チェックをスキップ）
  node scripts/integrate-current-article-safe.js --force
`);
}

// コマンドライン引数の処理
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showHelp();
  process.exit(0);
}

// スクリプト直接実行時のみメイン関数を呼び出し
if (require.main === module) {
  integrateCurrentArticleSafe().catch(console.error);
}

module.exports = {
  integrateCurrentArticleSafe,
  findLatestArticleFile,
  findArticleInSanity,
  buildImageFilesPaths
};