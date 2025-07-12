#!/usr/bin/env python3
"""
SD統合テスト デバッグ版
問題を特定するための簡易版スクリプト
"""

import os
import sys
import json
import torch
from pathlib import Path
from diffusers import StableDiffusionXLPipeline

# 設定
MODEL_PATH = "/Users/gotohiro/Documents/user/Products/AI/models/diffusers/juggernaut-xl"
CONFIG_FILE = "test-light-config.json"
OUTPUT_DIR = "public/images/blog/auto-generated/test-output"

def debug_sd_integration():
    print("🔍 SD統合テストデバッグ開始")
    print("=" * 50)
    
    try:
        # Step 1: 設定ファイル確認
        print("📄 Step 1: 設定ファイル読み込み...")
        if not os.path.exists(CONFIG_FILE):
            print(f"❌ 設定ファイルが見つかりません: {CONFIG_FILE}")
            return False
            
        with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
            config = json.load(f)
        
        print(f"✅ 設定読み込み成功: {len(config['prompts'])}個のプロンプト")
        
        # Step 2: 出力ディレクトリ確認
        print("📁 Step 2: 出力ディレクトリ確認...")
        output_path = Path(OUTPUT_DIR)
        output_path.mkdir(parents=True, exist_ok=True)
        print(f"✅ 出力ディレクトリ準備完了: {output_path}")
        
        # Step 3: モデル確認
        print("🎯 Step 3: モデル確認...")
        if not os.path.exists(MODEL_PATH):
            print(f"❌ モデルが見つかりません: {MODEL_PATH}")
            return False
        print(f"✅ モデル確認完了: {MODEL_PATH}")
        
        # Step 4: パイプライン初期化
        print("📦 Step 4: パイプライン初期化...")
        pipe = StableDiffusionXLPipeline.from_pretrained(
            MODEL_PATH,
            torch_dtype=torch.float16,
            use_safetensors=False
        ).to("mps")
        print("✅ パイプライン初期化完了")
        
        # Step 5: テスト画像生成
        print("🎨 Step 5: テスト画像生成...")
        prompt_config = config["prompts"][0]
        print(f"📝 プロンプト: {prompt_config['prompt'][:100]}...")
        
        # 簡易設定で高速生成
        image = pipe(
            prompt=prompt_config["prompt"],
            negative_prompt=prompt_config["negative_prompt"],
            width=512,  # 高速化のため小さいサイズ
            height=512,
            num_inference_steps=10,  # 高速化のため少ないステップ
            guidance_scale=7.5
        ).images[0]
        
        # 保存
        filename = f"{prompt_config['filename_prefix']}-debug-test.png"
        filepath = output_path / filename
        image.save(filepath)
        
        print(f"✅ 画像生成成功: {filepath}")
        print(f"📊 ファイルサイズ: {os.path.getsize(filepath)} bytes")
        
        print("\n🎉 SD統合テストデバッグ成功!")
        return True
        
    except Exception as e:
        print(f"❌ エラー発生: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = debug_sd_integration()
    sys.exit(0 if success else 1)