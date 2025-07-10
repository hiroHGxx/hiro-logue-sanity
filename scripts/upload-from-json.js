#!/usr/bin/env node

/**
 * upload-from-json.js
 * JSONファイルからSanity CMSに記事をアップロードするスクリプト
 * 
 * 使用方法:
 * node scripts/upload-from-json.js [json-file-path]
 * 
 * JSONファイルが指定されない場合は、articlesディレクトリ内の最新ファイルを使用
 */

const { createClient } = require('@sanity/client');
const fs = require('fs');
const path = require('path');

// Sanity クライアント設定
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2023-05-03'
});

/**
 * スラッグを生成する関数（フォールバック用）
 * 注意: 基本的にはJSONのslugフィールドを使用し、これは緊急時のフォールバック
 */
function generateSlug(title) {
  console.log('⚠️  Warning: Using fallback slug generation. JSON should contain slug field.');
  
  // よく使用される日本語キーワードの基本マッピング（完全ではない）
  const commonKeywordMap = {
    '技術': 'technology',
    'AI': 'ai',
    '家族': 'family',
    '子ども': 'children',
    'プログラミング': 'programming',
    '働き方': 'work',
    '日常': 'daily',
    '体験': 'experience',
    '学び': 'learning',
    '挑戦': 'challenge',
    'ゲーム': 'game',
    'ペット': 'pet'
  };
  
  let slug = title.toLowerCase();
  
  // 基本的なキーワード変換（部分的）
  for (const [japanese, english] of Object.entries(commonKeywordMap)) {
    slug = slug.replace(new RegExp(japanese, 'g'), english);
  }
  
  // 日本語文字・特殊文字を除去
  slug = slug
    .replace(/[^\w\s-]/g, '')     // 特殊文字を除去
    .replace(/\s+/g, '-')         // スペースをハイフンに
    .replace(/-+/g, '-')          // 連続するハイフンを単一に
    .replace(/^-+|-+$/g, '')      // 先頭末尾のハイフンを除去
    .trim();
  
  // フォールバック: タイムスタンプベースのスラッグ
  if (!slug || slug.length < 3) {
    const timestamp = Date.now().toString().slice(-6); // 一意性確保
    return `article-${timestamp}`;
  }
  
  return slug;
}

/**
 * 重複しないユニークなスラッグを生成
 */
async function generateUniqueSlug(title) {
  const baseSlug = generateSlug(title);
  
  // 既存の投稿をチェック
  const existingPosts = await client.fetch(
    `*[_type == "post" && slug.current match $slugPattern]`,
    { slugPattern: `${baseSlug}*` }
  );
  
  if (existingPosts.length === 0) {
    return baseSlug;
  }
  
  // 重複がある場合は番号を付ける
  let counter = 1;
  let uniqueSlug = `${baseSlug}-${counter}`;
  
  while (existingPosts.some(post => post.slug.current === uniqueSlug)) {
    counter++;
    uniqueSlug = `${baseSlug}-${counter}`;
  }
  
  return uniqueSlug;
}

/**
 * Markdownをブロック配列に変換（簡易版）
 */
function markdownToBlocks(markdown) {
  const lines = markdown.split('\n');
  const blocks = [];
  let currentParagraph = [];
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (!trimmedLine) {
      // 空行の場合、現在の段落を終了
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
    } else if (trimmedLine.startsWith('##')) {
      // 見出しの場合
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
          text: trimmedLine.replace(/^##\s*/, ''),
          marks: []
        }]
      });
    } else {
      // 通常のテキスト
      currentParagraph.push(trimmedLine);
    }
  }
  
  // 最後の段落を処理
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

/**
 * 最新のJSONファイルを取得
 */
function getLatestJsonFile() {
  const articlesDir = path.join(__dirname, '..', 'articles');
  
  if (!fs.existsSync(articlesDir)) {
    throw new Error(`Articles directory not found: ${articlesDir}`);
  }
  
  const files = fs.readdirSync(articlesDir)
    .filter(file => file.endsWith('.json'))
    .map(file => ({
      name: file,
      path: path.join(articlesDir, file),
      mtime: fs.statSync(path.join(articlesDir, file)).mtime
    }))
    .sort((a, b) => b.mtime - a.mtime);
  
  if (files.length === 0) {
    throw new Error('No JSON files found in articles directory');
  }
  
  return files[0].path;
}

/**
 * メイン実行関数
 */
async function main() {
  try {
    // JSONファイルパスを決定
    let jsonFilePath;
    if (process.argv[2]) {
      jsonFilePath = path.resolve(process.argv[2]);
    } else {
      jsonFilePath = getLatestJsonFile();
    }
    
    console.log(`📖 Reading JSON file: ${jsonFilePath}`);
    
    // JSONファイルを読み込み
    if (!fs.existsSync(jsonFilePath)) {
      throw new Error(`JSON file not found: ${jsonFilePath}`);
    }
    
    const jsonContent = fs.readFileSync(jsonFilePath, 'utf8');
    const articleData = JSON.parse(jsonContent);
    
    // 必須フィールドをチェック
    if (!articleData.title || !articleData.body) {
      throw new Error('JSON file must contain "title" and "body" fields');
    }
    
    console.log(`📝 Processing article: "${articleData.title}"`);
    
    // スラッグを決定（JSONに含まれている場合はそれを使用、ない場合は自動生成）
    let finalSlug;
    if (articleData.slug) {
      console.log(`📋 Using provided slug: ${articleData.slug}`);
      finalSlug = articleData.slug;
    } else {
      finalSlug = await generateUniqueSlug(articleData.title);
      console.log(`🔗 Generated slug: ${finalSlug}`);
    }
    
    // Markdownをブロック配列に変換
    const bodyBlocks = markdownToBlocks(articleData.body);
    
    // Sanity投稿データを構築
    const postData = {
      _type: 'post',
      title: articleData.title,
      slug: {
        _type: 'slug',
        current: finalSlug
      },
      body: bodyBlocks,
      publishedAt: new Date().toISOString(),
      categories: articleData.categories || ['AI', '技術'],
      excerpt: articleData.excerpt || `${articleData.title}について書いた記事です。技術と日常の体験から得た洞察を共有しています。`
    };
    
    // Sanityに投稿
    console.log('🚀 Uploading to Sanity...');
    const result = await client.create(postData);
    
    console.log('✅ Successfully uploaded to Sanity!');
    console.log(`📄 Document ID: ${result._id}`);
    console.log(`🌐 Article URL: https://hiro-logue.vercel.app/blog/${finalSlug}`);
    console.log(`📊 Word count: ${articleData.body.length} characters`);
    
    // 投稿が成功したらJSONファイルを processed フォルダに移動
    const processedDir = path.join(path.dirname(jsonFilePath), 'processed');
    if (!fs.existsSync(processedDir)) {
      fs.mkdirSync(processedDir, { recursive: true });
    }
    
    const processedPath = path.join(processedDir, path.basename(jsonFilePath));
    fs.renameSync(jsonFilePath, processedPath);
    console.log(`📦 Moved to processed: ${processedPath}`);
    
  } catch (error) {
    console.error('❌ Error uploading article:', error.message);
    process.exit(1);
  }
}

// 環境変数チェック
const requiredEnvVars = [
  'NEXT_PUBLIC_SANITY_PROJECT_ID',
  'NEXT_PUBLIC_SANITY_DATASET',
  'SANITY_API_TOKEN'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

// スクリプト実行
if (require.main === module) {
  main();
}

module.exports = { generateUniqueSlug, markdownToBlocks };