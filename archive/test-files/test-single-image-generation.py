#!/usr/bin/env python3
"""
単一画像生成テスト - ContentFlow統合用
拡張JSON構造からの画像生成テスト
"""

import os
import sys
import json
import time
from datetime import datetime

def load_test_config():
    """テスト用JSON設定読み込み"""
    config_path = "test-extended-json-structure.json"
    
    if not os.path.exists(config_path):
        print(f"❌ テスト設定ファイルが見つかりません: {config_path}")
        return None
    
    try:
        with open(config_path, 'r', encoding='utf-8') as f:
            config = json.load(f)
        
        print(f"✅ テスト設定読み込み完了")
        print(f"📝 記事タイトル: {config['title']}")
        print(f"🎨 画像プロンプト数: {len(config['imagePrompts'])}")
        
        return config
        
    except Exception as e:
        print(f"❌ 設定ファイル読み込みエラー: {e}")
        return None

def generate_single_image(prompt_data, output_dir="public/images/blog/test-single"):
    """単一画像生成テスト"""
    print(f"\n🎨 単一画像生成テスト開始")
    print(f"📍 位置: {prompt_data['position']}")
    print(f"📝 説明: {prompt_data['description']}")
    
    try:
        from diffusers import StableDiffusionXLPipeline
        import torch
        
        # モデルロード
        model_path = "/Users/gotohiro/Documents/user/Products/AI/models/diffusers/juggernaut-xl"
        print(f"📂 モデルロード中...")
        
        pipe = StableDiffusionXLPipeline.from_pretrained(
            model_path,
            torch_dtype=torch.float16,
            use_safetensors=False
        ).to("mps")
        
        # 出力ディレクトリ作成
        os.makedirs(output_dir, exist_ok=True)
        
        # プロンプト構築
        full_prompt = f"{prompt_data['prompt']}, {prompt_data['style']}"
        
        # 強化されたネガティブプロンプト（人物描画防止）
        base_negative = prompt_data['negativePrompt']
        human_prevention = "person, people, human, man, woman, face, realistic human features, portrait, character, figure"
        negative_prompt = f"{base_negative}, {human_prevention}"
        
        print(f"🔤 プロンプト: {full_prompt[:100]}...")
        print(f"🚫 ネガティブ: {negative_prompt}")
        
        # 画像生成
        print(f"⚡ 画像生成実行中...")
        start_time = time.time()
        
        image = pipe(
            prompt=full_prompt,
            negative_prompt=negative_prompt,
            width=1600,
            height=896,
            num_inference_steps=25,
            guidance_scale=7.5
        ).images[0]
        
        generation_time = time.time() - start_time
        
        # 保存
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"test-{prompt_data['position']}-{timestamp}.png"
        output_path = os.path.join(output_dir, filename)
        
        image.save(output_path)
        
        print(f"✅ 画像生成完了")
        print(f"⏱️ 生成時間: {generation_time:.2f}秒")
        print(f"💾 保存先: {output_path}")
        print(f"📏 解像度: 1600x896")
        
        return {
            "success": True,
            "output_path": output_path,
            "generation_time": generation_time,
            "filename": filename
        }
        
    except Exception as e:
        print(f"❌ 画像生成エラー: {e}")
        return {
            "success": False,
            "error": str(e)
        }

def main():
    """メイン処理"""
    print("🚀 ContentFlow単一画像生成テスト")
    print("=" * 50)
    
    # テスト設定読み込み
    config = load_test_config()
    if not config:
        sys.exit(1)
    
    # ヘッダー画像（最初の1枚）をテスト生成
    header_prompt = config['imagePrompts'][0]
    
    print(f"\n🎯 テスト対象: {header_prompt['position']} 画像")
    
    # 画像生成実行
    result = generate_single_image(header_prompt)
    
    if result['success']:
        print(f"\n✅ 単一画像生成テスト成功！")
        print(f"📂 生成ファイル: {result['filename']}")
        print(f"⏱️ 生成時間: {result['generation_time']:.2f}秒")
        print(f"🎯 次のステップ: 複数画像生成テスト実行可能")
    else:
        print(f"\n❌ 単一画像生成テスト失敗")
        print(f"🐛 エラー: {result['error']}")
        sys.exit(1)

if __name__ == "__main__":
    main()