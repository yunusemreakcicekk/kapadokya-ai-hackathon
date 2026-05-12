'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { aiService } from '../../../services/aiService';
import { productService } from '../../../services/productService';
import { useAuth } from '../../../contexts/AuthContext';
import { formatPrice } from '../../../utils/formatters';
import { 
  Camera, Sparkles, Upload, Loader2, CheckCircle, ArrowLeft, Film, 
  Save, Image as ImageIcon, Tag, FileText, Palette, Hammer, BookOpen,
  User, MapPin
} from 'lucide-react';

// Kategoriye göre malzeme ve teknik seçenekleri
const CATEGORY_OPTIONS = {
  'Çömlek': {
    materials: ['Kızılırmak kırmızı kili', 'Yerel kırmızı kil', 'Doğal sır', 'Mineral pigmentler', 'Volkanik toprak'],
    techniques: ['Çömlekçi çarkı', 'El şekillendirme', 'Geleneksel fırınlama', 'Açık ateşte pişirme', '1050°C fırınlama']
  },
  'Vazo': {
    materials: ['Kızılırmak kırmızı kili', 'Beyaz kil', 'Doğal mineral pigmentler', 'Seramik sırı', 'Kobalt oksit'],
    techniques: ['Çömlekçi çarkı', 'El şekillendirme', 'Sırlama tekniği', 'Çift fırınlama', '1050°C fırınlama']
  },
  'Halı': {
    materials: ['Doğal yün', 'Bitkisel boyalar', 'Ceviz kabuğu boyası', 'Nar kabuğu boyası', 'Kök boya', 'İpek iplik'],
    techniques: ['El dokuma', 'Gördes düğümü', 'Doğal boyama', 'Çift düğüm tekniği', 'Tezgah dokuma']
  },
  'Kilim': {
    materials: ['Doğal yün', 'Bitkisel boyalar', 'Pamuk iplik', 'Keçi kılı', 'Kök boya'],
    techniques: ['Düz dokuma', 'El dokuma', 'Cicim tekniği', 'Zili tekniği', 'Sumak tekniği', 'Doğal boyama']
  },
  'Tabak': {
    materials: ['Beyaz kil', 'Kobalt oksit', 'Turkuaz pigment', 'Seramik sırı', 'Altın yaldız', 'Mineral boyalar'],
    techniques: ['El boyama', 'İznik sırlama tekniği', 'Çift fırınlama', 'Kalıp şekillendirme', 'Rölyef tekniği']
  }
};

const compressImage = (base64Str, maxWidth = 800, quality = 0.7) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
  });
};

async function generateStoryWithGemini(productName, category, materials, technique) {
  try {
    const res = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productName, category, materials, technique })
    });
    const data = await res.json();
    if (res.ok && data.story) return data.story;
  } catch (e) {
    console.log('Gemini API hatası:', e.message);
  }
  return '';
}

