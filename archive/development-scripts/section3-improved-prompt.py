#!/usr/bin/env python3
"""
セクション3改善プロンプト画像生成スクリプト
collaborative workspaceを除去した新プロンプトで画像生成
"""

import os
import sys
import time
from datetime import datetime

def generate_section3_improved():
    """改善されたセクション3プロンプトで画像生成"""
    print("🎨 セクション3改善版画像生成開始")
    print("=" * 50)
    
    try:
        from diffusers import StableDiffusionXLPipeline
        import torch
        
        # モデルパスとPythonパス設定
        model_path = "/Users/gotohiro/Documents/user/Products/AI/models/diffusers/juggernaut-xl"
        output_dir = "public/images/blog/auto-generated/article-20250712-185045"
        
        print("📂 モデルロード中...")
        pipe = StableDiffusionXLPipeline.from_pretrained(
            model_path,
            torch_dtype=torch.float16,
            use_safetensors=False
        ).to("mps")
        
        print("✅ モデルロード完了")
        
        # 改善されたプロンプト（人間連想語句完全除去）
        improved_prompt = "A top-down aerial view of technology arrangement showing multiple digital interfaces and platforms, video screens displaying data visualizations, application interfaces floating in organized layout, digital connectivity symbols and network nodes, representing modern technology integration and information flow, in a flat design style, minimalist, clean, modern, tech-focused, professional"
        
        # 超強化ネガティブプロンプト
        negative_prompt = "person, people, human, man, woman, face, realistic human features, portrait, character, figure, body, silhouette, sitting person, standing person, anyone, somebody, individual, collaborative, workspace, teamwork, meeting, office, working, cooperation, coordination, team, text, watermark, blurry, lowres, bad anatomy, bad hands, missing fingers, extra digits, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, username, artist name"
        
        print("🔤 改善プロンプト:")
        print(f"   {improved_prompt[:80]}...")
        print("🚫 強化ネガティブプロンプト適用済み")
        print("⚡ 画像生成実行中...")
        
        start_time = time.time()
        
        # 画像生成実行
        image = pipe(
            prompt=improved_prompt,
            negative_prompt=negative_prompt,
            width=1600,
            height=896,
            num_inference_steps=25,
            guidance_scale=7.5
        ).images[0]
        
        generation_time = time.time() - start_time
        
        # ファイル保存
        os.makedirs(output_dir, exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"section3-improved-{timestamp}.png"
        output_path = os.path.join(output_dir, filename)
        
        image.save(output_path)
        
        print("✅ 画像生成完了")
        print(f"⏱️ 生成時間: {generation_time:.2f}秒")
        print(f"💾 保存先: {output_path}")
        print(f"📏 解像度: 1600x896")
        print(f"🎯 人物描画防止: 強化ネガティブプロンプト適用済み")
        
        return {
            "success": True,
            "output_path": output_path,
            "filename": filename,
            "generation_time": generation_time,
            "prompt_improvements": [
                "collaborative workspace → technology arrangement",
                "teamwork → technology integration", 
                "communication technologies → information flow"
            ]
        }
        
    except Exception as e:
        print(f"❌ 画像生成エラー: {e}")
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    result = generate_section3_improved()
    if result["success"]:
        print("\n🎉 セクション3改善版生成成功")
        print(f"📁 ファイル: {result['filename']}")
        print("📋 改善点:")
        for improvement in result["prompt_improvements"]:
            print(f"   ✅ {improvement}")
    else:
        print(f"\n❌ 生成失敗: {result['error']}")
        sys.exit(1)