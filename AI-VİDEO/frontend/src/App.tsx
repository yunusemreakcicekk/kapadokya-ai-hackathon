import { useState, useRef, useEffect } from 'react'
import './index.css'

const API_BASE_URL = 'http://localhost:8001'

interface MediaItem {
  id: string;
  file: File;
  type: 'video' | 'image';
  previewUrl: string;
  duration: number;
  trimStart: number;
  trimEnd: number | '';
  filter: string;
  transition: string;
  text: string;
  textStart: number;
  textEnd: number | '';
  textColor: string;
  textPosition: 'top' | 'center' | 'bottom';
  fontSize: number;
}

const FILTER_OPTIONS = [
  {
    id: 'none',
    title: 'Orijinal (Filtresiz)',
    image: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=400&q=80',
    icon: '🚫'
  },
  {
    id: 'cinematic',
    title: 'Sinematik',
    subtitle: '(Kontrast & Doygunluk)',
    image: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=400&q=80',
    icon: '🎬'
  },
  {
    id: 'vibrant',
    title: 'Canlı Renkler',
    image: 'https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?auto=format&fit=crop&w=400&q=80',
    icon: '🎨'
  },
  {
    id: 'bw',
    title: 'Siyah & Beyaz',
    subtitle: '(Dramatik)',
    image: 'https://images.unsplash.com/photo-1493106819501-66d381c466f1?auto=format&fit=crop&w=400&q=80',
    icon: '🎭'
  },
  {
    id: 'soft_glow',
    title: 'Soft Glow',
    image: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=400&q=80',
    icon: '✨'
  },
  {
    id: 'viral_reels',
    title: 'Viral Reels',
    image: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=400&q=80',
    icon: '📱'
  },
  {
    id: 'hollywood',
    title: 'Hollywood',
    image: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=400&q=80',
    icon: '🌟'
  },
  {
    id: 'warm_sunset',
    title: 'Warm Sunset',
    image: 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?auto=format&fit=crop&w=400&q=80',
    icon: '🌅'
  },
  {
    id: 'natural_soft',
    title: 'Natural Soft',
    image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=400&q=80',
    icon: '🌿'
  },
  {
    id: 'vintage',
    title: 'Nostaljik',
    image: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=400&q=80',
    icon: '📼'
  }
];

const TRANSITION_OPTIONS = [
  {
    id: 'none',
    title: 'Keskin Geçiş',
    subtitle: '(Yok)',
    image: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=400&q=80',
    icon: '⚡'
  },
  {
    id: 'fade',
    title: 'Yumuşak Kararma',
    subtitle: '(Fade)',
    image: 'https://images.unsplash.com/photo-1558470598-a5dda9640f68?auto=format&fit=crop&w=400&q=80',
    icon: '🌫️'
  },
  {
    id: 'zoompan',
    title: 'Yakınlaşarak Giriş',
    subtitle: '(Zoom)',
    image: 'https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?auto=format&fit=crop&w=400&q=80',
    icon: '🔍',
    onlyImage: true
  },
  {
    id: 'slide',
    title: 'Kayarak Geçiş',
    subtitle: '(Slide)',
    image: 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=400&q=80',
    icon: '➡️'
  },
  {
    id: 'blur',
    title: 'Bulanık Geçiş',
    subtitle: '(Blur)',
    image: 'https://images.unsplash.com/photo-1550684847-75bdda21cc95?auto=format&fit=crop&w=400&q=80',
    icon: '🌫️'
  },
  {
    id: 'wipe',
    title: 'Silinerek Geçiş',
    subtitle: '(Wipe)',
    image: 'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?auto=format&fit=crop&w=400&q=80',
    icon: '🧹'
  },
  {
    id: 'rotate',
    title: 'Dönerek Geçiş',
    subtitle: '(Rotate)',
    image: 'https://images.unsplash.com/photo-1604871000636-074fa5117945?auto=format&fit=crop&w=400&q=80',
    icon: '🔄'
  }
];

const IMAGE_DURATION_SECONDS = 4;
const SPEECH_LIMITS_BY_LANGUAGE: Record<string, { wordsPerSecond: number; charsPerSecond: number }> = {
  Turkish: { wordsPerSecond: 2.05, charsPerSecond: 15 },
  English: { wordsPerSecond: 2.25, charsPerSecond: 15 },
  German: { wordsPerSecond: 1.85, charsPerSecond: 14 },
  Spanish: { wordsPerSecond: 2.15, charsPerSecond: 15 },
  French: { wordsPerSecond: 2.05, charsPerSecond: 14 },
  Arabic: { wordsPerSecond: 1.9, charsPerSecond: 12 },
};

const PRODUCT_OPTIONS = [
  { value: 'seramik', label: 'Seramik' },
  { value: 'vazo', label: 'Vazo' },
  { value: 'çömlek', label: 'Çömlek' },
  { value: 'tabak', label: 'Tabak' },
  { value: 'halı', label: 'Halı' },
  { value: 'kilim', label: 'Kilim' },
];

const getStoryLimits = (duration: number, language: string) => {
  const pacing = SPEECH_LIMITS_BY_LANGUAGE[language] ?? SPEECH_LIMITS_BY_LANGUAGE.English;
  const safeDuration = Math.max(0, duration);

  if (!safeDuration) {
    return { maxWords: 0, maxChars: 0 };
  }

  return {
    maxWords: Math.max(8, Math.floor(safeDuration * pacing.wordsPerSecond)),
    maxChars: Math.max(50, Math.floor(safeDuration * pacing.charsPerSecond)),
  };
};