export default function AddProductPage() {
  const [step, setStep] = useState(1);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState(null);
  const [availableVideos, setAvailableVideos] = useState([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [generatingStory, setGeneratingStory] = useState(false);
  const { isAdmin, isSeller, user, seller } = useAuth();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const [uploadedFile, setUploadedFile] = useState(null);

  const [form, setForm] = useState({
    name: '',
    category: '',
    price: '',
    materials: [],
    technique: [],
    culturalStory: '',
    imageUrl: '',
    artisanName: '',
    productionLocation: ''
  });
  const [savedProductId, setSavedProductId] = useState(null);

  useEffect(() => {
    // Admin değilse, satıcının kendi bilgilerini otomatik doldur
    if (isSeller && !isAdmin) {
      setForm(prev => ({
        ...prev,
        artisanName: seller?.storeName || user?.name || '',
        productionLocation: seller?.address ? seller.address.split(',').pop().trim() : 'Nevşehir, Turkey'
      }));
    }
  }, [isSeller, isAdmin, seller, user]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (err) {
      handleDemoCapture();
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      ctx.drawImage(videoRef.current, 0, 0);
      const rawData = canvasRef.current.toDataURL('image/jpeg', 0.9);
      
      compressImage(rawData).then(compressed => {
        setCapturedImage(compressed);
        const stream = videoRef.current.srcObject;
        stream?.getTracks().forEach(t => t.stop());
        setCameraActive(false);
      });
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedFile(file);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result);
        setCapturedImage(compressed);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAIAnalyze = async () => {
    setAnalyzing(true);
    // Eğer dosya yüklendiyse dosyayı, yoksa base64'ü gönder
    const imageToSend = uploadedFile || capturedImage;
    const result = await aiService.analyzeProduct(imageToSend);

    if (!isAdmin && result.category !== 'Çömlek') {
      alert(`Ahmet Usta, siz bir Çömlek ustasısınız. Yapay zeka bu görseli '${result.category}' olarak algıladı. Sisteme yalnızca 'Çömlek' görselleri yükleyebilirsiniz.`);
      setAnalyzing(false);
      return;
    }

    setAiResult(result);
    setForm({
      ...form,
      name: result.suggestedName,
      category: result.category,
      materials: [],
      technique: [],
      culturalStory: '',
    });
    setAnalyzing(false);
    setStep(2);
  };

  // Gemini ile hikaye oluştur
  const handleGenerateStory = async () => {
    setGeneratingStory(true);
    const materialsText = form.materials.join(', ') || 'Belirtilmedi';
    const techniqueText = form.technique.join(', ') || 'Belirtilmedi';
    const story = await generateStoryWithGemini(form.name, form.category, materialsText, techniqueText);
    if (story) {
      setForm({ ...form, culturalStory: story });
    } else {
      alert('Hikaye oluşturulamadı, lütfen tekrar deneyin.');
    }
    setGeneratingStory(false);
  };

  // Checkbox toggle
  const toggleMaterial = (mat) => {
    setForm(prev => ({
      ...prev,
      materials: prev.materials.includes(mat)
        ? prev.materials.filter(m => m !== mat)
        : [...prev.materials, mat]
    }));
  };
  const toggleTechnique = (tech) => {
    setForm(prev => ({
      ...prev,
      technique: prev.technique.includes(tech)
        ? prev.technique.filter(t => t !== tech)
        : [...prev.technique, tech]
    }));
  };

  const categoryOptions = CATEGORY_OPTIONS[form.category] || null;

  const handleSave = async () => {
    try {
      const payload = {
        ...form,
        materials: form.materials.join(', '),
        technique: form.technique.join(', '),
        imageBase64: capturedImage || '',
      };
      delete payload.imageUrl;
      const savedProd = await productService.create(payload);
      setSavedProductId(savedProd.productId);

      // Seçilen videoyu ürüne ata
      if (selectedVideoId && savedProd.productId) {
        try {
          await fetch('/api/ai-videos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId: savedProd.productId, videoFolderId: selectedVideoId })
          });
        } catch (e) { console.warn('Video atama hatası:', e); }
      }

      setStep(3);
    } catch (error) {
      console.error("Kaydetme hatası:", error);
      alert("Ürün kaydedilirken bir hata oluştu.");
    }
  };

  const handleAIVideo = async () => {
    // Mevcut videoları kaydet (yeni video algılamak için)
    let existingIds = [];
    try {
      const res = await fetch('/api/ai-videos');
      const data = await res.json();
      existingIds = (data.videos || []).map(v => v.id);
    } catch (e) {}

    // AI-VİDEO sitesini aç
    window.open('http://localhost:5173', '_blank');
    fetch('/api/open-folder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'start-ai-video' })
    }).catch(() => {});

    // Yeni video oluşturulana kadar her 3 saniyede kontrol et (max 10 dakika)
    let attempts = 0;
    const maxAttempts = 200;
    const pollInterval = setInterval(async () => {
      attempts++;
      if (attempts > maxAttempts) { clearInterval(pollInterval); return; }
      try {
        const res = await fetch('/api/ai-videos');
        const data = await res.json();
        const newVideo = (data.videos || []).find(v => !existingIds.includes(v.id));
        if (newVideo) {
          setSelectedVideoId(newVideo.id);
          clearInterval(pollInterval);
        }
      } catch (e) {}
    }, 3000);
  };

  const loadAvailableVideos = async () => {
    setLoadingVideos(true);
    try {
      const res = await fetch('/api/ai-videos');
      const data = await res.json();
      setAvailableVideos(data.videos || []);
    } catch (e) { console.warn('Video listesi yüklenemedi'); }
    setLoadingVideos(false);
  };

  return (
    <div className="bg-background min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/seller" className="p-2 rounded-xl hover:bg-cream transition-colors">
            <ArrowLeft size={20} className="text-earth" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-deep-earth" style={{ fontFamily: 'var(--font-display)' }}>
              AI Destekli Ürün Kayıt
            </h1>
            <p className="text-sm text-earth">Kamera ile ürünü tanıtın, AI otomatik analiz etsin</p>
          </div>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-3 mb-8">
          <StepBadge n={1} label="Fotoğraf" active={step >= 1} current={step === 1} />
          <div className="flex-1 h-0.5 bg-stone/20" />
          <StepBadge n={2} label="AI Analiz" active={step >= 2} current={step === 2} />
          <div className="flex-1 h-0.5 bg-stone/20" />
          <StepBadge n={3} label="Kaydet" active={step >= 3} current={step === 3} />
        </div>

        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-sm border border-cream overflow-hidden">
            <div className="aspect-video bg-deep-earth relative flex items-center justify-center">
              {cameraActive ? (
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              ) : capturedImage ? (
                <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center text-stone">
                  <Camera size={64} className="mx-auto mb-4 opacity-40" />
                  <p className="text-lg font-medium">Kamera Alanı</p>
                  <p className="text-sm opacity-60">Ürününüzün fotoğrafını çekin veya yükleyin</p>
                </div>
              )}
              <canvas ref={canvasRef} className="hidden" />
            </div>

            <div className="p-6 space-y-4">
              <div className="flex flex-wrap gap-3">
                {!cameraActive && !capturedImage && (
                  <>
                    <button onClick={startCamera} className="btn-primary flex-1">
                      <Camera size={18} />
                      Kamerayı Aç
                    </button>
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button onClick={() => fileInputRef.current?.click()} className="btn-secondary flex-1">
                      <Upload size={18} />
                      Görsel Yükle
                    </button>
                  </>
                )}
                {cameraActive && (
                  <button onClick={capturePhoto} className="btn-primary w-full justify-center text-lg py-3.5">
                    <Camera size={20} />
                    Fotoğraf Çek
                  </button>
                )}
                {capturedImage && !analyzing && (
                  <>
                    <button onClick={() => { setCapturedImage(null); setCameraActive(false); }} className="btn-secondary flex-1">
                      Tekrar Çek
                    </button>
                    <button onClick={handleAIAnalyze} className="btn-primary flex-1 text-lg py-3">
                      <Sparkles size={18} />
                      AI ile Analiz Et
                    </button>
                  </>
                )}
                {analyzing && (
                  <div className="w-full text-center py-4">
                    <Loader2 size={32} className="animate-spin text-terracotta mx-auto mb-2" />
                    <p className="text-earth font-medium">AI ürünü analiz ediyor...</p>
                    <p className="text-xs text-earth/60 mt-1">Kategori otomatik tespit ediliyor</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            {/* AI Result */}
            {aiResult && (
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center">
                    <Sparkles size={18} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-dark-brown">AI Analiz Sonucu</h3>
                    <p className="text-sm text-earth">Güven oranı: %{Math.round(aiResult.confidence * 100)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/60 rounded-xl p-3">
                    <p className="text-xs text-earth font-medium">Tespit Edilen Kategori</p>
                    <p className="font-semibold text-dark-brown">{aiResult.category}</p>
                  </div>
                  <div className="bg-white/60 rounded-xl p-3">
                    <p className="text-xs text-earth font-medium">Önerilen İsim</p>
                    <p className="font-semibold text-dark-brown text-sm">{aiResult.suggestedName}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Form */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-cream space-y-5">
              <h3 className="font-semibold text-dark-brown text-lg flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
                <FileText size={18} className="text-terracotta" />
                Ürün Bilgileri
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Ürün Adı" icon={<Tag size={14} />} value={form.name} onChange={v => setForm({...form, name: v})} />
                <div>
                  <label className="text-sm font-medium text-dark-brown mb-1.5 flex items-center gap-1.5 block">
                    <Tag size={14} className="text-terracotta" /> Kategori
                  </label>
                  <select 
                    value={form.category} 
                    onChange={e => setForm({...form, category: e.target.value, materials: [], technique: []})}
                    className="w-full px-4 py-3 rounded-xl border border-stone/30 bg-background focus:outline-none focus:border-terracotta disabled:opacity-60 disabled:bg-stone/10"
                    disabled={!isAdmin}
                  >
                    <option value="">Seçin</option>
                    {['Çömlek','Vazo','Halı','Kilim','Tabak'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Fiyat (₺)" icon={<Tag size={14} />} value={form.price} onChange={v => setForm({...form, price: v})} type="number" placeholder="0.00" />
                
                {/* Üreten Kişi ve Üretilen Yer Alanları */}
                <div>
                  <label className="text-sm font-medium text-dark-brown mb-1.5 flex items-center gap-1.5 block">
                    <User size={14} className="text-terracotta" /> Üreten Kişi / Atölye
                  </label>
                  <input
                    type="text"
                    value={form.artisanName}
                    onChange={e => setForm({ ...form, artisanName: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-stone/30 bg-background focus:outline-none focus:border-terracotta disabled:opacity-60 disabled:bg-stone/10"
                    disabled={!isAdmin}
                    placeholder="Örn: Ahmet Usta"
                  />
                  {!isAdmin && <p className="text-[10px] text-earth mt-1">Bu alan profilinize göre otomatik doldurulmuştur.</p>}
                </div>
                
                <div>
                  <label className="text-sm font-medium text-dark-brown mb-1.5 flex items-center gap-1.5 block">
                    <MapPin size={14} className="text-terracotta" /> Üretim Yeri
                  </label>
                  <input
                    type="text"
                    value={form.productionLocation}
                    onChange={e => setForm({ ...form, productionLocation: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-stone/30 bg-background focus:outline-none focus:border-terracotta disabled:opacity-60 disabled:bg-stone/10"
                    disabled={!isAdmin}
                    placeholder="Örn: Avanos, Nevşehir"
                  />
                  {!isAdmin && <p className="text-[10px] text-earth mt-1">Bu alan profilinize göre otomatik doldurulmuştur.</p>}
                </div>
              </div>

              {/* Malzeme Seçimi (Checkbox) */}
              {categoryOptions && (
                <div>
                  <label className="text-sm font-medium text-dark-brown mb-2 flex items-center gap-1.5 block">
                    <Palette size={14} className="text-terracotta" /> Malzemeler
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {categoryOptions.materials.map(mat => (
                      <button
                        key={mat}
                        type="button"
                        onClick={() => toggleMaterial(mat)}
                        className={`px-3 py-2 rounded-xl text-sm font-medium transition-all border ${
                          form.materials.includes(mat) 
                            ? 'bg-terracotta text-white border-terracotta shadow-sm' 
                            : 'bg-cream/50 text-dark-brown border-stone/20 hover:border-terracotta/50'
                        }`}
                      >
                        {form.materials.includes(mat) ? '✓ ' : ''}{mat}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Üretim Tekniği Seçimi (Checkbox) */}
              {categoryOptions && (
                <div>
                  <label className="text-sm font-medium text-dark-brown mb-2 flex items-center gap-1.5 block">
                    <Hammer size={14} className="text-terracotta" /> Üretim Tekniği
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {categoryOptions.techniques.map(tech => (
                      <button
                        key={tech}
                        type="button"
                        onClick={() => toggleTechnique(tech)}
                        className={`px-3 py-2 rounded-xl text-sm font-medium transition-all border ${
                          form.technique.includes(tech) 
                            ? 'bg-terracotta text-white border-terracotta shadow-sm' 
                            : 'bg-cream/50 text-dark-brown border-stone/20 hover:border-terracotta/50'
                        }`}
                      >
                        {form.technique.includes(tech) ? '✓ ' : ''}{tech}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Kültürel Hikaye - Gemini ile oluştur */}
              <div>
                <label className="text-sm font-medium text-dark-brown mb-1.5 flex items-center gap-1.5 block">
                  <BookOpen size={14} className="text-terracotta" /> Kültürel Hikaye
                </label>
                <textarea
                  value={form.culturalStory}
                  onChange={e => setForm({...form, culturalStory: e.target.value})}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-stone/30 bg-background focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 resize-none"
                  placeholder="Gemini AI ile otomatik oluşturun veya kendiniz yazın..."
                />
                <button
                  type="button"
                  onClick={handleGenerateStory}
                  disabled={generatingStory}
                  className="mt-2 flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl text-sm font-medium hover:from-blue-600 hover:to-indigo-700 transition-all disabled:opacity-50"
                >
                  {generatingStory ? (
                    <><Loader2 size={14} className="animate-spin" /> Gemini yazıyor...</>
                  ) : (
                    <><Sparkles size={14} /> Gemini AI ile Hikaye Oluştur</>
                  )}
                </button>
              </div>



              {/* AI Video Section */}
              <div className="bg-purple-50 rounded-xl p-5 border border-purple-200">
                <h4 className="font-semibold text-dark-brown mb-3 flex items-center gap-2">
                  <Film size={18} className="text-purple-600" />
                  AI Video
                </h4>
                <div className="flex gap-2 mb-3">
                  <button 
                    onClick={handleAIVideo}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all text-sm"
                  >
                    <Film size={16} />
                    Video Oluştur
                  </button>
                  <button 
                    onClick={loadAvailableVideos}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white border-2 border-purple-300 text-purple-700 rounded-xl font-semibold hover:bg-purple-50 transition-all text-sm"
                  >
                    {loadingVideos ? <Loader2 size={16} className="animate-spin" /> : <Film size={16} />}
                    Video Seç
                  </button>
                </div>

                {/* Seçilen Video */}
                {selectedVideoId && (
                  <div className="bg-white rounded-lg p-3 border border-purple-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
                        <Film size={14} className="text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-dark-brown">Video seçildi</p>
                        <p className="text-xs text-earth">{selectedVideoId}</p>
                      </div>
                    </div>
                    <button onClick={() => setSelectedVideoId(null)} className="text-xs text-red-500 hover:text-red-700">Kaldır</button>
                  </div>
                )}

                {/* Video Listesi */}
                {availableVideos.length > 0 && !selectedVideoId && (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {availableVideos.map(v => (
                      <button
                        key={v.id}
                        onClick={() => { setSelectedVideoId(v.id); setAvailableVideos([]); }}
                        className="w-full flex items-center justify-between p-3 rounded-lg border border-stone/20 hover:border-purple-400 hover:bg-purple-50/50 transition-all text-left"
                      >
                        <div>
                          <p className="text-sm font-medium text-dark-brown">{v.id}</p>
                          <p className="text-xs text-earth">{new Date(v.createdAt).toLocaleString('tr-TR')} • {(v.size / 1024 / 1024).toFixed(1)} MB</p>
                        </div>
                        {v.productId && <span className="text-xs bg-stone/30 text-earth px-2 py-0.5 rounded-full">Atanmış</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setStep(1)} className="btn-secondary flex-1 justify-center">Geri</button>
                <button onClick={handleSave} className="btn-primary flex-1 justify-center text-lg py-3">
                  <Save size={18} />
                  Ürünü Kaydet
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="bg-white rounded-2xl p-8 lg:p-12 shadow-sm border border-cream text-center animate-fade-in-up">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} className="text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-deep-earth mb-2" style={{ fontFamily: 'var(--font-display)' }}>
              Ürün Kaydedildi!
            </h2>
            <p className="text-earth mb-6">{form.name}</p>
            
            <div className="bg-cream/30 border border-stone/20 rounded-2xl p-6 mb-8 max-w-sm mx-auto">
              <p className="text-sm font-medium text-dark-brown">Ürününüzün Benzersiz RFID Kimliği</p>
              <div className="bg-white px-4 py-3 rounded-xl border border-stone/30 mt-3">
                <p className="text-xl font-mono font-bold text-terracotta tracking-wider">{savedProductId || 'Yükleniyor...'}</p>
              </div>
              <p className="text-xs text-earth mt-3 leading-relaxed">
                Bu kimliği RFID sayfasına girerek ürünü sorgulayabilirsiniz. 
              </p>
            </div>

            <div className="flex flex-wrap gap-3 justify-center">
              <button onClick={() => { setStep(1); setCapturedImage(null); setAiResult(null); setForm({ name:'', category:'', price:'', materials:[], technique:[], culturalStory:'', imageUrl:'' }); setSavedProductId(null); }} className="btn-secondary">
                Yeni Ürün Ekle
              </button>
              <Link href="/seller" className="btn-primary">
                Panele Dön
              </Link>
            </div>
          </div>
        )}
      </div>


    </div>
  );
}

function StepBadge({ n, label, active, current }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
        current ? 'bg-terracotta text-white' : active ? 'bg-green-500 text-white' : 'bg-cream text-earth'
      }`}>{active && !current ? <CheckCircle size={14} /> : n}</div>
      <span className={`text-sm font-medium hidden sm:block ${current ? 'text-terracotta' : 'text-earth'}`}>{label}</span>
    </div>
  );
}

function FormField({ label, icon, value, onChange, type = 'text', placeholder }) {
  return (
    <div>
      <label className="text-sm font-medium text-dark-brown mb-1.5 flex items-center gap-1.5 block">
        <span className="text-terracotta">{icon}</span> {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl border border-stone/30 bg-background focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/20"
      />
    </div>
  );
}
