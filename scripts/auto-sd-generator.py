#!/usr/bin/env python3
"""
ContentFlow自動画像生成システム - Stable Diffusion実行スクリプト
Phase A: SD実行スクリプト最適化版

Usage:
    python auto-sd-generator.py --config prompts.json --output /path/to/output
"""

import os
import sys
import json
import argparse
import torch
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any
from diffusers import StableDiffusionXLPipeline

# 設定定数
MODEL_PATH = "/Users/gotohiro/Documents/user/Products/AI/models/diffusers/juggernaut-xl"
PYTHON_ENV = "/Users/gotohiro/Documents/user/Products/stable-diffusion-local/venv310/bin/python"

# ContentFlow最適化設定
CONTENTFLOW_SETTINGS = {
    "width": 1600,
    "height": 896,  # 16:9比率、8の倍数
    "num_inference_steps": 25,
    "guidance_scale": 7.5,
    "torch_dtype": torch.float16,
    "use_safetensors": False,  # .bin形式のため必須
    "device": "mps"  # Apple Silicon最適化
}

# 軽量テストモード設定
LIGHT_TEST_SETTINGS = {
    "width": 512,
    "height": 512,  # 高速化のため小さいサイズ
    "num_inference_steps": 10,  # 高速化のため少ないステップ
    "guidance_scale": 7.5,
    "torch_dtype": torch.float16,
    "use_safetensors": False,
    "device": "mps"
}

