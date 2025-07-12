#!/usr/bin/env python3
"""
Stable Diffusion環境動作確認テスト
ContentFlow統合前の基本動作チェック
"""

import os
import sys
import time

def test_imports():
    """必要ライブラリのインポートテスト"""
    print("🔍 ライブラリインポートテスト開始...")
    
    try:
        import torch
        print(f"✅ PyTorch: {torch.__version__}")
        
        # MPS（Metal Performance Shaders）対応確認
        if torch.backends.mps.is_available():
            print("✅ MPS (Metal Performance Shaders): 利用可能")
        else:
            print("❌ MPS: 利用不可")
            
    except ImportError as e:
        print(f"❌ PyTorch インポートエラー: {e}")
        return False
    
    try:
        from diffusers import StableDiffusionXLPipeline
        print("✅ Diffusers: インポート成功")
    except ImportError as e:
        print(f"❌ Diffusers インポートエラー: {e}")
        return False
    
    return True

def test_model_loading():
    """モデル読み込みテスト"""
    print("\n🤖 モデル読み込みテスト開始...")
    
    model_path = "/Users/gotohiro/Documents/user/Products/AI/models/diffusers/juggernaut-xl"
    
    if not os.path.exists(model_path):
        print(f"❌ モデルパスが見つかりません: {model_path}")
        return False
    
    try:
        from diffusers import StableDiffusionXLPipeline
        import torch
        
        print(f"📂 モデルロード中: {model_path}")
        start_time = time.time()
        
        pipe = StableDiffusionXLPipeline.from_pretrained(
            model_path,
            torch_dtype=torch.float16,
            use_safetensors=False  # .bin形式のため
        )
        
        # MPSデバイスに移動
        pipe = pipe.to("mps")
        
        load_time = time.time() - start_time
        print(f"✅ モデルロード完了: {load_time:.2f}秒")
        
        # メモリ使用量確認
        if hasattr(torch.mps, 'current_allocated_memory'):
            memory_mb = torch.mps.current_allocated_memory() / 1024 / 1024
            print(f"📊 MPS メモリ使用量: {memory_mb:.0f}MB")
        
        return True
        
    except Exception as e:
        print(f"❌ モデルロードエラー: {e}")
        return False

def main():
    """メイン処理"""
    print("🚀 Stable Diffusion環境動作確認テスト")
    print("=" * 50)
    
    # ライブラリテスト
    if not test_imports():
        print("\n❌ ライブラリテスト失敗")
        sys.exit(1)
    
    # モデルロードテスト
    if not test_model_loading():
        print("\n❌ モデルロードテスト失敗")
        sys.exit(1)
    
    print("\n✅ 全テスト成功！Stable Diffusion環境正常動作")
    print("🎯 次のステップ: 単一画像生成テスト実行可能")

if __name__ == "__main__":
    main()