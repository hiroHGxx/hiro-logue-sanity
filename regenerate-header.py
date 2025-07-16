#!/usr/bin/env python3
"""
ヘッダー画像単体再生成スクリプト
current session用のヘッダー画像のみを再生成する
"""

import os
import json
import time
from datetime import datetime

def main():
    print("🔄 ヘッダー画像再生成スクリプト開始")
    print("=" * 50)
    
    # セッション情報
    session_id = "article-20250716-121500"
    output_dir = f"public/images/blog/auto-generated/{session_id}"
    
    print(f"📂 セッションID: {session_id}")
    print(f"📁 出力ディレクトリ: {output_dir}")
    
    # 改善されたヘッダープロンプト（より魅力的で温かみのある表現）
    header_prompt = """
    A welcoming modern learning space with soft natural lighting, empty computer desks arranged in a collaborative layout, 
    warm wooden furniture with educational technology elements, inspirational posters about coding and creativity on walls, 
    large windows showing peaceful outdoor scenery, plants adding life to the environment, 
    clean organized atmosphere suggesting readiness for discovery and learning,
    photorealistic style with warm golden lighting and educational ambiance
    """
    
    # 超強化ネガティブプロンプト
    negative_prompt = """
    person, people, human, man, woman, face, realistic human features, portrait, character, figure, body, 
    silhouette, sitting person, standing person, anyone, somebody, individual, family, connection, 
    generations, interaction, gathering, hands, together, relationship, community, social,
    text, watermark, blurry, lowres, bad anatomy, bad hands, missing fingers, extra digits, 
    fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, username, artist name
    """
    
    try:
        print("📦 Stable Diffusion ライブラリロード中...")
        from diffusers import StableDiffusionXLPipeline
        import torch
        
        # モデルパス
        model_path = "/Users/gotohiro/Documents/user/Products/AI/models/diffusers/juggernaut-xl"
        
        print(f"🤖 モデル読み込み中: Juggernaut XL")
        pipe = StableDiffusionXLPipeline.from_pretrained(
            model_path,
            torch_dtype=torch.float16,
            use_safetensors=False
        ).to("mps")
        
        print(f"⚡ ヘッダー画像生成開始...")
        start_time = time.time()
        
        # 画像生成
        image = pipe(
            prompt=header_prompt.strip(),
            negative_prompt=negative_prompt.strip(),
            width=1600,
            height=896,
            num_inference_steps=25,
            guidance_scale=7.5
        ).images[0]
        
        generation_time = time.time() - start_time
        
        # 出力ファイルパス（タイムスタンプ付き）
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"header-{timestamp}.png"
        output_path = os.path.join(output_dir, filename)
        
        # ディレクトリ存在確認・作成
        os.makedirs(output_dir, exist_ok=True)
        
        # 画像保存
        image.save(output_path)
        
        print(f"✅ ヘッダー画像再生成完了！")
        print(f"⏱️ 生成時間: {generation_time:.2f}秒")
        print(f"💾 保存先: {output_path}")
        print(f"📏 解像度: 1600x896")
        print(f"🎯 人物描画防止プロンプト適用済み")
        print(f"🌟 改善されたプロンプトで生成済み")
        
        # 既存のheader画像ファイルを確認
        import glob
        existing_headers = glob.glob(os.path.join(output_dir, "header-*.png"))
        if len(existing_headers) > 1:
            print(f"\n📝 注意: 複数のヘッダー画像が存在します")
            for header in existing_headers:
                print(f"  - {os.path.basename(header)}")
            print(f"  最新のファイルが {filename} です")
        
        return True
        
    except Exception as e:
        print(f"❌ エラー発生: {e}")
        return False

if __name__ == "__main__":
    success = main()
    if not success:
        exit(1)