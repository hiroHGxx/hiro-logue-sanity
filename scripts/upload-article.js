#!/usr/bin/env node
/**
 * ContentFlow V2 - Sanity記事投稿スクリプト
 * 既存のupload-from-json.jsをラップしてstart-full-workflow.jsから呼び出し可能にする
 */

// 環境変数読み込み
require('dotenv').config({ path: '.env.local' });

const path = require('path');
const { uploadFromJson } = require('../upload-from-json');

/**
 * 記事データを受け取ってSanityに投稿（Phase A: 最小限データのみ）
 * @param {string} articleFilePath - 記事JSONファイルのパス
 * @param {Object} options - 投稿オプション
 * @returns {Promise<Object>} - 投稿結果
 */
async function uploadArticle(articleFilePath, options = {}) {
  const fs = require('fs').promises;
  
  try {
    console.log('🔄 Sanity記事投稿開始...');
    console.log(`📄 対象ファイル: ${articleFilePath}`);
    
    // Phase A対応: 最小限データモードの場合
    if (options.phaseA) {
      console.log('⚡ Phase A モード: 最小限データで投稿');
      return await uploadMinimalArticle(articleFilePath);
    }
    
    // ペイロードサイズ監視
    const rawData = await fs.readFile(articleFilePath, 'utf-8');
    const payloadSize = Buffer.byteLength(rawData, 'utf-8');
    const payloadSizeMB = (payloadSize / 1024 / 1024).toFixed(2);
    
    console.log(`📊 ペイロードサイズ: ${payloadSize} bytes (${payloadSizeMB} MB)`);
    
    // サイズ制限チェック
    if (payloadSize > 2 * 1024 * 1024) { // 2MB
      console.warn(`⚠️ ペイロードサイズ制限超過: ${payloadSizeMB}MB > 2MB`);
      console.log('🔄 自動的にPhase Aモードで再試行...');
      return await uploadMinimalArticle(articleFilePath);
    }
    
    // 通常の投稿処理
    const result = await uploadFromJson(articleFilePath);
    
    console.log('✅ Sanity記事投稿完了');
    return result;
    
  } catch (error) {
    console.error(`❌ 記事投稿エラー: ${error.message}`);
    
    // エラーがペイロードサイズ関連の場合、Phase Aモードで再試行
    if (error.message.includes('payload') || error.message.includes('size') || error.message.includes('too large')) {
      console.log('🔄 ペイロードサイズエラー検出 - Phase Aモードで再試行...');
      try {
        return await uploadMinimalArticle(articleFilePath);
      } catch (retryError) {
        console.error(`❌ Phase A再試行も失敗: ${retryError.message}`);
        throw retryError;
      }
    }
    
    throw error;
  }
}

/**
 * 最小限データでの記事投稿（Phase A）
 * @param {string} articleFilePath - 記事JSONファイルのパス
 * @returns {Promise<Object>} - 投稿結果
 */
async function uploadMinimalArticle(articleFilePath) {
  const fs = require('fs').promises;
  const path = require('path');
  
  try {
    console.log('⚡ Phase A: 最小限データ投稿開始...');
    
    // 元データ読み込み
    const rawData = await fs.readFile(articleFilePath, 'utf-8');
    const fullData = JSON.parse(rawData);
    
    // 最小限データのみ抽出
    const minimalData = {
      metadata: {
        sessionId: fullData.metadata?.sessionId || 'phase-a',
        createdAt: fullData.metadata?.createdAt || new Date().toISOString(),
        version: '2.0-phase-a'
      },
      article: {
        title: fullData.article.title,
        body: fullData.article.body,
        slug: fullData.article.slug,
        categories: fullData.article.categories || [],
        excerpt: fullData.article.excerpt || ''
      }
      // imagePromptsは除外してペイロードサイズを削減
    };
    
    // 一時ファイル作成
    const timestamp = Date.now();
    const tempDir = path.dirname(articleFilePath);
    const tempFilePath = path.join(tempDir, `temp-minimal-${timestamp}.json`);
    
    await fs.writeFile(tempFilePath, JSON.stringify(minimalData, null, 2), 'utf-8');
    
    const minimalSize = Buffer.byteLength(JSON.stringify(minimalData), 'utf-8');
    const minimalSizeMB = (minimalSize / 1024 / 1024).toFixed(2);
    console.log(`📊 Phase A ペイロードサイズ: ${minimalSize} bytes (${minimalSizeMB} MB)`);
    
    // 投稿実行
    const result = await uploadFromJson(tempFilePath);
    
    // 一時ファイル削除
    try {
      await fs.unlink(tempFilePath);
    } catch (unlinkError) {
      console.warn(`⚠️ 一時ファイル削除失敗: ${unlinkError.message}`);
    }
    
    console.log('✅ Phase A 投稿完了（画像プロンプトは別途処理）');
    
    // 画像プロンプトをローカル保存
    if (fullData.imagePrompts && fullData.imagePrompts.length > 0) {
      const imagePromptsFile = path.join(tempDir, `image-prompts-${fullData.metadata?.sessionId || timestamp}.json`);
      await fs.writeFile(imagePromptsFile, JSON.stringify({
        sessionId: fullData.metadata?.sessionId,
        documentId: result.documentId,
        imagePrompts: fullData.imagePrompts
      }, null, 2), 'utf-8');
      console.log(`💾 画像プロンプト保存: ${path.basename(imagePromptsFile)}`);
    }
    
    return result;
    
  } catch (error) {
    console.error(`❌ Phase A 投稿エラー: ${error.message}`);
    throw error;
  }
}

