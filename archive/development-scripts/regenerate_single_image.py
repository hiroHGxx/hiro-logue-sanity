#!/usr/bin/env python3
"""
特定画像再生成スクリプト - ContentFlow統合用
指定されたファイル名の画像を再生成する機能
"""

import os
import sys
import json
import time
import argparse
from datetime import datetime

def find_prompt_by_filename(config, target_filename):
    """ファイル名から対応するプロンプト情報を検索"""
    print(f"🔍 プロンプト検索中: {target_filename}")
    
    # ファイル名からposition情報を抽出
    if "header" in target_filename:
        position = "header"
    elif "section1" in target_filename:
        position = "section1" 
    elif "section2" in target_filename:
        position = "section2"
    elif "section3" in target_filename:
        position = "section3"
    else:
        print(f"❌ ファイル名から位置情報を特定できません: {target_filename}")
        return None
    
    # 対応するプロンプトを検索
    for prompt_data in config['imagePrompts']:
        if prompt_data['position'] == position:
            print(f"✅ プロンプト発見: {position}")
            print(f"📝 説明: {prompt_data['description']}")
            return prompt_data
    
    print(f"❌ 対応するプロンプトが見つかりません: {position}")
    return None

def regenerate_image(prompt_data, target_filename, output_dir):
    """指定された画像を再生成"""
    print(f"\n🎨 画像再生成開始")
    print(f"📍 位置: {prompt_data['position']}")
    print(f"🎯 対象ファイル: {target_filename}")
    
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
        
        # 出力ディレクトリ確認
        if not os.path.exists(output_dir):
            print(f"❌ 出力ディレクトリが存在しません: {output_dir}")
            return False
        
        # プロンプト構築（強化されたネガティブプロンプト付き）
        full_prompt = f"{prompt_data['prompt']}, {prompt_data['style']}"
        
        # 超強化されたネガティブプロンプト（人物描画完全防止）
        base_negative = prompt_data['negativePrompt']
        human_prevention = "person, people, human, man, woman, face, realistic human features, portrait, character, figure, body, silhouette, sitting person, standing person, anyone, somebody, individual"
        negative_prompt = f"{base_negative}, {human_prevention}"
        
        print(f"🔤 プロンプト: {full_prompt[:100]}...")
        print(f"🚫 ネガティブ: {negative_prompt[:100]}...")
        
        # 画像生成
        print(f"⚡ 画像再生成実行中...")
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
        
        # 元のファイルパスで保存（上書き）
        output_path = os.path.join(output_dir, target_filename)
        image.save(output_path)
        
        print(f"✅ 画像再生成完了")
        print(f"⏱️ 生成時間: {generation_time:.2f}秒")
        print(f"💾 保存先: {output_path}")
        print(f"📏 解像度: 1600x896")
        print(f"🔄 元ファイルを上書き保存しました")
        
        return True
        
    except Exception as e:
        print(f"❌ 画像再生成エラー: {e}")
        return False

def load_config(config_path="test-extended-json-structure.json"):
    """設定ファイル読み込み"""
    if not os.path.exists(config_path):
        print(f"❌ 設定ファイルが見つかりません: {config_path}")
        return None
    
    try:
        with open(config_path, 'r', encoding='utf-8') as f:
            config = json.load(f)
        
        print(f"✅ 設定ファイル読み込み完了: {config_path}")
        return config
        
    except Exception as e:
        print(f"❌ 設定ファイル読み込みエラー: {e}")
        return None

def main():
    """メイン処理"""
    parser = argparse.ArgumentParser(description='特定画像の再生成')
    parser.add_argument('filename', help='再生成したい画像のファイル名')
    parser.add_argument('--config', default='test-extended-json-structure.json', 
                       help='設定ファイルパス (default: test-extended-json-structure.json)')
    parser.add_argument('--output-dir', default='public/images/blog/test-single',
                       help='出力ディレクトリ (default: public/images/blog/test-single)')
    
    args = parser.parse_args()
    
    print("🔄 ContentFlow特定画像再生成スクリプト")
    print("=" * 50)
    print(f"🎯 対象ファイル: {args.filename}")
    print(f"📂 出力ディレクトリ: {args.output_dir}")
    
    # 設定ファイル読み込み
    config = load_config(args.config)
    if not config:
        sys.exit(1)
    
    # ファイル名からプロンプト情報を検索
    prompt_data = find_prompt_by_filename(config, args.filename)
    if not prompt_data:
        sys.exit(1)
    
    # 画像再生成実行
    success = regenerate_image(prompt_data, args.filename, args.output_dir)
    
    if success:
        print(f"\n✅ 画像再生成成功！")
        print(f"📂 更新ファイル: {args.filename}")
        print(f"🎯 人物描画防止機能が適用されました")
    else:
        print(f"\n❌ 画像再生成失敗")
        sys.exit(1)

if __name__ == "__main__":
    main()