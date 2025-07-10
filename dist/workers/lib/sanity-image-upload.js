"use strict";
/**
 * Sanity画像アップロード統合
 * Phase B: 生成画像の自動Sanityアップロード・記事更新
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanityImageUploader = exports.SanityImageUploader = void 0;
const sanity_1 = require("./sanity");
const promises_1 = require("fs/promises");
const path_1 = require("path");
class SanityImageUploader {
    /**
     * 画像ファイルをSanityにアップロード
     */
    async uploadImage(filePath, filename) {
        try {
            console.log(`📤 Uploading image to Sanity: ${filename}`);
            // ファイル読み込み
            const imageBuffer = await promises_1.default.readFile(filePath);
            // Sanity Asset API でアップロード
            const asset = await sanity_1.client.assets.upload('image', imageBuffer, {
                filename: filename,
                title: filename.replace(/\.[^/.]+$/, ''), // 拡張子を除いたファイル名
            });
            console.log(`✅ Image uploaded successfully: ${asset._id}`);
            return {
                _id: asset._id,
                url: asset.url,
                originalFilename: asset.originalFilename || filename,
                mimeType: asset.mimeType,
                size: asset.size
            };
        }
        catch (error) {
            console.error(`❌ Failed to upload image ${filename}:`, error);
            throw error;
        }
    }
    /**
     * 生成画像フォルダ全体をアップロード
     */
    async uploadGeneratedImages(outputDir, jobId) {
        try {
            console.log(`📁 Processing images from: ${outputDir}`);
            const files = await promises_1.default.readdir(outputDir);
            const imageFiles = files.filter(file => file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg'));
            if (imageFiles.length === 0) {
                throw new Error(`No image files found in ${outputDir}`);
            }
            const uploadResults = [];
            for (const filename of imageFiles) {
                const filePath = path_1.default.join(outputDir, filename);
                // ファイル名からシーンを推定
                const scene = this.extractSceneFromFilename(filename);
                try {
                    const asset = await this.uploadImage(filePath, filename);
                    uploadResults.push({
                        asset,
                        filename,
                        scene
                    });
                }
                catch (error) {
                    console.error(`⚠️ Failed to upload ${filename}, continuing with others...`);
                }
            }
            console.log(`✅ Uploaded ${uploadResults.length}/${imageFiles.length} images`);
            return uploadResults;
        }
        catch (error) {
            console.error(`❌ Failed to upload images from ${outputDir}:`, error);
            throw error;
        }
    }
    /**
     * ファイル名からシーンタイプを抽出
     */
    extractSceneFromFilename(filename) {
        const lowerFilename = filename.toLowerCase();
        if (lowerFilename.includes('hero'))
            return 'hero';
        if (lowerFilename.includes('section1'))
            return 'section1';
        if (lowerFilename.includes('section2'))
            return 'section2';
        if (lowerFilename.includes('section3'))
            return 'section3';
        // フォールバック: ファイル名の順序で判定
        if (lowerFilename.includes('-001-'))
            return 'hero';
        if (lowerFilename.includes('-002-'))
            return 'section1';
        if (lowerFilename.includes('-003-'))
            return 'section2';
        if (lowerFilename.includes('-004-'))
            return 'section3';
        return 'unknown';
    }
    /**
     * Sanity記事の画像フィールド更新
     */
    async updateArticleImages(articleId, uploadResults) {
        try {
            console.log(`📝 Updating article images: ${articleId}`);
            // 画像をシーン別に分類
            const heroImage = uploadResults.find(result => result.scene === 'hero')?.asset;
            const sectionImages = uploadResults
                .filter(result => result.scene.startsWith('section'))
                .sort((a, b) => a.scene.localeCompare(b.scene))
                .map(result => result.asset);
            // Sanity記事更新パッチ
            const updatePatch = {};
            if (heroImage) {
                updatePatch.heroImage = {
                    _type: 'image',
                    asset: {
                        _type: 'reference',
                        _ref: heroImage._id
                    },
                    alt: `Hero image for article`
                };
            }
            if (sectionImages.length > 0) {
                updatePatch.sectionImages = sectionImages.map((asset, index) => ({
                    _type: 'image',
                    _key: `section-${index + 1}`,
                    asset: {
                        _type: 'reference',
                        _ref: asset._id
                    },
                    alt: `Section ${index + 1} image`
                }));
            }
            // 記事更新実行
            if (Object.keys(updatePatch).length > 0) {
                await sanity_1.client
                    .patch(articleId)
                    .set(updatePatch)
                    .commit();
                console.log(`✅ Article images updated successfully: ${articleId}`);
            }
            else {
                console.log(`⚠️ No valid images to update for article: ${articleId}`);
            }
            return {
                articleId,
                heroImage,
                sectionImages,
                uploadResults
            };
        }
        catch (error) {
            console.error(`❌ Failed to update article images:`, error);
            throw error;
        }
    }
    /**
     * 完全な画像統合処理 (アップロード + 記事更新)
     */
    async processImageIntegration(outputDir, articleId, jobId) {
        try {
            console.log(`🔄 Starting complete image integration for article: ${articleId}`);
            // 1. 画像アップロード
            const uploadResults = await this.uploadGeneratedImages(outputDir, jobId);
            if (uploadResults.length === 0) {
                throw new Error('No images were successfully uploaded');
            }
            // 2. 記事更新
            const updateResult = await this.updateArticleImages(articleId, uploadResults);
            console.log(`🎉 Image integration completed successfully for article: ${articleId}`);
            return updateResult;
        }
        catch (error) {
            console.error(`❌ Image integration failed for article ${articleId}:`, error);
            throw error;
        }
    }
    /**
     * 記事の現在の画像情報を取得
     */
    async getArticleImageInfo(articleId) {
        try {
            const article = await sanity_1.client.fetch(`*[_type == "post" && _id == $articleId][0]{
          heroImage,
          sectionImages
        }`, { articleId });
            if (!article) {
                throw new Error(`Article not found: ${articleId}`);
            }
            return {
                hasHeroImage: !!article.heroImage,
                sectionImageCount: article.sectionImages?.length || 0,
                currentHeroImage: article.heroImage?.asset ? {
                    _id: article.heroImage.asset._ref,
                    url: '', // URLは別途解決が必要
                    originalFilename: '',
                    mimeType: '',
                    size: 0
                } : undefined,
                currentSectionImages: article.sectionImages?.map((img) => ({
                    _id: img.asset._ref,
                    url: '',
                    originalFilename: '',
                    mimeType: '',
                    size: 0
                })) || []
            };
        }
        catch (error) {
            console.error(`❌ Failed to get article image info:`, error);
            throw error;
        }
    }
}
exports.SanityImageUploader = SanityImageUploader;
// シングルトンインスタンス
exports.sanityImageUploader = new SanityImageUploader();
