#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@sanity/client');
const fs = require('fs').promises;
const readline = require('readline');

// Sanity設定
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2023-05-03',
  useCdn: false
});

// ユーザー入力を取得するためのインターフェース
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim().toLowerCase());
    });
  });
}

// 既存画像状況を詳細チェック
async function checkExistingImages(documentId) {
  console.log('🔍 既存画像状況チェック開始...');
  
  const post = await client.fetch(`
    *[_type == "post" && _id == $id][0] {
      _id,
      title,
      slug,
      mainImage,
      heroImage,
      headerImage,
      section1Image,
      section2Image,
      section3Image,
      sectionImages,
      body
    }
  `, { id: documentId });
  
  if (!post) {
    throw new Error(`記事が見つかりません: ${documentId}`);
  }
  
  console.log(`📄 記事: ${post.title}`);
  console.log(`🔗 スラッグ: ${post.slug.current}`);
  
  // フィールド画像をチェック
  const fieldImages = {
    mainImage: !!post.mainImage,
    heroImage: !!post.heroImage,
    headerImage: !!post.headerImage,
    section1Image: !!post.section1Image,
    section2Image: !!post.section2Image,
    section3Image: !!post.section3Image,
    sectionImages: !!(post.sectionImages && post.sectionImages.length > 0)
  };
  
  const hasFieldImages = Object.values(fieldImages).some(Boolean);
  
  // 本文内画像をチェック
  let bodyImageCount = 0;
  const bodyImageIds = [];
  if (post.body && Array.isArray(post.body)) {
    post.body.forEach(block => {
      if (block._type === 'image') {
        bodyImageCount++;
        bodyImageIds.push(block.asset._ref);
      } else if (block._type === 'sectionImage') {
        bodyImageCount++;
        bodyImageIds.push(block.image?.asset._ref);
      }
    });
  }
  
  const hasBodyImages = bodyImageCount > 0;
  
  console.log('\n📊 既存画像状況:');
  console.log('🖼️ フィールド画像:', hasFieldImages ? '✅ あり' : '❌ なし');
  if (hasFieldImages) {
    Object.entries(fieldImages).forEach(([field, exists]) => {
      if (exists) console.log(`   - ${field}: ✅`);
    });
  }
  
  console.log(`📝 本文内画像: ${hasBodyImages ? `✅ ${bodyImageCount}枚` : '❌ なし'}`);
  
  return {
    post,
    hasFieldImages,
    hasBodyImages,
    bodyImageCount,
    bodyImageIds,
    fieldImages
  };
}

// バックアップを作成
async function createBackup(post) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = `./backups/article-${post.slug.current}-${timestamp}.json`;
  
  try {
    await fs.mkdir('./backups', { recursive: true });
    await fs.writeFile(backupPath, JSON.stringify(post, null, 2));
    console.log(`💾 バックアップ作成: ${backupPath}`);
    return backupPath;
  } catch (error) {
    console.warn(`⚠️ バックアップ作成失敗: ${error.message}`);
    return null;
  }
}

