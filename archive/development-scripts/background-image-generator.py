#!/usr/bin/env python3
"""
バックグラウンド画像生成スクリプト
Claude Codeタイムアウト制約（10分）を回避するため、長時間の画像生成タスクを
バックグラウンドで継続実行し、状態をJSON ファイルで管理する

使用方法:
1. セッション開始: python background-image-generator.py --session-id SESSION_ID --total 4
2. 状態確認: python background-image-generator.py --status
3. セッション継続: python background-image-generator.py --resume SESSION_ID
4. セッション停止: python background-image-generator.py --stop SESSION_ID
"""

import os
import sys
import json
import time
import argparse
import signal
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any
from diffusers import StableDiffusionXLPipeline
import torch
from PIL import Image

# プロジェクトディレクトリに移動
PROJECT_DIR = '/Users/gotohiro/Documents/user/Products/ContentFlow/sanity-edition'
os.chdir(PROJECT_DIR)

# 設定
MODEL_PATH = "/Users/gotohiro/Documents/user/Products/AI/models/diffusers/juggernaut-xl"
OUTPUT_DIR = "public/images/blog/auto-generated"
STATUS_FILE = "image-generation-status.json"
BACKGROUND_LOG_FILE = "background-generation.log"
PID_FILE = "background-generator.pid"

