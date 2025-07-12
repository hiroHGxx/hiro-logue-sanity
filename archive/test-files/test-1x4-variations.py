#!/usr/bin/env python3
"""
複数画像生成テスト（1枚×4バリエーション）
ヘッダー画像を4つのバリエーションで生成し、品質比較・選択プロセスをテスト
"""

import os
import sys
import json
import time
from datetime import datetime
from diffusers import StableDiffusionXLPipeline
import torch
from PIL import Image

# プロジェクトディレクトリに移動
os.chdir('/Users/gotohiro/Documents/user/Products/ContentFlow/sanity-edition')

# 設定
MODEL_PATH = "/Users/gotohiro/Documents/user/Products/AI/models/diffusers/juggernaut-xl"
OUTPUT_DIR = "public/images/blog/test-1x4-variations"
STATUS_FILE = "image-generation-status.json"

# 出力ディレクトリ作成
os.makedirs(OUTPUT_DIR, exist_ok=True)

def load_pipeline():
    """Stable Diffusion XL パイプライン読み込み"""
    print("🔧 Stable Diffusion XL パイプライン読み込み中...")
    
    pipeline = StableDiffusionXLPipeline.from_pretrained(
        MODEL_PATH,
        torch_dtype=torch.float16,
        use_safetensors=False  # .bin形式のため必須
    ).to("mps")
    
    print("✅ パイプライン読み込み完了")
    return pipeline

def generate_header_variations(pipeline):
    """ヘッダー画像4バリエーション生成"""
    
    # 基本プロンプト設定
    base_prompt = """A peaceful cozy room with modern technology (open laptop showing AI interface, 
    smart devices) harmoniously integrated with natural elements like plants and warm lighting, 
    empty comfortable seating area, representing the balance between AI efficiency and human leisure, 
    japanese minimalist interior design, warm atmosphere, professional photography"""
    
    # 強化されたネガティブプロンプト（人物描画防止）
    negative_prompt = """person, people, human, man, woman, face, realistic human features, portrait, 
    character, figure, text, watermark, blurry, lowres, bad anatomy, bad hands, missing fingers, 
    extra digits, fewer digits, cropped, worst quality, low quality, normal quality, 
    jpeg artifacts, signature, username, artist name"""
    
    # 4つのスタイルバリエーション
    style_variations = [
        {
            "name": "warm_minimal",
            "style": "warm lighting, cozy atmosphere, japanese minimalist",
            "description": "温かみのあるミニマルスタイル"
        },
        {
            "name": "modern_tech",
            "style": "modern technology focus, clean lines, contemporary interior",
            "description": "モダンテクノロジー重視"
        },
        {
            "name": "natural_organic", 
            "style": "natural materials, organic shapes, plant-focused, earthy tones",
            "description": "自然素材・植物重視"
        },
        {
            "name": "soft_bokeh",
            "style": "soft focus, bokeh effect, dreamy atmosphere, gentle lighting",
            "description": "ソフトフォーカス・ボケ効果"
        }
    ]
    
    # 状態管理
    status_data = {
        "status": "generating",
        "startedAt": datetime.now().isoformat(),
        "total": 4,
        "completed": 0,
        "failed": 0,
        "variations": []
    }
    
    # 状態ファイル保存
    with open(STATUS_FILE, 'w', encoding='utf-8') as f:
        json.dump(status_data, f, ensure_ascii=False, indent=2)
    
    results = []
    
    for i, variation in enumerate(style_variations, 1):
        print(f"\n🎨 バリエーション {i}/4 生成中: {variation['name']}")
        print(f"📝 説明: {variation['description']}")
        
        # プロンプト構築
        full_prompt = f"{base_prompt}, {variation['style']}"
        
        try:
            start_time = time.time()
            
            # 画像生成
            image = pipeline(
                prompt=full_prompt,
                negative_prompt=negative_prompt,
                width=1600,
                height=896,  # 16:9比率、8の倍数
                num_inference_steps=25,
                guidance_scale=7.5,
                num_images_per_prompt=1
            ).images[0]
            
            generation_time = time.time() - start_time
            
            # ファイル名生成
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"header-{variation['name']}-{timestamp}.png"
            filepath = os.path.join(OUTPUT_DIR, filename)
            
            # 画像保存
            image.save(filepath)
            
            # 結果記録
            result = {
                "variation": variation['name'],
                "description": variation['description'],
                "filename": filename,
                "filepath": filepath,
                "prompt": full_prompt,
                "generation_time": f"{generation_time:.2f}秒",
                "resolution": "1600x896",
                "status": "success"
            }
            
            results.append(result)
            
            # 状態更新
            status_data["completed"] += 1
            status_data["variations"].append(result)
            
            with open(STATUS_FILE, 'w', encoding='utf-8') as f:
                json.dump(status_data, f, ensure_ascii=False, indent=2)
            
            print(f"✅ 生成完了: {filename} ({generation_time:.2f}秒)")
            
        except Exception as e:
            print(f"❌ エラー発生: {str(e)}")
            
            # エラー記録
            error_result = {
                "variation": variation['name'],
                "description": variation['description'],
                "status": "failed",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
            
            results.append(error_result)
            status_data["failed"] += 1
            status_data["variations"].append(error_result)
            
            with open(STATUS_FILE, 'w', encoding='utf-8') as f:
                json.dump(status_data, f, ensure_ascii=False, indent=2)
    
    # 最終状態更新
    status_data["status"] = "completed"
    status_data["completedAt"] = datetime.now().isoformat()
    
    with open(STATUS_FILE, 'w', encoding='utf-8') as f:
        json.dump(status_data, f, ensure_ascii=False, indent=2)
    
    return results

def print_results(results):
    """結果レポート出力"""
    print("\n" + "="*60)
    print("🎯 複数画像生成テスト結果レポート")
    print("="*60)
    
    successful = [r for r in results if r.get("status") == "success"]
    failed = [r for r in results if r.get("status") == "failed"]
    
    print(f"✅ 成功: {len(successful)}/4")
    print(f"❌ 失敗: {len(failed)}/4")
    
    if successful:
        print("\n📸 生成成功画像:")
        for result in successful:
            print(f"  • {result['filename']}")
            print(f"    スタイル: {result['description']}")
            print(f"    生成時間: {result['generation_time']}")
            print()
    
    if failed:
        print("\n🚨 生成失敗:")
        for result in failed:
            print(f"  • {result['variation']}: {result['error']}")
    
    print(f"\n📁 出力ディレクトリ: {OUTPUT_DIR}")
    print(f"📋 状態ファイル: {STATUS_FILE}")
    print("\n🔍 次の手順:")
    print("1. 生成された画像を確認")
    print("2. 品質評価・選択")
    print("3. 統合テストの準備")

def main():
    """メイン処理"""
    print("🚀 複数画像生成テスト（1枚×4バリエーション）開始")
    print(f"📁 出力先: {OUTPUT_DIR}")
    
    try:
        # パイプライン読み込み
        pipeline = load_pipeline()
        
        # 4バリエーション生成
        results = generate_header_variations(pipeline)
        
        # 結果レポート
        print_results(results)
        
        print("\n🎉 複数画像生成テスト完了!")
        
    except Exception as e:
        print(f"🚨 予期しないエラー: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()