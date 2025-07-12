#!/usr/bin/env node
/**
 * JSON記事データからSanity投稿スクリプト
 * マスタープロンプトシステムで生成されたJSONファイルをSanityに自動投稿
 */

// 環境変数読み込み
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@sanity/client');
const fs = require('fs');
const path = require('path');

// Sanityクライアント設定
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'hbqm9iu5',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
});

/**
 * 日本語キーワード→英語マッピング（SEO最適化）
 */
const commonKeywordMap = {
  '技術': 'technology',
  'AI': 'ai',
  '人工知能': 'artificial-intelligence',
  '家族': 'family',
  '子ども': 'children',
  '日常': 'daily-life',
  '体験': 'experience',
  '学び': 'learning',
  '発見': 'discovery',
  'プログラミング': 'programming',
  '開発': 'development',
  '仕事': 'work',
  '効率': 'efficiency',
  '時間': 'time',
  '管理': 'management',
  'ツール': 'tools',
  'アプリ': 'app',
  'サービス': 'service',
  '変化': 'change',
  '成長': 'growth',
  '挑戦': 'challenge',
  '失敗': 'failure',
  '成功': 'success',
  'コミュニケーション': 'communication',
  '在宅': 'remote-work',
  'テレワーク': 'telework',
  '効率化': 'optimization',
  '自動化': 'automation',
  'デジタル': 'digital',
  'オンライン': 'online',
  'クラウド': 'cloud',
  'セキュリティ': 'security',
  'データ': 'data',
  '分析': 'analysis',
  '最適化': 'optimization',
  'UI': 'ui',
  'UX': 'ux',
  'デザイン': 'design',
  'ユーザー': 'user',
  '体験談': 'story',
  '感想': 'thoughts',
  '考察': 'consideration',
  '洞察': 'insights'
};

/**
 * ユニークスラッグ生成
 */
async function generateUniqueSlug(title) {
  // 基本スラッグ作成
  let baseSlug = title.toLowerCase()
    .replace(/[^\w\s\-]/g, '') // 特殊文字除去
    .replace(/\s+/g, '-')      // スペース→ハイフン
    .replace(/\-+/g, '-')      // 連続ハイフン→単一
    .replace(/^\-|\-$/g, '');  // 先頭末尾ハイフン除去

  // 日本語キーワードを英語に変換
  Object.entries(commonKeywordMap).forEach(([japanese, english]) => {
    const regex = new RegExp(japanese, 'g');
    baseSlug = baseSlug.replace(regex, english);
  });

  // 短すぎる場合のフォールバック
  if (!baseSlug || baseSlug.length < 3) {
    const timestamp = Date.now().toString().slice(-6);
    baseSlug = `article-${timestamp}`;
    console.log(`⚠️  短いスラッグのため自動生成: ${baseSlug}`);
  }

  // 重複チェック
  const existingPosts = await client.fetch(
    `*[_type == "post" && slug.current match $slugPattern]`,
    { slugPattern: `${baseSlug}*` }
  );

  if (existingPosts.length === 0) {
    return baseSlug;
  }

  // 重複がある場合、番号を付加
  let counter = 1;
  let uniqueSlug = `${baseSlug}-${counter}`;
  
  while (existingPosts.some(post => post.slug.current === uniqueSlug)) {
    counter++;
    uniqueSlug = `${baseSlug}-${counter}`;
  }

  console.log(`🔄 スラッグ重複のため調整: ${baseSlug} → ${uniqueSlug}`);
  return uniqueSlug;
}

/**
 * Markdown → Portable Text 変換
 */
function markdownToPortableText(markdown) {
  const blocks = [];
  const lines = markdown.split('\n');
  
  let currentBlock = null;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (!trimmedLine) {
      // 空行は段落区切りとして処理
      if (currentBlock && currentBlock.children.length > 0) {
        blocks.push(currentBlock);
        currentBlock = null;
      }
      continue;
    }
    
    // 見出し処理
    if (trimmedLine.startsWith('##')) {
      if (currentBlock) {
        blocks.push(currentBlock);
      }
      
      const headingText = trimmedLine.replace(/^#+\s*/, '');
      blocks.push({
        _type: 'block',
        _key: `heading-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        style: 'h2',
        children: [{
          _type: 'span',
          _key: `span-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          text: headingText,
          marks: []
        }]
      });
      
      currentBlock = null;
      continue;
    }
    
    // 通常のテキスト処理
    if (!currentBlock) {
      currentBlock = {
        _type: 'block',
        _key: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        style: 'normal',
        children: []
      };
    }
    
    // 太字処理
    const processedText = trimmedLine.replace(/\*\*(.*?)\*\*/g, (match, text) => {
      return text; // マークダウンの太字記号を除去（マーク情報は別途処理）
    });
    
    // テキストを追加
    if (currentBlock.children.length > 0) {
      // 既存の子要素がある場合は改行を追加
      currentBlock.children.push({
        _type: 'span',
        _key: `span-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text: '\n' + processedText,
        marks: []
      });
    } else {
      currentBlock.children.push({
        _type: 'span',
        _key: `span-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text: processedText,
        marks: []
      });
    }
  }
  
  // 最後のブロックを追加
  if (currentBlock && currentBlock.children.length > 0) {
    blocks.push(currentBlock);
  }
  
  return blocks;
}

/**
 * JSONファイルからSanity投稿
 */