class ContentFlowSDGenerator:
    """ContentFlow用Stable Diffusion画像生成クラス"""
    
    def __init__(self, model_path: str = MODEL_PATH, test_mode: bool = False):
        self.model_path = model_path
        self.pipe = None
        self.test_mode = test_mode
        self.settings = LIGHT_TEST_SETTINGS if test_mode else CONTENTFLOW_SETTINGS
        self.generation_stats = {
            "total_images": 0,
            "successful_generations": 0,
            "failed_generations": 0,
            "total_time": 0
        }
    
    def initialize_pipeline(self) -> bool:
        """パイプライン初期化"""
        try:
            print("📦 Stable Diffusion パイプライン初期化中...")
            print(f"🎯 モデル: {self.model_path}")
            
            # モデル存在確認
            if not os.path.exists(self.model_path):
                print(f"❌ モデルが見つかりません: {self.model_path}")
                return False
            
            # パイプライン初期化
            self.pipe = StableDiffusionXLPipeline.from_pretrained(
                self.model_path,
                torch_dtype=self.settings["torch_dtype"],
                use_safetensors=self.settings["use_safetensors"]
            ).to(self.settings["device"])
            
            print("✅ パイプライン初期化完了")
            return True
            
        except Exception as e:
            print(f"❌ パイプライン初期化エラー: {e}")
            return False
    
    def validate_prompt_config(self, config: Dict[str, Any]) -> bool:
        """プロンプト設定の検証"""
        required_fields = ["prompts", "article_info"]
        
        for field in required_fields:
            if field not in config:
                print(f"❌ 必須フィールドが不足: {field}")
                return False
        
        # プロンプト配列の検証
        if not isinstance(config["prompts"], list) or len(config["prompts"]) == 0:
            print("❌ プロンプト配列が無効です")
            return False
        
        # 各プロンプトの必須フィールド確認
        for i, prompt in enumerate(config["prompts"]):
            required_prompt_fields = ["name", "prompt", "filename_prefix"]
            for field in required_prompt_fields:
                if field not in prompt:
                    print(f"❌ プロンプト{i+1}に必須フィールドが不足: {field}")
                    return False
        
        return True
    
    def generate_single_image(self, prompt_config: Dict[str, str], output_dir: Path, variations: int = 1) -> List[str]:
        """単一プロンプトから画像生成"""
        generated_files = []
        
        try:
            prompt = prompt_config["prompt"]
            negative_prompt = prompt_config.get("negative_prompt", "")
            filename_prefix = prompt_config["filename_prefix"]
            name = prompt_config["name"]
            
            print(f"🎨 {name} 画像生成開始...")
            print(f"📝 プロンプト: {prompt[:100]}...")
            
            for i in range(variations):
                start_time = datetime.now()
                
                # 画像生成
                image = self.pipe(
                    prompt=prompt,
                    negative_prompt=negative_prompt,
                    width=self.settings["width"],
                    height=self.settings["height"],
                    num_inference_steps=self.settings["num_inference_steps"],
                    guidance_scale=self.settings["guidance_scale"]
                ).images[0]
                
                # ファイル名生成
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                filename = f"{filename_prefix}-{i+1:03d}-{timestamp}.png"
                filepath = output_dir / filename
                
                # 画像保存
                image.save(filepath)
                generated_files.append(str(filepath))
                
                # 統計更新
                generation_time = (datetime.now() - start_time).total_seconds()
                self.generation_stats["total_time"] += generation_time
                self.generation_stats["successful_generations"] += 1
                
                print(f"✅ {filename} 生成完了 ({generation_time:.1f}秒)")
            
            return generated_files
            
        except Exception as e:
            print(f"❌ 画像生成エラー ({name}): {e}")
            self.generation_stats["failed_generations"] += 1
            return []
    
    def generate_batch_images(self, config_path: str, output_dir: str, variations: int = 1) -> Dict[str, Any]:
        """バッチ画像生成メイン処理"""
        try:
            # 設定ファイル読み込み
            print(f"📄 設定ファイル読み込み: {config_path}")
            with open(config_path, 'r', encoding='utf-8') as f:
                config = json.load(f)
            
            # 設定検証
            if not self.validate_prompt_config(config):
                return {"success": False, "error": "設定ファイルが無効です"}
            
            # 出力ディレクトリ作成
            output_path = Path(output_dir)
            output_path.mkdir(parents=True, exist_ok=True)
            print(f"📁 出力ディレクトリ: {output_path}")
            
            # パイプライン初期化
            if not self.initialize_pipeline():
                return {"success": False, "error": "パイプライン初期化に失敗しました"}
            
            # 記事情報表示
            article_info = config["article_info"]
            print(f"🎯 記事: {article_info['title']}")
            print(f"🎨 スタイル: {article_info['style']}")
            print(f"📊 生成予定: {len(config['prompts'])}シーン × {variations}バリエーション")
            
            # バッチ生成開始
            start_time = datetime.now()
            all_generated_files = {}
            
            for prompt_config in config["prompts"]:
                name = prompt_config["name"]
                generated_files = self.generate_single_image(prompt_config, output_path, variations)
                all_generated_files[name] = generated_files
                self.generation_stats["total_images"] += len(generated_files)
                
                # 進行状況表示
                print(f"📈 進行状況: {self.generation_stats['successful_generations']}/{len(config['prompts']) * variations}")
            
            # 完了統計
            total_time = (datetime.now() - start_time).total_seconds()
            self.generation_stats["total_time"] = total_time
            
            print("\n🎉 バッチ画像生成完了!")
            print(f"📊 統計:")
            print(f"  - 総画像数: {self.generation_stats['total_images']}")
            print(f"  - 成功: {self.generation_stats['successful_generations']}")
            print(f"  - 失敗: {self.generation_stats['failed_generations']}")
            print(f"  - 総時間: {total_time:.1f}秒")
            print(f"  - 平均時間/枚: {total_time/max(1, self.generation_stats['successful_generations']):.1f}秒")
            
            return {
                "success": True,
                "generated_files": all_generated_files,
                "stats": self.generation_stats,
                "article_info": article_info
            }
            
        except Exception as e:
            print(f"❌ バッチ生成エラー: {e}")
            return {"success": False, "error": str(e)}

def main():
    """メイン実行関数"""
    parser = argparse.ArgumentParser(description='ContentFlow自動画像生成システム')
    parser.add_argument('--config', required=True, help='プロンプト設定JSONファイル')
    parser.add_argument('--output', required=True, help='画像出力ディレクトリ')
    parser.add_argument('--variations', type=int, default=1, help='各シーンの生成バリエーション数（デフォルト: 1）')
    parser.add_argument('--test', action='store_true', help='テストモード（1枚のみ生成）')
    
    args = parser.parse_args()
    
    print("🚀 ContentFlow自動画像生成システム開始")
    print("=" * 60)
    
    # テストモード
    if args.test:
        print("🧪 テストモード: 最初のプロンプトのみ生成")
        args.variations = 1
    
    # 生成実行
    generator = ContentFlowSDGenerator(test_mode=args.test)
    result = generator.generate_batch_images(args.config, args.output, args.variations)
    
    if result["success"]:
        print("\n✅ 全処理完了")
        # 結果をJSONで保存
        result_file = Path(args.output) / "generation_result.json"
        with open(result_file, 'w', encoding='utf-8') as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        print(f"📄 結果保存: {result_file}")
    else:
        print(f"\n❌ 処理失敗: {result.get('error', '不明なエラー')}")
        sys.exit(1)

if __name__ == "__main__":
    main()