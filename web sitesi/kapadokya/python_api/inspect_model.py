import torch
import sys

print("=" * 60)
print("HACKATHON MODEL ANALİZİ")
print("=" * 60)

try:
    # Modeli yükle
    checkpoint = torch.load("hackathon_model.pth", map_location='cpu', weights_only=False)
    
    print(f"\nDosya tipi: {type(checkpoint)}")
    
    if isinstance(checkpoint, dict):
        print(f"\nAnahtarlar: {list(checkpoint.keys())}")
        
        # Kategori bilgisi var mı?
        for key in ['classes', 'class_names', 'labels', 'categories', 'idx_to_class', 'class_to_idx', 'num_classes']:
            if key in checkpoint:
                print(f"\n>>> {key}: {checkpoint[key]}")
        
        # Model state_dict var mı?
        if 'model_state_dict' in checkpoint or 'state_dict' in checkpoint:
            sd_key = 'model_state_dict' if 'model_state_dict' in checkpoint else 'state_dict'
            sd = checkpoint[sd_key]
            print(f"\nState dict anahtarları ({len(sd)} adet):")
            for i, k in enumerate(sd.keys()):
                if i < 10:
                    print(f"  {k}: {sd[k].shape}")
                elif i == 10:
                    print(f"  ... ve {len(sd) - 10} adet daha")
            
            # Son katmanı bul (classifier/fc)
            last_keys = list(sd.keys())
            for k in reversed(last_keys):
                if 'weight' in k and ('fc' in k or 'classifier' in k or 'head' in k or 'linear' in k):
                    print(f"\n>>> Son sınıflandırma katmanı: {k}")
                    print(f">>> Çıkış boyutu (kategori sayısı): {sd[k].shape[0]}")
                    print(f">>> Giriş boyutu: {sd[k].shape[1]}")
                    break
        
        # Epoch, accuracy vs bilgileri
        for key in ['epoch', 'accuracy', 'best_acc', 'best_accuracy', 'loss', 'config', 'args', 'hyperparameters']:
            if key in checkpoint:
                print(f"\n>>> {key}: {checkpoint[key]}")
                
    else:
        # Direkt model objesi kaydedilmiş
        print(f"\nModel doğrudan kaydedilmiş (tam model)")
        print(f"\nModel yapısı:\n{checkpoint}")
        
        # Son katmanı bul
        if hasattr(checkpoint, 'fc'):
            print(f"\n>>> fc katmanı: {checkpoint.fc}")
        elif hasattr(checkpoint, 'classifier'):
            print(f"\n>>> classifier katmanı: {checkpoint.classifier}")
        elif hasattr(checkpoint, 'head'):
            print(f"\n>>> head katmanı: {checkpoint.head}")

except Exception as e:
    print(f"\nHATA: {e}")
    import traceback
    traceback.print_exc()