async function uploadFromJson(jsonFilePath) {
  try {
    console.log(`📄 JSONファイル読み込み: ${jsonFilePath}`);
    
    // ファイル存在確認
    if (!fs.existsSync(jsonFilePath)) {
      throw new Error(`ファイルが見つかりません: ${jsonFilePath}`);
    }
    
    // JSON読み込み
    const rawData = fs.readFileSync(jsonFilePath, 'utf-8');
    const jsonData = JSON.parse(rawData);
    
    // 新しい形式（article プロパティあり）か古い形式かを判定
    const articleData = jsonData.article || jsonData;
    
    console.log(`📝 記事データ確認: ${articleData.title}`);
    
    // 必須フィールド確認
    if (!articleData.title || !articleData.body) {
      throw new Error('必須フィールド（title, body）が不足しています');
    }
    
    // スラッグ処理
    let finalSlug;
    if (articleData.slug) {
      console.log(`📋 JSONからスラッグ取得: ${articleData.slug}`);
      finalSlug = articleData.slug;
    } else {
      console.log(`🔄 タイトルからスラッグ生成中...`);
      finalSlug = await generateUniqueSlug(articleData.title);
    }
    
    console.log(`🔖 最終スラッグ: ${finalSlug}`);
    
    // Portable Text変換
    console.log(`🔄 Markdown → Portable Text 変換中...`);
    const portableTextBody = markdownToPortableText(articleData.body);
    
    // Sanity投稿データ構築
    const postData = {
      _type: 'post',
      title: articleData.title,
      slug: {
        _type: 'slug',
        current: finalSlug
      },
      body: portableTextBody,
      publishedAt: new Date().toISOString(),
      categories: articleData.categories || ['技術', '体験'],
      excerpt: articleData.excerpt || `${articleData.title}について書いた記事です。技術と日常の体験から得た洞察を共有しています。`
    };
    
    console.log(`🚀 Sanity投稿開始...`);
    
    // Sanity投稿実行
    const result = await client.create(postData);
    
    console.log(`✅ Sanity投稿完了!`);
    console.log(`📄 Document ID: ${result._id}`);
    console.log(`🔗 Slug: ${finalSlug}`);
    console.log(`🌐 公開URL: https://hiro-logue.vercel.app/blog/${finalSlug}`);
    
    // 投稿結果をJSONファイルに記録
    const resultData = {
      ...articleData,
      sanity: {
        documentId: result._id,
        slug: finalSlug,
        publishedAt: result.publishedAt,
        createdAt: result._createdAt,
        updatedAt: result._updatedAt
      },
      urls: {
        sanityStudio: `https://hbqm9iu5.sanity.studio/structure/post;${result._id}`,
        publicSite: `https://hiro-logue.vercel.app/blog/${finalSlug}`
      },
      uploadedAt: new Date().toISOString()
    };
    
    // 結果ファイル保存
    const resultFilePath = jsonFilePath.replace('.json', '-uploaded.json');
    fs.writeFileSync(resultFilePath, JSON.stringify(resultData, null, 2), 'utf-8');
    console.log(`💾 投稿結果保存: ${resultFilePath}`);
    
    return {
      success: true,
      documentId: result._id,
      slug: finalSlug,
      publicUrl: `https://hiro-logue.vercel.app/blog/${finalSlug}`
    };
    
  } catch (error) {
    console.error(`❌ Sanity投稿エラー: ${error.message}`);
    throw error;
  }
}

/**
 * 使用方法表示
 */
function showUsage() {
  console.log('📄 JSON → Sanity 投稿スクリプト');
  console.log('');
  console.log('使用方法:');
  console.log('  node upload-from-json.js [JSONファイルパス]');
  console.log('');
  console.log('例:');
  console.log('  node upload-from-json.js articles/my-article.json');
  console.log('  node upload-from-json.js articles/1625123456789.json');
  console.log('');
  console.log('必要な環境変数:');
  console.log('  NEXT_PUBLIC_SANITY_PROJECT_ID (default: hbqm9iu5)');
  console.log('  NEXT_PUBLIC_SANITY_DATASET (default: production)');
  console.log('  SANITY_API_TOKEN (必須)');
}

/**
 * メイン処理
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help')) {
    showUsage();
    process.exit(0);
  }
  
  const jsonFilePath = args[0];
  
  // 環境変数チェック
  if (!process.env.SANITY_API_TOKEN) {
    console.error('❌ 環境変数 SANITY_API_TOKEN が設定されていません');
    console.error('   .env.local ファイルに設定してください');
    process.exit(1);
  }
  
  try {
    console.log('🚀 Sanity投稿プロセス開始');
    console.log(`📁 対象ファイル: ${jsonFilePath}`);
    console.log(`🕐 開始時刻: ${new Date().toLocaleString()}`);
    
    const result = await uploadFromJson(jsonFilePath);
    
    console.log('\n🎉 投稿プロセス完了!');
    console.log(`📄 Document ID: ${result.documentId}`);
    console.log(`🔗 Slug: ${result.slug}`);
    console.log(`🌐 公開URL: ${result.publicUrl}`);
    
  } catch (error) {
    console.error('\n🚨 投稿プロセス失敗');
    console.error(`エラー: ${error.message}`);
    process.exit(1);
  }
}

// Node.js環境でのみ実行
if (typeof require !== 'undefined' && require.main === module) {
  main();
}

module.exports = { uploadFromJson, generateUniqueSlug, markdownToPortableText };