const getVideoDuration = (file: File): Promise<number> => {
  return new Promise(resolve => {
    const video = document.createElement('video');
    const objectUrl = URL.createObjectURL(file);

    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(Number.isFinite(video.duration) ? video.duration : 0);
    };
    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(0);
    };
    video.src = objectUrl;
  });
};

function App() {
  const [mediaList, setMediaList] = useState<MediaItem[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [resultVideoUrl, setResultVideoUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sosyal Medya Hesapları State
  const [socialAccounts, setSocialAccounts] = useState({
    youtube: false,
    instagram: false,
    tiktok: false
  });

  // Paylaşım Modalı State
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareData, setShareData] = useState({
    platforms: { youtube: false, instagram: false, tiktok: false },
    title: "İnanılmaz El Yapımı Seramik Yapım Süreci 🎨✨",
    hashtags: "#pottery #handmade #art #relaxing",
    isSharing: false,
    shareSuccess: false
  });

  // Satici bilgileri
  const [sellerName, setSellerName] = useState("Kapadokya Seramik Evi")
  const [buyerCountry, setBuyerCountry] = useState("USA")
  const [targetLanguage, setTargetLanguage] = useState("English")
  const [productType, setProductType] = useState("seramik")
  const [storyMode, setStoryMode] = useState<"ai" | "manual" | "ai_assisted">("ai")
  const [manualSourceText, setManualSourceText] = useState("")
  const [manualStoryText, setManualStoryText] = useState("")
  const [aiPrompt, setAiPrompt] = useState("")
  const [isGeneratingStory, setIsGeneratingStory] = useState(false)
  const [isTranslatingManual, setIsTranslatingManual] = useState(false)

  // Resim Oluşturma State
  const [imagePrompt, setImagePrompt] = useState("")
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null)

  const handleGenerateAIImage = async () => {
    if (!imagePrompt.trim()) return alert("Lütfen bir resim açıklaması girin.");
    setIsGeneratingImage(true);
    try {
      const formData = new FormData();
      formData.append('prompt', imagePrompt);
      
      const response = await fetch(`${API_BASE_URL}/api/generate_image`, {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      if (result.status === 'success') {
        setGeneratedImageUrl(result.image_url);
      } else {
        alert("Resim oluşturulurken hata: " + result.message);
      }
    } catch (error) {
      alert("Sunucuya bağlanılamadı. Backend çalışıyor mu?");
      console.error(error);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const addGeneratedImageToMedia = async () => {
    if (!generatedImageUrl) return;
    try {
      const response = await fetch(generatedImageUrl);
      const blob = await response.blob();
      const file = new File([blob], `generated_${Date.now()}.jpg`, { type: 'image/jpeg' });
      
      const newItem: MediaItem = {
        id: Math.random().toString(36).substring(7),
        file,
        type: 'image',
        previewUrl: URL.createObjectURL(blob),
        duration: IMAGE_DURATION_SECONDS,
        trimStart: 0,
        trimEnd: '',
        filter: 'cinematic',
        transition: 'fade',
        text: '',
        textStart: 0,
        textEnd: '',
        textColor: '#ffffff',
        textPosition: 'center',
        fontSize: 80
      };
      setMediaList([...mediaList, newItem]);
      setGeneratedImageUrl(null);
      setImagePrompt("");
    } catch (error) {
      alert("Resim medyaya eklenirken bir hata oluştu.");
    }
  };

  const handleGenerateStory = async () => {
    if (!aiPrompt.trim()) return alert("Lütfen anahtar kelimeleri veya özetinizi girin.");
    if (mediaList.length === 0) return alert("Önce video veya görsel yükleyin. Hikaye, toplam video süresine göre oluşturulacak.");
    setIsGeneratingStory(true);

    const targetDuration = getEstimatedVideoDuration();
    const storyLimits = getStoryLimits(targetDuration, targetLanguage);
    
    const formData = new FormData();
    formData.append('seller_name', sellerName);
    formData.append('buyer_country', buyerCountry);
    formData.append('target_language', targetLanguage);
    formData.append('product_type', productType);
    formData.append('prompt', aiPrompt);
    formData.append('current_story', manualStoryText);
    formData.append('target_duration', String(Math.round(targetDuration)));
    formData.append('max_words', String(storyLimits.maxWords));
    formData.append('max_chars', String(storyLimits.maxChars));

    try {
      const response = await fetch(`${API_BASE_URL}/api/generate_story`, {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      if (result.status === 'success') {
        setManualStoryText(result.story.slice(0, storyLimits.maxChars || undefined));
      } else {
        alert('Hata: ' + result.message);
      }
    } catch (error) {
      alert('Sunucuya bağlanılamadı. Backend çalışıyor mu?');
      console.error(error);
    } finally {
      setIsGeneratingStory(false);
    }
  };

  useEffect(() => {
    // OAuth geri dönüşünü kontrol et
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('youtube_connected') === 'true') {
      setSocialAccounts(prev => ({ ...prev, youtube: true }));
      window.history.replaceState({}, document.title, "/");
    }
  }, []);

  const handleSocialLogin = (platform: 'youtube' | 'instagram' | 'tiktok') => {
    if (platform === 'youtube') {
      // Backend'deki gerçek Google OAuth sayfasına yönlendir
      window.location.href = `${API_BASE_URL}/api/auth/youtube/login`;
    } else {
      // Diğerleri şimdilik simülasyon
      alert(`${platform.toUpperCase()} ile giriş yapılıyor... (Simülasyon)`);
      setTimeout(() => {
        setSocialAccounts(prev => ({ ...prev, [platform]: true }));
      }, 1000);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newItems: MediaItem[] = await Promise.all(Array.from(e.target.files).map(async file => {
        const isVideo = file.type.startsWith('video');
        return {
          id: Math.random().toString(36).substring(7),
          file,
          type: isVideo ? 'video' : 'image',
          previewUrl: URL.createObjectURL(file),
          duration: isVideo ? await getVideoDuration(file) : IMAGE_DURATION_SECONDS,
          trimStart: 0,
          trimEnd: '',
          filter: 'cinematic',
          transition: 'fade',
          text: '',
          textStart: 0,
          textEnd: '',
          textColor: '#ffffff',
          textPosition: 'center',
          fontSize: 80
        };
      }))
      setMediaList([...mediaList, ...newItems])
    }
  }

  const getEstimatedVideoDuration = () => {
    return mediaList.reduce((total, item) => {
      if (item.type === 'image') return total + IMAGE_DURATION_SECONDS;

      const trimStart = Number(item.trimStart) || 0;
      const trimEnd = item.trimEnd === '' ? item.duration : Number(item.trimEnd);
      const usableEnd = trimEnd && trimEnd > trimStart ? trimEnd : item.duration;
      const clipDuration = Math.max(0, usableEnd - trimStart);

      return total + clipDuration;
    }, 0);
  }

  const handleTargetLanguageChange = (nextLanguage: string) => {
    setTargetLanguage(nextLanguage);

    if (storyMode !== 'manual') return;

    const limits = getStoryLimits(getEstimatedVideoDuration(), nextLanguage);
    if (nextLanguage === 'Turkish') {
      setManualStoryText(limits.maxChars ? manualSourceText.slice(0, limits.maxChars) : manualSourceText);
    } else {
      setManualStoryText("");
    }
  }

  const handleManualSourceChange = (value: string) => {
    setManualSourceText(value);

    if (targetLanguage === 'Turkish') {
      const limits = getStoryLimits(getEstimatedVideoDuration(), targetLanguage);
      setManualStoryText(limits.maxChars ? value.slice(0, limits.maxChars) : value);
    } else {
      setManualStoryText("");
    }
  }

  const handleTranslateManualStory = async () => {
    if (mediaList.length === 0) return alert("Önce video veya görsel yükleyin. Çeviri, toplam süre limitine göre hazırlanacak.");
    if (!manualSourceText.trim()) return alert("Lütfen üst alana Türkçe metin yazın.");

    const targetDuration = getEstimatedVideoDuration();
    const limits = getStoryLimits(targetDuration, targetLanguage);

    if (targetLanguage === 'Turkish') {
      setManualStoryText(limits.maxChars ? manualSourceText.slice(0, limits.maxChars) : manualSourceText);
      return;
    }

    setIsTranslatingManual(true);
    try {
      const formData = new FormData();
      formData.append('text', manualSourceText);
      formData.append('target_language', targetLanguage);
      formData.append('product_type', productType);
      formData.append('target_duration', String(Math.round(targetDuration)));
      formData.append('max_words', String(limits.maxWords));
      formData.append('max_chars', String(limits.maxChars));

      const response = await fetch(`${API_BASE_URL}/api/translate_story`, {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();

      if (result.status === 'success') {
        setManualStoryText(limits.maxChars ? result.text.slice(0, limits.maxChars) : result.text);
      } else {
        alert('Hata: ' + result.message);
      }
    } catch (error) {
      alert('Sunucuya bağlanılamadı. Backend çalışıyor mu?');
      console.error(error);
    } finally {
      setIsTranslatingManual(false);
    }
  }

  const updateMediaItem = (id: string, field: keyof MediaItem, value: any) => {
    setMediaList(mediaList.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  const removeMediaItem = (id: string) => {
    setMediaList(mediaList.filter(item => item.id !== id))
  }

  const moveMediaItem = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === mediaList.length - 1) return;
    
    const newList = [...mediaList];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    
    const temp = newList[index];
    newList[index] = newList[swapIndex];
    newList[swapIndex] = temp;
    
    setMediaList(newList);
  }

  const handleGenerate = async () => {
    if (mediaList.length === 0) return alert('Lütfen en az bir medya dosyası yükleyin.')

    const targetDuration = getEstimatedVideoDuration()
    const storyLimits = getStoryLimits(targetDuration, targetLanguage)
    const manualStoryForVideo = storyMode === 'manual' && targetLanguage === 'Turkish' && !manualStoryText.trim()
      ? manualSourceText
      : manualStoryText

    if (storyMode === 'manual') {
      if (!manualSourceText.trim()) return alert('Lütfen üst alana Türkçe metin yazın.')
      if (targetLanguage !== 'Turkish' && !manualStoryText.trim()) return alert('Önce Türkçe metni seçili dile çevirin. Video oluştururken alt kutudaki çevrilmiş metin kullanılacak.')
    }
    
    setIsGenerating(true)
    setResultVideoUrl(null)

    const formData = new FormData()
    formData.append('seller_name', sellerName)
    formData.append('buyer_country', buyerCountry)
    formData.append('target_language', targetLanguage)
    formData.append('product_type', productType)
    formData.append('story_mode', storyMode === 'ai_assisted' ? 'manual' : storyMode)
    formData.append('manual_story', storyLimits.maxChars ? manualStoryForVideo.slice(0, storyLimits.maxChars) : manualStoryForVideo)
    formData.append('target_duration', String(Math.round(targetDuration)))
    formData.append('max_words', String(storyLimits.maxWords))
    formData.append('max_chars', String(storyLimits.maxChars))

    // Prepare JSON metadata for each file
    const mediaMetadata = mediaList.map(item => ({
      id: item.id,
      filename: item.file.name,
      type: item.type,
      duration: item.duration,
      trimStart: item.trimStart,
      trimEnd: item.trimEnd,
      filter: item.filter,
      transition: item.transition,
      text: item.text,
      textStart: item.textStart,
      textEnd: item.textEnd,
      textColor: item.textColor,
      textPosition: item.textPosition,
      fontSize: item.fontSize
    }))

    formData.append('metadata', JSON.stringify(mediaMetadata))

    // Append actual files
    mediaList.forEach(item => {
      formData.append('files', item.file)
    })

    try {
      const response = await fetch(`${API_BASE_URL}/api/generate`, {
        method: 'POST',
        body: formData,
      })
      
      const result = await response.json()
      if (result.status === 'success') {
        // Video URL is generated
        setResultVideoUrl(`${API_BASE_URL}/${result.data.video_path}`)
      } else {
        alert('Hata: ' + result.message)
      }
    } catch (error) {
      alert('Sunucuya bağlanılamadı. Backend çalışıyor mu?')
      console.error(error)
    } finally {
      setIsGenerating(false)
    }
  }

  const estimatedVideoDuration = getEstimatedVideoDuration();
  const storyLimits = getStoryLimits(estimatedVideoDuration, targetLanguage);
  const isStoryOverLimit = Boolean(storyLimits.maxChars && manualStoryText.length > storyLimits.maxChars);
  const isStoryLocked = mediaList.length === 0;

  return (
    <div className="app-container">
      <header className="header">
        <h1>KENDİ REKLAMINI KENDİN YAP!</h1>
        <p>Görsellerinizi ve videolarınızı yapay zeka ile harika reklamlara dönüştürün</p>
      </header>

      <div className="glass-panel">
        <h2>🔗 Sosyal Medya Hesapları</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Videoları tek tuşla paylaşabilmek için hesaplarınızı bağlayın.</p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          
          <div className="social-card" style={{ flex: 1, minWidth: '200px', background: 'rgba(255,0,0,0.1)', border: '1px solid rgba(255,0,0,0.3)', padding: '1.5rem', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
              <img src="/youtube.png" alt="YouTube Logo" style={{ height: '50px', width: 'auto', objectFit: 'contain' }} />
            </div>
            <h3 style={{ marginBottom: '1rem' }}>YouTube</h3>
            {socialAccounts.youtube ? (
              <span style={{ color: '#4ade80', fontWeight: 'bold' }}>✅ Bağlandı</span>
            ) : (
              <button onClick={() => handleSocialLogin('youtube')} style={{ background: '#ef4444', width: '100%' }}>Bağla</button>
            )}
          </div>

          <div className="social-card" style={{ flex: 1, minWidth: '200px', background: 'rgba(225,48,108,0.1)', border: '1px solid rgba(225,48,108,0.3)', padding: '1.5rem', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
              <img src="/Instagram_icon.png" alt="Instagram Logo" style={{ height: '50px', width: 'auto', objectFit: 'contain' }} />
            </div>
            <h3 style={{ marginBottom: '1rem' }}>Instagram</h3>
            {socialAccounts.instagram ? (
              <span style={{ color: '#4ade80', fontWeight: 'bold' }}>✅ Bağlandı</span>
            ) : (
              <button onClick={() => handleSocialLogin('instagram')} style={{ background: '#e1306c', width: '100%' }}>Bağla</button>
            )}
          </div>

          <div className="social-card" style={{ flex: 1, minWidth: '200px', background: 'rgba(0,255,255,0.1)', border: '1px solid rgba(0,255,255,0.3)', padding: '1.5rem', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
              <img src="/tiktok-icon2.png" alt="TikTok Logo" style={{ height: '50px', width: 'auto', objectFit: 'contain' }} />
            </div>
            <h3 style={{ marginBottom: '1rem' }}>TikTok</h3>
            {socialAccounts.tiktok ? (
              <span style={{ color: '#4ade80', fontWeight: 'bold' }}>✅ Bağlandı</span>
            ) : (
              <button onClick={() => handleSocialLogin('tiktok')} style={{ background: '#000', border: '1px solid #25f4ee', width: '100%' }}>Bağla</button>
            )}
          </div>

        </div>
      </div>

      <div className="glass-panel">
        <h2>Genel Ayarlar</h2>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
          <div className="control-group">
            <label>Satıcı Adı:</label>
            <input type="text" value={sellerName} onChange={e => setSellerName(e.target.value)} />
          </div>
          <div className="control-group">
            <label>Alıcı Ülke / Hedef Kitle:</label>
            <input type="text" value={buyerCountry} onChange={e => setBuyerCountry(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="glass-panel story-panel" style={{ opacity: isStoryLocked ? 0.58 : 1, borderStyle: isStoryLocked ? 'dashed' : 'solid' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0 }}>Hikaye / Seslendirme Metni Kaynağı</h2>
          <div className="control-group" style={{ margin: 0, flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ margin: 0 }}>Seslendirme Dili:</label>
            <select disabled={isStoryLocked} value={targetLanguage} onChange={e => handleTargetLanguageChange(e.target.value)} style={{ padding: '0.4rem' }}>
              <option value="Turkish">Türkçe</option>
              <option value="English">İngilizce</option>
              <option value="German">Almanca</option>
              <option value="Spanish">İspanyolca</option>
              <option value="French">Fransızca</option>
              <option value="Arabic">Arapça</option>
            </select>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: isStoryLocked ? 'not-allowed' : 'pointer' }}>
            <input disabled={isStoryLocked} type="radio" name="storyMode" checked={storyMode === 'ai'} onChange={() => setStoryMode('ai')} />
            Yapay Zeka Üretsin
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: isStoryLocked ? 'not-allowed' : 'pointer' }}>
            <input disabled={isStoryLocked} type="radio" name="storyMode" checked={storyMode === 'manual'} onChange={() => setStoryMode('manual')} />
            Kendim Gireceğim
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: isStoryLocked ? 'not-allowed' : 'pointer' }}>
            <input disabled={isStoryLocked} type="radio" name="storyMode" checked={storyMode === 'ai_assisted'} onChange={() => setStoryMode('ai_assisted')} />
            Yapay Zekadan Yardım Alarak Üret
          </label>
        </div>
        {isStoryLocked ? (
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Hikaye ve seslendirme metni, video süresine göre ayarlanır. Devam etmek için önce aşağıdan video veya görsel yükleyin.
          </p>
        ) : (
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Tahmini video süresi: {Math.round(estimatedVideoDuration)} saniye. Limit: yaklaşık {storyLimits.maxWords} kelime / {storyLimits.maxChars} karakter.
          </p>
        )}
        <div className="control-group" style={{ marginBottom: '1rem' }}>
          <label>Ürün Türü:</label>
          <select disabled={isStoryLocked} value={productType} onChange={e => setProductType(e.target.value)}>
            {PRODUCT_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        {storyMode === 'manual' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="control-group" style={{ alignItems: 'flex-start' }}>
              <label style={{ marginTop: '0.5rem' }}>Türkçe Metin:</label>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <textarea 
                  rows={4} 
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }}
                  value={manualSourceText} 
                  disabled={isStoryLocked}
                  onChange={e => handleManualSourceChange(e.target.value)} 
                  placeholder="Türkçe metni buraya yazın..."
                />
                <button
                  onClick={handleTranslateManualStory}
                  disabled={isStoryLocked || isTranslatingManual || !manualSourceText.trim()}
                  style={{ width: 'max-content', padding: '0.5rem 1rem' }}
                >
                  {isTranslatingManual ? 'Çevriliyor...' : targetLanguage === 'Turkish' ? 'Metni Kullan' : 'Seçili Dile Çevir'}
                </button>
              </div>
            </div>
            <div className="control-group" style={{ alignItems: 'flex-start' }}>
              <label style={{ marginTop: '0.5rem' }}>Çevrilmiş Metin:</label>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <textarea 
                  rows={4} 
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }}
                  value={manualStoryText} 
                  disabled={isStoryLocked}
                  maxLength={storyLimits.maxChars || undefined}
                  onChange={e => setManualStoryText(storyLimits.maxChars ? e.target.value.slice(0, storyLimits.maxChars) : e.target.value)} 
                  placeholder="Seçilen dile çevrilmiş metin burada görünecek. Videoda bu metin kullanılacak..."
                />
                {storyLimits.maxChars > 0 && (
                  <small style={{ color: isStoryOverLimit ? '#ef4444' : 'var(--text-muted)' }}>
                    {manualStoryText.length}/{storyLimits.maxChars} karakter
                  </small>
                )}
              </div>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>* Videoyu ürettiğinizde alttaki "Çevrilmiş Metin" seslendirilecektir.</p>
          </div>
        )}
        {storyMode === 'ai_assisted' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="control-group" style={{ alignItems: 'flex-start' }}>
              <label style={{ marginTop: '0.5rem' }}>İstekleriniz / Özet:</label>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <textarea 
                  rows={3} 
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }}
                  value={aiPrompt} 
                  disabled={isStoryLocked}
                  onChange={e => setAiPrompt(e.target.value)} 
                  placeholder="Hikayeyi özetle anlat, istediğin şeyleri belirt ya da direkt ana kelimeleri ver..."
                />
                <button onClick={handleGenerateStory} disabled={isGeneratingStory || mediaList.length === 0} style={{ width: 'max-content', padding: '0.5rem 1rem' }}>
                  {isGeneratingStory ? '⏳ Üretiliyor...' : '✨ Hikayeyi Oluştur'}
                </button>
              </div>
            </div>
            <div className="control-group" style={{ alignItems: 'flex-start' }}>
              <label style={{ marginTop: '0.5rem' }}>Üretilen Metin:</label>
              <textarea 
                rows={4} 
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }}
                value={manualStoryText} 
                disabled={isStoryLocked}
                maxLength={storyLimits.maxChars || undefined}
                onChange={e => setManualStoryText(storyLimits.maxChars ? e.target.value.slice(0, storyLimits.maxChars) : e.target.value)} 
                placeholder="Yapay zeka tarafından üretilen metin burada görünecek. İsterseniz düzenleyebilirsiniz..."
              />
              {storyLimits.maxChars > 0 && (
                <small style={{ color: isStoryOverLimit ? '#ef4444' : 'var(--text-muted)' }}>
                  {manualStoryText.length}/{storyLimits.maxChars} karakter
                </small>
              )}
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>* Videoyu ürettiğinizde buradaki "Üretilen Metin" kullanılacaktır. Dilerseniz üzerinde değişiklik yapabilirsiniz.</p>
          </div>
        )}
      </div>

      <div className="glass-panel">
        <h2>Medya Yükle</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Videoları ve fotoğrafları buraya yükleyin. Sürükle bırak da yapabilirsiniz.</p>
        
        <div className="upload-zone" onClick={() => fileInputRef.current?.click()}>
          <svg style={{ width: '48px', height: '48px', color: 'var(--primary)', marginBottom: '1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
          <h3>Dosyaları Seçin</h3>
          <input 
            type="file" 
            multiple 
            accept="video/*,image/*" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            onChange={handleFileChange} 
          />
        </div>

        {/* Yapay Zeka ile Resim Oluşturma */}
        <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>✨ Yapay Zeka ile Reklam Fotoğrafı Üret</h3>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
            <div className="control-group" style={{ flex: 1 }}>
              <label>Nasıl bir fotoğraf istersiniz? (Hediye, Reklam vb.):</label>
              <input 
                type="text" 
                value={imagePrompt} 
                onChange={e => setImagePrompt(e.target.value)} 
                placeholder="Örn: Mavi seramik vazo, beyaz arka plan, profesyonel ışık..." 
              />
            </div>
            <button onClick={handleGenerateAIImage} disabled={isGeneratingImage} style={{ padding: '0.8rem 1.5rem' }}>
              {isGeneratingImage ? '⏳ Üretiliyor...' : '🎨 Resim Oluştur'}
            </button>
          </div>
          
          {generatedImageUrl && (
            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <img src={generatedImageUrl} alt="Generated AI" style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px', border: '2px solid var(--primary)' }} />
              <div style={{ marginTop: '1rem' }}>
                <button onClick={addGeneratedImageToMedia} className="btn-generate" style={{ background: 'var(--accent)', width: 'auto', padding: '0.6rem 2rem' }}>
                  ✅ Bu Resmi Projeye Ekle
                </button>
              </div>
            </div>
          )}
        </div>

        {mediaList.length > 0 && (
          <>
            <div className="media-list">
              {mediaList.map((item, index) => (
                <div key={item.id} className="media-item">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 'bold' }}>#{index + 1} ({item.type})</span>
                    {item.type === 'video' ? (
                      <video src={item.previewUrl} className="media-preview" controls />
                    ) : (
                      <img src={item.previewUrl} className="media-preview" alt="preview" />
                    )}
                    <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                      <button 
                        style={{ flex: 1, padding: '0.4rem', fontSize: '1rem', background: index === 0 ? 'var(--border-color)' : 'var(--primary)', opacity: index === 0 ? 0.5 : 1, cursor: index === 0 ? 'not-allowed' : 'pointer' }} 
                        onClick={() => moveMediaItem(index, 'up')}
                        disabled={index === 0}
                        title="Yukarı Taşı"
                      >
                        ⬆️
                      </button>
                      <button 
                        style={{ flex: 1, padding: '0.4rem', fontSize: '1rem', background: index === mediaList.length - 1 ? 'var(--border-color)' : 'var(--primary)', opacity: index === mediaList.length - 1 ? 0.5 : 1, cursor: index === mediaList.length - 1 ? 'not-allowed' : 'pointer' }} 
                        onClick={() => moveMediaItem(index, 'down')}
                        disabled={index === mediaList.length - 1}
                        title="Aşağı Taşı"
                      >
                        ⬇️
                      </button>
                    </div>
                    <button style={{ background: '#ef4444', padding: '0.4rem', fontSize: '0.8rem', width: '100%' }} onClick={() => removeMediaItem(item.id)}>🗑️ Kaldır</button>
                  </div>

                  <div className="media-controls">
                    {item.type === 'video' && (
                      <div className="control-group">
                        <label>✂️ Kes (Saniye):</label>
                        <input type="number" min="0" value={item.trimStart} onChange={e => updateMediaItem(item.id, 'trimStart', Number(e.target.value))} placeholder="Başla" />
                        <span>-</span>
                        <input type="number" min="0" value={item.trimEnd} onChange={e => updateMediaItem(item.id, 'trimEnd', e.target.value ? Number(e.target.value) : '')} placeholder="Bitiş (Boş=Son)" />
                      </div>
                    )}

                    <div className="filter-selection-container">
                      <label style={{display: 'block', marginBottom: '0.8rem', color: 'var(--text-muted)'}}>🎨 Filtre Seçimi:</label>
                      <div className="filter-cards">
                        {FILTER_OPTIONS.map(opt => (
                          <div 
                            key={opt.id} 
                            className={`filter-card ${item.filter === opt.id ? 'active' : ''}`}
                            onClick={() => updateMediaItem(item.id, 'filter', opt.id)}
                          >
                            <div className="filter-card-img" style={{ backgroundImage: `url(${opt.image})` }}>
                              <div className="filter-icon">{opt.icon}</div>
                            </div>
                            <div className="filter-card-text">
                              <strong>{opt.title}</strong>
                              {opt.subtitle && <span className="filter-card-sub">{opt.subtitle}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="filter-selection-container">
                      <label style={{display: 'block', marginBottom: '0.8rem', color: 'var(--text-muted)'}}>✨ Geçiş (Sonuna):</label>
                      <div className="filter-cards">
                        {TRANSITION_OPTIONS.filter(opt => !opt.onlyImage || item.type === 'image').map(opt => (
                          <div 
                            key={opt.id} 
                            className={`filter-card ${item.transition === opt.id ? 'active' : ''}`}
                            onClick={() => updateMediaItem(item.id, 'transition', opt.id)}
                          >
                            <div className="filter-card-img" style={{ backgroundImage: `url(${opt.image})` }}>
                              <div className="filter-icon">{opt.icon}</div>
                            </div>
                            <div className="filter-card-text">
                              <strong>{opt.title}</strong>
                              {opt.subtitle && <span className="filter-card-sub">{opt.subtitle}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="control-group">
                      <label>✍️ Yazı Ekle:</label>
                      <input type="text" value={item.text} onChange={e => updateMediaItem(item.id, 'text', e.target.value)} placeholder="Örn: Yunus'un Çömleği" />
                    </div>
                    
                    {item.text && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div className="control-group">
                          <label>⏱️ Yazı Saniyesi:</label>
                          <input type="number" min="0" value={item.textStart} onChange={e => updateMediaItem(item.id, 'textStart', Number(e.target.value))} placeholder="Başla" />
                          <span>-</span>
                          <input type="number" min="0" value={item.textEnd} onChange={e => updateMediaItem(item.id, 'textEnd', e.target.value ? Number(e.target.value) : '')} placeholder="Bitiş (Boş=Son)" />
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                          <div className="control-group" style={{ flex: 1 }}>
                            <label>Konum:</label>
                            <select value={item.textPosition} onChange={e => updateMediaItem(item.id, 'textPosition', e.target.value)}>
                              <option value="top">Üst</option>
                              <option value="center">Orta</option>
                              <option value="bottom">Alt</option>
                            </select>
                          </div>
                          <div className="control-group" style={{ flex: 1 }}>
                            <label>Renk:</label>
                            <input type="color" value={item.textColor} onChange={e => updateMediaItem(item.id, 'textColor', e.target.value)} style={{ padding: 0, height: '36px', width: '100%' }} />
                          </div>
                          <div className="control-group" style={{ flex: 1 }}>
                            <label>Boyut:</label>
                            <input type="number" min="20" max="200" value={item.fontSize} onChange={e => updateMediaItem(item.id, 'fontSize', Number(e.target.value))} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button className="btn-generate" onClick={handleGenerate} disabled={isGenerating} style={{ marginTop: '2rem' }}>
              {isGenerating ? '⏳ Video Üretiliyor, Lütfen Bekleyin...' : '🚀 Videoyu Üret (AI Pipeline)'}
            </button>
          </>
        )}
      </div>

      {resultVideoUrl && (
        <div className="glass-panel result-panel">
          <h2>🎉 Harika! Videonuz Hazır</h2>
          <p>Üretilen sinematik videoyu aşağıdan izleyebilirsiniz.</p>
          <video src={resultVideoUrl} controls className="result-video" autoPlay />
          
          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button 
              className="btn-generate" 
              onClick={() => {
                // Modalı açarken kullanıcının bağlı hesaplarını otomatik seçili yapabiliriz
                setShareData({
                  ...shareData,
                  shareSuccess: false,
                  platforms: { ...socialAccounts }
                });
                setIsShareModalOpen(true);
              }} 
              style={{ flex: 1, background: 'linear-gradient(135deg, #10b981, #059669)', margin: 0 }}
            >
              🌐 Sosyal Medyada Paylaş
            </button>
            <button 
              className="btn-generate" 
              onClick={() => {
                window.location.href = 'http://localhost:3000/seller/products';
              }} 
              style={{ flex: 1, background: 'linear-gradient(135deg, #c65a2e, #b04921)', margin: 0 }}
            >
              🛍️ Ürünlere Geri Dön
            </button>
          </div>
        </div>
      )}

      {/* Paylaşım Modalı (Glassmorphism Overlay) */}
      {isShareModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', position: 'relative', padding: '2.5rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
            <button onClick={() => setIsShareModalOpen(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', color: 'var(--text-muted)', fontSize: '1.5rem', border: 'none', cursor: 'pointer', padding: '0.5rem' }}>✖</button>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '2rem', background: 'linear-gradient(to right, var(--grad-start), var(--accent), var(--primary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>🚀 Tek Tuşla Paylaş</h2>
            
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Paylaşılacak Platformlar</h3>
              <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', opacity: socialAccounts.youtube ? 1 : 0.4 }}>
                  <input type="checkbox" disabled={!socialAccounts.youtube} checked={shareData.platforms.youtube} onChange={(e) => setShareData({...shareData, platforms: {...shareData.platforms, youtube: e.target.checked}})} style={{ width: '20px', height: '20px' }} />
                  <img src="/youtube.png" alt="YouTube" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
                  <span style={{ fontSize: '1.2rem' }}>YouTube</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', opacity: socialAccounts.instagram ? 1 : 0.4 }}>
                  <input type="checkbox" disabled={!socialAccounts.instagram} checked={shareData.platforms.instagram} onChange={(e) => setShareData({...shareData, platforms: {...shareData.platforms, instagram: e.target.checked}})} style={{ width: '20px', height: '20px' }} />
                  <img src="/Instagram_icon.png" alt="Instagram" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
                  <span style={{ fontSize: '1.2rem' }}>Instagram</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', opacity: socialAccounts.tiktok ? 1 : 0.4 }}>
                  <input type="checkbox" disabled={!socialAccounts.tiktok} checked={shareData.platforms.tiktok} onChange={(e) => setShareData({...shareData, platforms: {...shareData.platforms, tiktok: e.target.checked}})} style={{ width: '20px', height: '20px' }} />
                  <img src="/tiktok-icon2.png" alt="TikTok" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
                  <span style={{ fontSize: '1.2rem' }}>TikTok</span>
                </label>
              </div>
              {!socialAccounts.youtube && !socialAccounts.instagram && !socialAccounts.tiktok && (
                <div style={{ color: '#ef4444', fontSize: '0.9rem', marginTop: '1rem', padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                  ⚠️ Lütfen önce ana ekrandan "Sosyal Medya Hesapları" bölümüne giderek hesaplarınızı bağlayın.
                </div>
              )}
            </div>

            <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>🤖 AI Video Meta Bilgileri</h3>
                <span style={{ background: 'rgba(74,222,128,0.2)', color: '#4ade80', padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold', border: '1px solid rgba(74,222,128,0.3)' }}>Viral Score: 92/100 🔥</span>
              </div>
              <div className="control-group" style={{ marginBottom: '1.2rem', flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem' }}>
                <label style={{ width: '100%' }}>AI Başlık Önerisi:</label>
                <input type="text" value={shareData.title} onChange={e => setShareData({...shareData, title: e.target.value})} style={{ width: '100%', padding: '0.8rem', fontSize: '1rem' }} />
              </div>
              <div className="control-group" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem' }}>
                <label style={{ width: '100%' }}>AI Hashtagler:</label>
                <input type="text" value={shareData.hashtags} onChange={e => setShareData({...shareData, hashtags: e.target.value})} style={{ width: '100%', padding: '0.8rem', fontSize: '1rem' }} />
              </div>
            </div>

            {shareData.shareSuccess ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', background: 'rgba(74,222,128,0.1)', border: '2px solid #4ade80', borderRadius: '12px' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>✅</div>
                <h3 style={{ color: '#4ade80', marginBottom: '0.5rem', fontSize: '1.5rem' }}>Başarıyla Paylaşıldı!</h3>
                <p style={{ fontSize: '1rem', color: 'var(--text-main)' }}>Videonuz seçilen platformlara başarıyla yüklendi ve yayınlandı.</p>
              </div>
            ) : (
              <button 
                className="btn-generate" 
                onClick={async () => {
                  setShareData({...shareData, isSharing: true});
                  
                  try {
                    // Sadece YouTube için gerçek API çağrısı yapıyoruz (eğer seçiliyse)
                    if (shareData.platforms.youtube && resultVideoUrl) {
                      // resultVideoUrl örn: "http://localhost:8001/outputs/123/final_video.mp4"
                      // Bize sadece "outputs/123/final_video.mp4" kısmı lazım
                      const videoPath = resultVideoUrl.replace(`${API_BASE_URL}/`, "");
                      
                      const response = await fetch(`${API_BASE_URL}/api/upload/youtube`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                          video_path: videoPath,
                          title: shareData.title,
                          description: shareData.title + "\n\n" + shareData.hashtags,
                          tags: shareData.hashtags.split(' ').map(t => t.replace('#', ''))
                        })
                      });
                      
                      const result = await response.json();
                      if (!response.ok) {
                        throw new Error(result.detail || 'YouTube yükleme hatası');
                      }
                      console.log("YouTube Upload Result:", result);
                    }
                    
                    // Diğer platformlar şimdilik simülasyon olarak kalabilir
                    setTimeout(() => setShareData({...shareData, isSharing: false, shareSuccess: true}), 1000);
                    
                  } catch (err: any) {
                    alert("Paylaşım sırasında hata oluştu: " + err.message);
                    setShareData({...shareData, isSharing: false});
                  }
                }}
                disabled={shareData.isSharing || (!shareData.platforms.youtube && !shareData.platforms.instagram && !shareData.platforms.tiktok)}
                style={{ marginTop: 0, padding: '1.2rem', fontSize: '1.2rem' }}
              >
                {shareData.isSharing ? 'Yükleniyor... Lütfen Bekleyin ⏳' : 'Seçili Platformlarda Paylaş 🚀'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default App
