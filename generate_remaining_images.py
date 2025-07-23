#!/usr/bin/env python3
"""
残り3枚の画像を個別生成するスクリプト
"""

import os
import sys
import json
import time
from datetime import datetime

def setup_stable_diffusion():
    """Stable Diffusion環境セットアップ"""
    try:
        from diffusers import StableDiffusionXLPipeline
        import torch
        
        print("📂 Stable Diffusionモデルロード中...")
        
        model_path = "/Users/gotohiro/Documents/user/Products/AI/models/diffusers/juggernaut-xl"
        
        pipe = StableDiffusionXLPipeline.from_pretrained(
            model_path,
            torch_dtype=torch.float16,
            use_safetensors=False  # .bin形式のため必須
        ).to("mps")  # Apple Silicon最適化
        
        print("✅ Stable Diffusion環境セットアップ完了")
        return pipe
        
    except Exception as e:
        print(f"❌ Stable Diffusion環境セットアップエラー: {e}")
        sys.exit(1)

def generate_image(pipe, prompt_info, position, session_id):
    """画像生成実行"""
    try:
        print(f"\n🎨 画像生成開始: {position}")
        print(f"📝 説明: {prompt_info['description']}")
        
        # 完全なプロンプト作成
        full_prompt = f"{prompt_info['prompt']}, {prompt_info['style']}"
        
        print(f"🔤 プロンプト: {full_prompt[:80]}...")
        print("🚫 人物除去プロンプト適用済み")
        print("⚡ 画像生成実行中...")
        
        start_time = time.time()
        
        # 画像生成実行
        image = pipe(
            prompt=full_prompt,
            negative_prompt=prompt_info['negativePrompt'],
            width=prompt_info['parameters']['width'],
            height=prompt_info['parameters']['height'],
            num_inference_steps=prompt_info['parameters']['num_inference_steps'],
            guidance_scale=prompt_info['parameters']['guidance_scale']
        ).images[0]
        
        generation_time = time.time() - start_time
        
        # ファイル保存
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{position}-{timestamp}.png"
        output_dir = f"public/images/blog/auto-generated/{session_id}"
        os.makedirs(output_dir, exist_ok=True)
        
        output_path = os.path.join(output_dir, filename)
        image.save(output_path)
        
        print("✅ 画像生成完了")
        print(f"⏱️ 生成時間: {generation_time:.2f}秒")
        print(f"💾 保存先: {output_path}")
        print(f"📏 解像度: {prompt_info['parameters']['width']}x{prompt_info['parameters']['height']}")
        print(f"✅ 画像 {position} 生成成功")
        
        return True
        
    except Exception as e:
        print(f"❌ 画像生成エラー ({position}): {e}")
        return False

def main():
    """メイン処理"""
    session_id = "article-20250123-145823"
    
    print("🚀 残り3枚画像生成開始")
    print(f"📋 セッション ID: {session_id}")
    print("=" * 60)
    
    # 記事データ読み込み
    json_file = f"articles/{session_id}.json"
    
    if not os.path.exists(json_file):
        print(f"❌ 記事ファイルが見つかりません: {json_file}")
        sys.exit(1)
    
    with open(json_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print("✅ 記事データ読み込み完了")
    print(f"📝 記事タイトル: {data['article']['title']}")
    
    # Stable Diffusion セットアップ
    pipe = setup_stable_diffusion()
    
    # 対象画像プロンプト（section1、section2、section3）
    target_positions = ['section1', 'section2', 'section3']
    
    success_count = 0
    
    for position in target_positions:
        # プロンプト情報を検索
        prompt_info = None
        for prompt in data['imagePrompts']:
            if prompt['position'] == position:
                prompt_info = prompt
                break
        
        if prompt_info is None:
            print(f"❌ {position}のプロンプト情報が見つかりません")
            continue
        
        # 画像生成実行
        if generate_image(pipe, prompt_info, position, session_id):
            success_count += 1
    
    print("\n" + "=" * 60)
    print(f"🎉 画像生成完了: {success_count}/{len(target_positions)}枚成功")
    
    if success_count == len(target_positions):
        print("✅ すべての画像生成が成功しました！")
    else:
        print(f"⚠️ {len(target_positions) - success_count}枚の生成に失敗しました")

if __name__ == "__main__":
    main()