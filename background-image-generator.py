#!/usr/bin/env python3
"""
ContentFlow V2 バックグラウンド画像生成システム
JSONファイルから画像プロンプトを読み取り、Stable Diffusionで自動生成
"""

import os
import sys
import json
import time
import argparse
import subprocess
from datetime import datetime
from pathlib import Path

class BackgroundImageGenerator:
    def __init__(self, session_id):
        self.session_id = session_id
        self.status_file = "image-generation-status.json"
        self.model_path = "/Users/gotohiro/Documents/user/Products/AI/models/diffusers/juggernaut-xl"
        self.python_path = "/Users/gotohiro/Documents/user/Products/stable-diffusion-local/venv310/bin/python"
        self.output_base_dir = f"public/images/blog/auto-generated/{session_id}"
        
        # Stable Diffusion環境の準備
        self.setup_stable_diffusion()
    
    def setup_stable_diffusion(self):
        """Stable Diffusion環境セットアップ"""
        try:
            from diffusers import StableDiffusionXLPipeline
            import torch
            
            print(f"📂 Stable Diffusionモデルロード中...")
            
            self.pipe = StableDiffusionXLPipeline.from_pretrained(
                self.model_path,
                torch_dtype=torch.float16,
                use_safetensors=False  # .bin形式のため必須
            ).to("mps")  # Apple Silicon最適化
            
            print(f"✅ Stable Diffusion環境セットアップ完了")
            
        except Exception as e:
            print(f"❌ Stable Diffusion環境セットアップエラー: {e}")
            sys.exit(1)
    
    def load_article_data(self):
        """記事JSONファイルから画像プロンプト情報を読み込み"""
        article_file = f"articles/{self.session_id}.json"
        
        if not os.path.exists(article_file):
            print(f"❌ 記事ファイルが見つかりません: {article_file}")
            return None
        
        try:
            with open(article_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # 新しい形式（metadata + article + imagePrompts）を確認
            if 'imagePrompts' not in data:
                print(f"❌ 記事ファイルに画像プロンプトが含まれていません")
                return None
            
            print(f"✅ 記事データ読み込み完了")
            print(f"📝 記事タイトル: {data['article']['title']}")
            print(f"🎨 画像プロンプト数: {len(data['imagePrompts'])}")
            
            return data
            
        except Exception as e:
            print(f"❌ 記事ファイル読み込みエラー: {e}")
            return None
    
    def update_status(self, status_data):
        """画像生成状況の更新"""
        try:
            with open(self.status_file, 'w', encoding='utf-8') as f:
                json.dump(status_data, f, indent=2, ensure_ascii=False)
            
        except Exception as e:
            print(f"⚠️ 状況更新エラー: {e}")
    
    def generate_image(self, prompt_data, output_dir):
        """単一画像生成"""
        print(f"\n🎨 画像生成開始: {prompt_data['position']}")
        print(f"📝 説明: {prompt_data['description']}")
        
        try:
            # 出力ディレクトリ作成
            os.makedirs(output_dir, exist_ok=True)
            
            # プロンプト構築
            full_prompt = f"{prompt_data['prompt']}, {prompt_data['style']}"
            
            # 超強化ネガティブプロンプト（人物描画完全防止）
            base_negative = prompt_data['negativePrompt']
            human_prevention = "person, people, human, man, woman, face, realistic human features, portrait, character, figure, body, silhouette, sitting person, standing person, anyone, somebody, individual"
            negative_prompt = f"{base_negative}, {human_prevention}"
            
            print(f"🔤 プロンプト: {full_prompt[:80]}...")
            print(f"🚫 人物除去プロンプト適用済み")
            
            # 画像生成実行
            print(f"⚡ 画像生成実行中...")
            start_time = time.time()
            
            params = prompt_data.get('parameters', {})
            
            image = self.pipe(
                prompt=full_prompt,
                negative_prompt=negative_prompt,
                width=params.get('width', 1600),
                height=params.get('height', 896),
                num_inference_steps=params.get('num_inference_steps', 25),
                guidance_scale=params.get('guidance_scale', 7.5)
            ).images[0]
            
            generation_time = time.time() - start_time
            
            # ファイル名生成・保存
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"{prompt_data['position']}-{timestamp}.png"
            output_path = os.path.join(output_dir, filename)
            
            image.save(output_path)
            
            print(f"✅ 画像生成完了")
            print(f"⏱️ 生成時間: {generation_time:.2f}秒")
            print(f"💾 保存先: {output_path}")
            print(f"📏 解像度: {params.get('width', 1600)}x{params.get('height', 896)}")
            
            return {
                "success": True,
                "output_path": output_path,
                "filename": filename,
                "generation_time": generation_time,
                "position": prompt_data['position'],
                "description": prompt_data['description']
            }
            
        except Exception as e:
            print(f"❌ 画像生成エラー ({prompt_data['position']}): {e}")
            return {
                "success": False,
                "error": str(e),
                "position": prompt_data['position']
            }
    
    def run_background_generation(self):
        """バックグラウンド画像生成メイン処理"""
        print(f"🚀 ContentFlow V2 バックグラウンド画像生成開始")
        print(f"📋 セッション ID: {self.session_id}")
        print("=" * 60)
        
        # 記事データ読み込み
        article_data = self.load_article_data()
        if not article_data:
            sys.exit(1)
        
        image_prompts = article_data['imagePrompts']
        
        # 初期状況設定
        status_data = {
            "sessionId": self.session_id,
            "status": "generating",
            "imageGeneration": {
                "startedAt": datetime.now().isoformat(),
                "total": len(image_prompts),
                "completed": 0,
                "failed": 0,
                "results": []
            },
            "prompts": image_prompts
        }
        
        self.update_status(status_data)
        
        # 各画像プロンプトに対して生成実行
        for i, prompt_data in enumerate(image_prompts, 1):
            print(f"\n📊 進捗: {i}/{len(image_prompts)} - {prompt_data['position']}")
            
            # 画像生成実行
            result = self.generate_image(prompt_data, self.output_base_dir)
            
            # 結果記録
            status_data["imageGeneration"]["results"].append(result)
            
            if result["success"]:
                status_data["imageGeneration"]["completed"] += 1
                print(f"✅ 画像 {i}/{len(image_prompts)} 生成成功")
            else:
                status_data["imageGeneration"]["failed"] += 1
                print(f"❌ 画像 {i}/{len(image_prompts)} 生成失敗")
            
            # 状況更新
            self.update_status(status_data)
        
        # 最終状況更新
        status_data["status"] = "completed" if status_data["imageGeneration"]["failed"] == 0 else "completed_with_errors"
        status_data["imageGeneration"]["completedAt"] = datetime.now().isoformat()
        
        self.update_status(status_data)
        
        # 結果サマリー
        print(f"\n🎉 バックグラウンド画像生成完了")
        print(f"✅ 成功: {status_data['imageGeneration']['completed']} 枚")
        print(f"❌ 失敗: {status_data['imageGeneration']['failed']} 枚")
        print(f"📂 出力ディレクトリ: {self.output_base_dir}")
        
        if status_data["imageGeneration"]["failed"] == 0:
            print(f"🎯 次のステップ: Sanity画像統合実行可能")
        else:
            print(f"⚠️ 一部の画像生成が失敗しました。ログを確認してください。")
        
        return status_data

def main():
    """メイン処理"""
    parser = argparse.ArgumentParser(description='ContentFlow V2 バックグラウンド画像生成')
    parser.add_argument('--session-id', required=True, help='セッション ID（記事ファイル名）')
    parser.add_argument('--output-dir', help='出力ディレクトリ（オプション）')
    
    args = parser.parse_args()
    
    try:
        # バックグラウンド画像生成実行
        generator = BackgroundImageGenerator(args.session_id)
        
        if args.output_dir:
            generator.output_base_dir = args.output_dir
        
        final_status = generator.run_background_generation()
        
        # 成功時は0、失敗時は1で終了
        exit_code = 0 if final_status["imageGeneration"]["failed"] == 0 else 1
        sys.exit(exit_code)
        
    except KeyboardInterrupt:
        print(f"\n⚠️ ユーザーによる中断")
        sys.exit(2)
    except Exception as e:
        print(f"\n❌ 予期しないエラー: {e}")
        sys.exit(3)

if __name__ == "__main__":
    main()