// 安全な画像統合処理
async function safeImageIntegration(sessionId, documentId, slug, imageFiles, options = {}) {
  console.log(`🛡️ 安全な画像統合開始: ${slug}`);
  console.log(`📋 記事ID: ${documentId}`);
  console.log(`🎯 セッションID: ${sessionId}`);
  
  try {
    // Step 1: 既存画像状況をチェック
    const imageStatus = await checkExistingImages(documentId);
    
    // Step 2: 衝突リスクの評価
    const hasConflict = imageStatus.hasFieldImages || imageStatus.hasBodyImages;
    
    if (hasConflict && !options.force) {
      console.log('\n⚠️ 画像衝突リスクが検出されました！');
      console.log('📋 現在の状況:');
      console.log(`   - フィールド画像: ${imageStatus.hasFieldImages ? 'あり' : 'なし'}`);
      console.log(`   - 本文内画像: ${imageStatus.hasBodyImages ? `${imageStatus.bodyImageCount}枚` : 'なし'}`);
      
      console.log('\n🎯 選択肢:');
      console.log('  1. replace - 既存画像を新画像で置換');
      console.log('  2. skip - 既存画像を保持、統合をスキップ');
      console.log('  3. merge - 既存画像を保持、新画像を追加（重複リスク）');
      console.log('  4. cancel - 統合をキャンセル');
      
      const choice = await askQuestion('\n選択してください (1-4): ');
      
      switch (choice) {
        case '1':
        case 'replace':
          options.mode = 'replace';
          break;
        case '2':
        case 'skip':
          console.log('✅ 統合をスキップしました');
          rl.close();
          return { success: true, skipped: true };
        case '3':
        case 'merge':
          options.mode = 'merge';
          console.log('⚠️ 重複リスクがあります。本当に続行しますか？');
          const confirm = await askQuestion('続行する場合は "yes" を入力: ');
          if (confirm !== 'yes') {
            console.log('✅ 統合をキャンセルしました');
            rl.close();
            return { success: false, cancelled: true };
          }
          break;
        case '4':
        case 'cancel':
        default:
          console.log('✅ 統合をキャンセルしました');
          rl.close();
          return { success: false, cancelled: true };
      }
    }
    
    // Step 3: バックアップ作成
    const backupPath = await createBackup(imageStatus.post);
    
    // Step 4: 画像ファイル存在確認
    console.log('\n🔍 画像ファイル存在確認...');
    for (const imageFile of imageFiles) {
      try {
        await fs.access(imageFile.path);
        console.log(`✅ ${imageFile.position}: ${imageFile.filename}`);
      } catch (error) {
        throw new Error(`画像ファイルが見つかりません: ${imageFile.path}`);
      }
    }
    
    // Step 5: 画像アップロード
    console.log('\n📤 画像アップロード開始...');
    const uploadedImages = {};
    
    for (const imageFile of imageFiles) {
      console.log(`📤 アップロード中: ${imageFile.filename}...`);
      
      const buffer = await fs.readFile(imageFile.path);
      const asset = await client.assets.upload('image', buffer, {
        filename: imageFile.filename,
        title: `${slug}-${imageFile.position}`
      });
      
      uploadedImages[imageFile.position] = {
        _type: 'image',
        asset: {
          _type: 'reference',
          _ref: asset._id
        },
        alt: `${imageFile.position} image for ${slug}`
      };
      
      console.log(`✅ アップロード完了: ${asset._id}`);
    }
    
    // Step 6: 記事更新
    console.log('\n📝 記事更新中...');
    
    let updateData = {
      updatedAt: new Date().toISOString()
    };
    
    // モードに応じた更新処理
    if (options.mode === 'replace' || !hasConflict) {
      // 既存画像を置換または新規追加
      updateData = {
        ...updateData,
        headerImage: uploadedImages.header,
        section1Image: uploadedImages.section1,
        section2Image: uploadedImages.section2,
        section3Image: uploadedImages.section3
      };
      
      // replaceモードの場合、本文内画像も削除
      if (options.mode === 'replace' && imageStatus.hasBodyImages) {
        const cleanedBody = imageStatus.post.body.filter(block => 
          block._type !== 'image' && block._type !== 'sectionImage'
        );
        updateData.body = cleanedBody;
        console.log(`🗑️ 本文内画像 ${imageStatus.bodyImageCount}枚を削除`);
      }
    }
    
    await client
      .patch(documentId)
      .set(updateData)
      .commit();
    
    console.log('✅ 記事更新完了');
    console.log(`🌐 記事URL: https://hiro-logue.vercel.app/blog/${slug}`);
    
    rl.close();
    return { 
      success: true, 
      backupPath,
      mode: options.mode || 'new',
      uploadedCount: Object.keys(uploadedImages).length
    };
    
  } catch (error) {
    console.error('❌ 統合エラー:', error.message);
    rl.close();
    return { success: false, error: error.message };
  }
}

// メイン実行関数
async function main() {
  console.log('🛡️ 安全な画像統合システム v1.0');
  console.log('=====================================\n');
  
  // コマンドライン引数のチェック
  const args = process.argv.slice(2);
  const forceMode = args.includes('--force');
  
  if (forceMode) {
    console.log('⚡ Force モードが有効です（既存画像チェックをスキップ）');
  }
  
  // 統合対象の記事設定例
  const integrationTargets = [
    // 必要に応じてここに追加
    // {
    //   sessionId: 'article-20250113-165200',
    //   documentId: 'CamHzSyS1JT3ENpT8Dde2Q',
    //   slug: 'adult-learning-reskilling-journey',
    //   imageFiles: [...] 
    // }
  ];
  
  if (integrationTargets.length === 0) {
    console.log('📝 統合対象が設定されていません。');
    console.log('💡 main() 関数内の integrationTargets 配列に対象記事を追加してください。');
    rl.close();
    return;
  }
  
  for (const target of integrationTargets) {
    console.log(`\n🎯 統合対象: ${target.slug}`);
    
    const result = await safeImageIntegration(
      target.sessionId,
      target.documentId,
      target.slug,
      target.imageFiles,
      { force: forceMode }
    );
    
    if (result.success) {
      if (result.skipped) {
        console.log(`⏭️ ${target.slug}: スキップされました`);
      } else {
        console.log(`✅ ${target.slug}: 統合完了 (${result.mode}モード)`);
      }
    } else {
      console.log(`❌ ${target.slug}: 統合失敗`);
    }
  }
  
  console.log('\n🎉 安全な画像統合処理完了');
}

// コマンドライン実行時のみメイン関数を呼び出し
if (require.main === module) {
  main().catch(console.error);
}

// 他のスクリプトから使用できるようにエクスポート
module.exports = {
  safeImageIntegration,
  checkExistingImages,
  createBackup
};