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
 * 記事データを受け取ってSanityに投稿
 * @param {string} articleFilePath - 記事JSONファイルのパス
 * @returns {Promise<Object>} - 投稿結果
 */
async function uploadArticle(articleFilePath) {
  try {
    console.log('🔄 Sanity記事投稿開始...');
    console.log(`📄 対象ファイル: ${articleFilePath}`);
    
    // 既存のuploadFromJson関数を呼び出し
    const result = await uploadFromJson(articleFilePath);
    
    console.log('✅ Sanity記事投稿完了');
    return result;
    
  } catch (error) {
    console.error(`❌ 記事投稿エラー: ${error.message}`);
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
  uploadArticleFromData, 
  checkEnvironment 
};