class BackgroundImageGenerator:
    def __init__(self):
        self.pipeline = None
        self.status_data = {}
        self.session_id = None
        self.running = True
        
        # 出力ディレクトリ作成
        os.makedirs(OUTPUT_DIR, exist_ok=True)
        
        # シグナルハンドラー設定（graceful shutdown）
        signal.signal(signal.SIGINT, self.signal_handler)
        signal.signal(signal.SIGTERM, self.signal_handler)
    
    def signal_handler(self, signum, frame):
        """シグナルハンドラー（プロセス終了時の処理）"""
        print(f"\n🛑 シグナル {signum} を受信しました。安全に終了中...")
        self.running = False
        self.cleanup()
        sys.exit(0)
    
    def log(self, message: str):
        """ログ出力（ファイル + コンソール）"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        log_entry = f"[{timestamp}] {message}"
        
        print(log_entry)
        
        with open(BACKGROUND_LOG_FILE, 'a', encoding='utf-8') as f:
            f.write(log_entry + '\n')
    
    def load_pipeline(self):
        """Stable Diffusion XL パイプライン読み込み"""
        if self.pipeline is not None:
            return self.pipeline
            
        self.log("🔧 Stable Diffusion XL パイプライン読み込み中...")
        
        try:
            self.pipeline = StableDiffusionXLPipeline.from_pretrained(
                MODEL_PATH,
                torch_dtype=torch.float16,
                use_safetensors=False  # .bin形式のため必須
            ).to("mps")
            
            self.log("✅ パイプライン読み込み完了")
            return self.pipeline
            
        except Exception as e:
            self.log(f"❌ パイプライン読み込みエラー: {str(e)}")
            raise
    
    def load_status(self) -> Dict[str, Any]:
        """状態ファイル読み込み"""
        if not os.path.exists(STATUS_FILE):
            return {}
        
        try:
            with open(STATUS_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            self.log(f"❌ 状態ファイル読み込みエラー: {str(e)}")
            return {}
    
    def save_status(self, status_data: Dict[str, Any]):
        """状態ファイル保存"""
        try:
            with open(STATUS_FILE, 'w', encoding='utf-8') as f:
                json.dump(status_data, f, ensure_ascii=False, indent=2)
            self.status_data = status_data
        except Exception as e:
            self.log(f"❌ 状態ファイル保存エラー: {str(e)}")
    
    def save_pid(self):
        """プロセスID保存"""
        try:
            with open(PID_FILE, 'w') as f:
                f.write(str(os.getpid()))
        except Exception as e:
            self.log(f"❌ PIDファイル保存エラー: {str(e)}")
    
    def remove_pid(self):
        """プロセスIDファイル削除"""
        try:
            if os.path.exists(PID_FILE):
                os.remove(PID_FILE)
        except Exception as e:
            self.log(f"❌ PIDファイル削除エラー: {str(e)}")
    
    def is_running(self) -> bool:
        """他のプロセスが実行中かチェック"""
        if not os.path.exists(PID_FILE):
            return False
        
        try:
            with open(PID_FILE, 'r') as f:
                pid = int(f.read().strip())
            
            # プロセスが存在するかチェック（Unix系OS）
            try:
                os.kill(pid, 0)
                return True
            except OSError:
                # プロセスが存在しない場合、PIDファイルを削除
                self.remove_pid()
                return False
                
        except Exception as e:
            self.log(f"❌ プロセスチェックエラー: {str(e)}")
            return False
    
    def start_session(self, session_id: str, total_images: int, 
                     image_prompts: Optional[List[Dict[str, Any]]] = None):
        """新しい画像生成セッション開始"""
        
        if self.is_running():
            self.log("❌ 既に他のバックグラウンドプロセスが実行中です")
            return False
        
        self.session_id = session_id
        self.save_pid()
        
        # デフォルトプロンプト設定
        if image_prompts is None:
            image_prompts = self.get_default_prompts(total_images)
        
        # 状態初期化
        status_data = {
            "status": "background_generating",
            "session_id": session_id,
            "startedAt": datetime.now().isoformat(),
            "total": total_images,
            "completed": 0,
            "failed": 0,
            "current_index": 0,
            "variations": [],
            "prompts": image_prompts,
            "background_process": {
                "pid": os.getpid(),
                "started_at": datetime.now().isoformat()
            }
        }
        
        self.save_status(status_data)
        self.log(f"🚀 バックグラウンドセッション開始: {session_id} ({total_images}枚)")
        
        return True
    
    def get_default_prompts(self, count: int) -> List[Dict[str, Any]]:
        """デフォルトプロンプト生成"""
        
        base_prompt = """A peaceful cozy room with modern technology (open laptop showing AI interface, 
        smart devices) harmoniously integrated with natural elements like plants and warm lighting, 
        empty comfortable seating area, representing the balance between AI efficiency and human leisure, 
        japanese minimalist interior design, warm atmosphere, professional photography"""
        
        negative_prompt = """person, people, human, man, woman, face, realistic human features, portrait, 
        character, figure, text, watermark, blurry, lowres, bad anatomy, bad hands, missing fingers, 
        extra digits, fewer digits, cropped, worst quality, low quality, normal quality, 
        jpeg artifacts, signature, username, artist name"""
        
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
        
        prompts = []
        for i in range(count):
            variation = style_variations[i % len(style_variations)]
            
            prompts.append({
                "index": i,
                "position": f"image_{i+1}",
                "prompt": f"{base_prompt}, {variation['style']}",
                "negative_prompt": negative_prompt,
                "style": variation['name'],
                "description": variation['description'],
                "parameters": {
                    "width": 1600,
                    "height": 896,
                    "num_inference_steps": 25,
                    "guidance_scale": 7.5
                }
            })
        
        return prompts
    
    def generate_single_image(self, prompt_config: Dict[str, Any]) -> Dict[str, Any]:
        """単一画像生成"""
        
        index = prompt_config['index']
        self.log(f"🎨 画像 {index + 1} 生成開始: {prompt_config['description']}")
        
        try:
            start_time = time.time()
            
            # 画像生成
            image = self.pipeline(
                prompt=prompt_config['prompt'],
                negative_prompt=prompt_config['negative_prompt'],
                **prompt_config['parameters']
            ).images[0]
            
            generation_time = time.time() - start_time
            
            # ファイル名生成
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"{prompt_config['position']}-{prompt_config['style']}-{timestamp}.png"
            filepath = os.path.join(OUTPUT_DIR, filename)
            
            # 画像保存
            image.save(filepath)
            
            result = {
                "index": index,
                "position": prompt_config['position'],
                "style": prompt_config['style'],
                "description": prompt_config['description'],
                "filename": filename,
                "filepath": filepath,
                "prompt": prompt_config['prompt'],
                "generation_time": f"{generation_time:.2f}秒",
                "resolution": f"{prompt_config['parameters']['width']}x{prompt_config['parameters']['height']}",
                "status": "success",
                "generated_at": datetime.now().isoformat()
            }
            
            self.log(f"✅ 画像 {index + 1} 生成完了: {filename} ({generation_time:.2f}秒)")
            return result
            
        except Exception as e:
            self.log(f"❌ 画像 {index + 1} 生成エラー: {str(e)}")
            
            return {
                "index": index,
                "position": prompt_config['position'],
                "style": prompt_config['style'],
                "description": prompt_config['description'],
                "status": "failed",
                "error": str(e),
                "failed_at": datetime.now().isoformat()
            }
    
    def run_background_generation(self):
        """バックグラウンド画像生成実行"""
        
        status_data = self.load_status()
        
        if not status_data or status_data.get('status') != 'background_generating':
            self.log("❌ 有効なバックグラウンド生成セッションが見つかりません")
            return False
        
        self.session_id = status_data.get('session_id')
        self.log(f"🔄 バックグラウンド生成継続: {self.session_id}")
        
        # パイプライン読み込み
        self.load_pipeline()
        
        prompts = status_data.get('prompts', [])
        current_index = status_data.get('current_index', 0)
        
        # 残りの画像を生成
        for i in range(current_index, len(prompts)):
            if not self.running:
                self.log("🛑 生成プロセス中断")
                break
            
            prompt_config = prompts[i]
            result = self.generate_single_image(prompt_config)
            
            # 状態更新
            status_data['variations'].append(result)
            status_data['current_index'] = i + 1
            
            if result['status'] == 'success':
                status_data['completed'] += 1
            else:
                status_data['failed'] += 1
            
            self.save_status(status_data)
            
            # 進捗レポート
            completed = status_data['completed']
            total = status_data['total']
            self.log(f"📊 進捗: {completed}/{total} 完了")
        
        # 生成完了
        if status_data['current_index'] >= len(prompts):
            status_data['status'] = 'completed'
            status_data['completedAt'] = datetime.now().isoformat()
            self.save_status(status_data)
            self.log(f"🎉 バックグラウンド生成完了: {self.session_id}")
        
        return True
    
    def cleanup(self):
        """クリーンアップ処理"""
        self.remove_pid()
        if hasattr(self, 'pipeline') and self.pipeline:
            del self.pipeline
            torch.cuda.empty_cache() if torch.cuda.is_available() else None

def show_status():
    """現在の状態表示"""
    if not os.path.exists(STATUS_FILE):
        print("📋 状態ファイルが見つかりません")
        return
    
    try:
        with open(STATUS_FILE, 'r', encoding='utf-8') as f:
            status_data = json.load(f)
        
        print("=" * 50)
        print("📊 バックグラウンド画像生成 状態レポート")
        print("=" * 50)
        
        print(f"状態: {status_data.get('status', 'unknown')}")
        print(f"セッションID: {status_data.get('session_id', 'N/A')}")
        print(f"開始時刻: {status_data.get('startedAt', 'N/A')}")
        print(f"進捗: {status_data.get('completed', 0)}/{status_data.get('total', 0)}")
        print(f"失敗: {status_data.get('failed', 0)}")
        
        if status_data.get('background_process'):
            bg_info = status_data['background_process']
            print(f"バックグラウンドPID: {bg_info.get('pid', 'N/A')}")
            print(f"プロセス開始: {bg_info.get('started_at', 'N/A')}")
        
        variations = status_data.get('variations', [])
        if variations:
            print(f"\n📸 生成済み画像 ({len(variations)}枚):")
            for var in variations:
                status_icon = "✅" if var.get('status') == 'success' else "❌"
                print(f"  {status_icon} {var.get('filename', var.get('description', 'Unknown'))}")
        
        print(f"\n📁 出力ディレクトリ: {OUTPUT_DIR}")
        print(f"📋 状態ファイル: {STATUS_FILE}")
        
    except Exception as e:
        print(f"❌ 状態ファイル読み込みエラー: {str(e)}")

def main():
    parser = argparse.ArgumentParser(description='バックグラウンド画像生成スクリプト')
    parser.add_argument('--session-id', help='セッションID')
    parser.add_argument('--total', type=int, help='生成画像数')
    parser.add_argument('--status', action='store_true', help='現在の状態表示')
    parser.add_argument('--resume', help='セッション継続（セッションID指定）')
    parser.add_argument('--stop', help='セッション停止（セッションID指定）')
    parser.add_argument('--daemon', action='store_true', help='デーモンモードで実行')
    
    args = parser.parse_args()
    
    generator = BackgroundImageGenerator()
    
    try:
        if args.status:
            show_status()
            
        elif args.session_id and args.total:
            # 新規セッション開始
            success = generator.start_session(args.session_id, args.total)
            if success:
                if args.daemon:
                    generator.run_background_generation()
                else:
                    print(f"🚀 セッション開始しました: {args.session_id}")
                    print("バックグラウンド実行: python background-image-generator.py --daemon")
            
        elif args.resume:
            # セッション継続
            generator.run_background_generation()
            
        elif args.daemon:
            # デーモンモード
            generator.run_background_generation()
            
        elif args.stop:
            # セッション停止
            if os.path.exists(PID_FILE):
                with open(PID_FILE, 'r') as f:
                    pid = int(f.read().strip())
                try:
                    os.kill(pid, signal.SIGTERM)
                    print(f"🛑 バックグラウンドプロセス停止: PID {pid}")
                except OSError:
                    print("❌ プロセスが見つかりません")
                generator.remove_pid()
            else:
                print("❌ 実行中のバックグラウンドプロセスが見つかりません")
        
        else:
            parser.print_help()
            
    except KeyboardInterrupt:
        print("\n🛑 ユーザーによって中断されました")
        generator.cleanup()
    except Exception as e:
        print(f"🚨 予期しないエラー: {str(e)}")
        generator.cleanup()
        sys.exit(1)
    finally:
        generator.cleanup()

if __name__ == "__main__":
    main()