/**
 * 記事データオブジェクトを受け取って一時ファイル経由で投稿
 * @param {Object} articleData - 記事データオブジェクト
 * @param {string} tempDir - 一時ファイル保存ディレクトリ
 * @returns {Promise<Object>} - 投稿結果
 */
async function uploadArticleFromData(articleData, tempDir = '/tmp') {
  const fs = require('fs').promises;
  
  try {
    console.log('🔄 記事データからSanity投稿開始...');
    
    // 一時ファイル作成
    const timestamp = Date.now();
    const tempFilePath = path.join(tempDir, `temp-article-${timestamp}.json`);
    
    // データを一時ファイルに書き込み
    await fs.writeFile(tempFilePath, JSON.stringify(articleData, null, 2), 'utf-8');
    console.log(`📄 一時ファイル作成: ${tempFilePath}`);
    
    // 投稿実行
    const result = await uploadArticle(tempFilePath);
    
    // 一時ファイル削除
    try {
      await fs.unlink(tempFilePath);
      console.log('🗑️  一時ファイル削除完了');
    } catch (unlinkError) {
      console.warn(`⚠️ 一時ファイル削除失敗: ${unlinkError.message}`);
    }
    
    return result;
    
  } catch (error) {
    console.error(`❌ 記事データ投稿エラー: ${error.message}`);
    throw error;
  }
}

/**
 * 環境チェック
 */
function checkEnvironment() {
  const requiredEnvVars = ['SANITY_API_TOKEN'];
  const missingVars = [];
  
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missingVars.push(envVar);
    }
  }
  
  if (missingVars.length > 0) {
    throw new Error(`必須環境変数が不足: ${missingVars.join(', ')}`);
  }
  
  console.log('✅ 環境変数チェック完了');
}

/**
 * メイン実行（CLI使用時）
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('📄 ContentFlow V2 - Sanity記事投稿スクリプト');
    console.log('');
    console.log('使用方法:');
    console.log('  node scripts/upload-article.js [JSONファイルパス]');
    console.log('');
    console.log('例:');
    console.log('  node scripts/upload-article.js articles/article-20250711-160000.json');
    console.log('');
    process.exit(0);
  }
  
  const articleFilePath = args[0];
  
  try {
    // 環境チェック
    checkEnvironment();
    
    console.log('🚀 記事投稿プロセス開始');
    console.log(`🕐 開始時刻: ${new Date().toLocaleString()}`);
    
    // 投稿実行
    const result = await uploadArticle(articleFilePath);
    
    console.log('\n🎉 記事投稿プロセス完了!');
    console.log(`📄 Document ID: ${result.documentId}`);
    console.log(`🔗 Slug: ${result.slug}`);
    console.log(`🌐 公開URL: ${result.publicUrl}`);
    console.log(`🕐 完了時刻: ${new Date().toLocaleString()}`);
    
  } catch (error) {
    console.error('\n🚨 記事投稿プロセス失敗');
    console.error(`エラー: ${error.message}`);
    console.error(`🕐 エラー発生時刻: ${new Date().toLocaleString()}`);
    process.exit(1);
  }
}

// Node.js環境でのみ実行
if (require.main === module) {
  main();
}

module.exports = { 
  uploadArticle, 
  uploadMinimalArticle,
  uploadArticleFromData, 
  checkEnvironment 
};