'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { productService } from '../../../services/productService';
import { artisanService } from '../../../services/artisanService';
import { advertisementService } from '../../../services/advertisementService';
import { aiService } from '../../../services/aiService';
import { geoService } from '../../../services/geoService';
import { carbonService } from '../../../services/carbonService';
import { currencyService } from '../../../services/currencyService';
import DeliveryLocationSelector from '../../../components/delivery/DeliveryLocationSelector';
import { formatPrice, CULTURAL_INFO_TEXT } from '../../../utils/formatters';
import { useLanguage } from '../../../context/LanguageContext';
import { useAuth } from '../../../contexts/AuthContext';
import { 
  ShoppingCart, Heart, Share2, Video, Sparkles, MapPin, Award, 
  ChevronLeft, Camera, Globe, Hash as XIcon, MessageCircle, Copy, Check,
  Film, AlertCircle, User, Clock, Palette, Hammer, Leaf, DollarSign, Route, Truck, RefreshCw
} from 'lucide-react';

const CATEGORY_STORIES = {
  'Çömlek': [
    "Kapadokya'nın Kızılırmak yatağından çıkarılan kırmızı kil, ustaların ellerinde hayat bulur. Hititlerden günümüze uzanan bu antik çömlekçilik geleneği, Avanos'un yeraltı atölyelerinde nesilden nesile aktarılmaktadır.",
    "Volkanik tüf kayaların serinliğinde kurutulan bu çömlek, Kapadokya'nın toprak anaya olan saygısını simgeler. Ateş, toprak ve suyun kusursuz birleşimiyle şekillenen bu eser, binlerce yıllık Anadolu tarihini taşır.",
    "Nesiller boyunca aktarılan çömlekçi çarkı tekniğiyle tamamen elde şekillendirilmiş olan bu ürün, Hitit güneşi motiflerini ve Kapadokya'nın toprak renklerini barındırır."
  ],
  'Halı': [
    "Kapadokya'nın yüksek rakımlı yaylalarında yetişen koyunların yünlerinden elde edilen ipler, kök boyalarla renklendirilir. Her bir ilmek, Anadolu kadınının duygularını, sevinçlerini ve bereket dualarını halının desenlerine dokumasıyla oluşur.",
    "Bölgenin zengin bitki örtüsünden elde edilen doğal boyalarla bezenmiş bu halı, Türkmen göçebelerin yüzyıllar öncesine dayanan geometrik motiflerini taşır. Yörük çadırlarından modern evlere uzanan bu miras, zamana meydan okur.",
    "Çift düğüm (Gördes) tekniğiyle dokunmuş bu halıda kullanılan motifler, Kapadokya efsanelerini fısıldar. Kuş motifleri özgürlüğü, su yolu ise yaşamın devamlılığını simgeler."
  ],
  'Kilim': [
    "Kapadokya köylerindeki ahşap tezgahlarda 'kirkit' sesleri eşliğinde dokunan bu kilim, yöre halkının doğayla kurduğu derin bağı anlatır. Motiflerdeki koç boynuzu gücü, su yolu ise yaşamın sürekliliğini temsil eder.",
    "Düz dokuma tekniğiyle tamamen el emeği olarak üretilen bu kilim, Kapadokya'nın vadilerindeki rüzgarın ve güneşin renklerini taşır. Göçebe kültürün en nadide sembollerinden biri olan bu eser, Anadolu'nun ruhunu evinize getirir.",
    "Geometrik desenlerin kök boyalarla buluştuğu bu eşsiz kilim, göçebe yörüklerin çadır kültüründen miras kalan otantik bir zanaat harikasıdır."
  ],
  'Vazo': [
    "Antik çağlardan beri bereketin sembolü olan vazolar, Kapadokya'nın ustaları tarafından Avanos çarklarında tek tek elde çekilir. Yüzeyindeki geleneksel sır teknikleri, ürünün ateşle olan dansının bir sonucudur.",
    "Kapadokya peribacalarının mistik atmosferinden ilham alan bu vazo formu, toprağın sanata dönüşme serüveninin en zarif örneklerindendir. İçinde sakladığı hikaye, usta ellerin sabrıyla şekillenmiştir.",
    "Hitit testilerinden esinlenilerek modern bir dokunuşla şekillendirilen bu vazo, toprağın nefes alan dokusunu koruyacak şekilde özel fırınlarda pişirilmiştir."
  ],
  'Tabak': [
    "Kapadokya saray kültüründen Anadolu sofralarına uzanan bir zarafet... Bu seramik tabak, yüzyıllardır süregelen İznik ve Avanos boyama tekniklerinin modern bir yorumu olarak fırınlardan çıkmıştır.",
    "Doğadan ilham alan floral motiflerle bezenmiş bu tabak, sadece bir kullanım eşyası değil; Kapadokya'nın zengin çini ve seramik geleneğinin duvarlarınızı veya sofralarınızı süsleyecek bir yansımasıdır.",
    "Tamamen el boyaması olan bu tabaktaki lale ve karanfil motifleri, İç Anadolu'nun bahar aylarındaki canlılığını yansıtan geleneksel mineral boyalarla resmedilmiştir."
  ],
  'default': [
    "Anadolu'nun kadim medeniyetlerinin izlerini taşıyan bu eser, tamamen doğal ve yerel malzemeler kullanılarak üretilmiştir.",
    "Kapadokya'nın mistik atmosferini yansıtan bu el işi ürün, yüzyıllardır süregelen geleneksel zanaat yöntemlerinin günümüze ulaşan eşsiz bir örneğidir.",
    "Bölgenin zengin kültürel mirasını evinize taşıyan bu tasarım, usta ellerin sabrı ve emeğiyle şekillendirilmiştir."
  ]
};

// Deterministic random selection based on productId string
const getDynamicStory = (category, productId, indexOffset = 0) => {
  if (!productId) return '';
  const hash = productId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  let selectedCategory = 'default';
  const lowerCat = (category || '').toLowerCase();
  
  if (lowerCat.includes('çömlek') || lowerCat.includes('seramik')) selectedCategory = 'Çömlek';
  else if (lowerCat.includes('halı')) selectedCategory = 'Halı';
  else if (lowerCat.includes('kilim')) selectedCategory = 'Kilim';
  else if (lowerCat.includes('vazo')) selectedCategory = 'Vazo';
  else if (lowerCat.includes('tabak')) selectedCategory = 'Tabak';

  const stories = CATEGORY_STORIES[selectedCategory];
  const index = (hash + indexOffset) % stories.length;
  return stories[index];
};

export default function ProductDetailPage() {
  const params = useParams();
  const { isAuthenticated, isAdmin, isSeller } = useAuth();
  const [product, setProduct] = useState(null);
  const [artisan, setArtisan] = useState(null);
  const [advertisement, setAdvertisement] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoMessage, setVideoMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [productVideo, setProductVideo] = useState(null);
  const [allVideos, setAllVideos] = useState([]);
  const [showVideoPicker, setShowVideoPicker] = useState(false);
  const { t } = useLanguage();

  // Hackathon Modules State
  const [selectedCurrency, setSelectedCurrency] = useState('EUR');
  const [currencyData, setCurrencyData] = useState(null);
  const [isCurrencyUpdating, setIsCurrencyUpdating] = useState(false);
  const [transportMode, setTransportMode] = useState('Kara (TIR)');
  const [distanceKm, setDistanceKm] = useState(0);
  const [carbonFootprint, setCarbonFootprint] = useState(0);
  const [deliveryData, setDeliveryData] = useState(null);

  useEffect(() => {
    async function loadProduct() {
      const prod = await productService.getById(params.productId);
      if (prod) {
        setProduct(prod);
        const art = await artisanService.getById(prod.artisanId);
        setArtisan(art);
        const ad = await advertisementService.getByProduct(prod.productId);
        setAdvertisement(ad);

        // Hackathon computations
        try {
          const route = await geoService.getDeliveryRoute(prod.productionCity || 'Avanos', 'İstanbul');
          setDistanceKm(route.distanceKm);
          const carbon = carbonService.calculateCarbonFootprint(route.distanceKm, prod.weightKg || 1.8, transportMode);
          setCarbonFootprint(carbon);
        } catch(e) {
          console.error(e);
        }
      }
      // Ürüne atanmış videoyu yükle
      try {
        const vidRes = await fetch(`/api/ai-videos?productId=${params.productId}`);
        const vidData = await vidRes.json();
        if (vidData.videoUrl) setProductVideo(vidData.videoUrl);
      } catch (e) { /* video yoksa sorun değil */ }
      setLoading(false);
    }
    loadProduct();
  }, [params.productId]);

  // We will now handle carbon calculation inside DeliveryLocationSelector

  const handleGeoCalculation = (routeInfo, carbon, mode, isDemo) => {
    setDistanceKm(routeInfo.distanceKm);
    setCarbonFootprint(carbon);
    setTransportMode(mode);
    setDeliveryData({ ...routeInfo, isDemo });
  };

  // Recalculate currency when selectedCurrency changes and poll every 15 seconds
  useEffect(() => {
    async function updateCurrency(forceRefresh = false) {
      if (product) {
        if (forceRefresh) setIsCurrencyUpdating(true);
        const data = await currencyService.convertTRYPrice(product.price, selectedCurrency, forceRefresh);
        setCurrencyData(data);
        if (forceRefresh) setIsCurrencyUpdating(false);
      }
    }
    
    // Initial fetch
    updateCurrency(false);

    // Poll every 15 seconds
    const interval = setInterval(() => {
      updateCurrency(true);
    }, 15000);

    return () => clearInterval(interval);
  }, [selectedCurrency, product]);

  const handleAIVideo = async () => {
    // AI-VİDEO sitesini ayrı sekmede aç
    window.open('http://localhost:5173', '_blank');
    // Ayrıca servisleri başlatmayı dene
    try {
      await fetch('/api/open-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start-ai-video' })
      });
    } catch (e) { /* sessizce geç */ }
  };

  const handleAssignVideo = async (videoFolderId) => {
    try {
      await fetch('/api/ai-videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.productId, videoFolderId })
      });
      setProductVideo(`/api/ai-videos/${videoFolderId}`);
      setShowVideoPicker(false);
    } catch (e) {
      alert('Video atanamadı: ' + e.message);
    }
  };

  const loadAllVideos = async () => {
    try {
      const res = await fetch('/api/ai-videos');
      const data = await res.json();
      setAllVideos(data.videos || []);
      setShowVideoPicker(true);
    } catch (e) {
      alert('Videolar yüklenemedi.');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareText = product ? `${product.name} - Kapadokya El Sanatları` : '';

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="aspect-square shimmer rounded-2xl" />
          <div className="space-y-4">
            <div className="h-8 shimmer rounded w-3/4" />
            <div className="h-4 shimmer rounded w-1/2" />
            <div className="h-6 shimmer rounded w-1/3" />
            <div className="h-32 shimmer rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <AlertCircle size={48} className="text-earth mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-dark-brown mb-2" style={{ fontFamily: 'var(--font-display)' }}>Ürün Bulunamadı</h2>
        <p className="text-earth mb-6">Aradığınız ürün mevcut değil veya kaldırılmış olabilir.</p>
        <Link href="/products" className="btn-primary">Ürünlere Dön</Link>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center gap-2 text-sm text-earth">
          <Link href="/" className="hover:text-terracotta transition-colors">{t('nav.home')}</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-terracotta transition-colors">{t('nav.products')}</Link>
          <span>/</span>
          <span className="text-dark-brown font-medium">{product.name}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {/* Product Main */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-16">
          {/* Images */}
          <div className="space-y-4">
            <div className="aspect-square rounded-2xl overflow-hidden bg-cream shadow-md">
              <img 
                src={product.images[selectedImage]} 
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex gap-3">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                    selectedImage === i ? 'border-terracotta shadow-md' : 'border-cream hover:border-stone'
                  }`}
                >
                  <img src={img} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="space-y-6">
            <div>
              <span className="badge-premium mb-3 inline-block">{product.category}</span>
              <h1 className="text-3xl lg:text-4xl font-bold text-deep-earth mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                {product.name}
              </h1>
              <p className="text-earth leading-relaxed">{product.description}</p>
            </div>

            <div className="flex items-end gap-4">
              <span className="text-4xl font-bold text-terracotta">{formatPrice(product.price)}</span>
            </div>

            {/* Cultural Info Card */}
            <div className="bg-gradient-to-r from-cream to-card p-5 rounded-2xl border border-stone/20">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sunset to-terracotta flex items-center justify-center shrink-0">
                  <Award size={20} className="text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-dark-brown mb-1 text-sm">Kültürel Miras Bilgilendirmesi</h4>
                  <p className="text-sm text-earth leading-relaxed italic">
                    &ldquo;{CULTURAL_INFO_TEXT}&rdquo;
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              {isAuthenticated ? (
                <Link href={`/checkout?product=${product.productId}`} className="btn-primary flex-1 justify-center text-lg py-3.5">
                  <ShoppingCart size={20} />
                  {t('product.buyNow')}
                </Link>
              ) : (
                <Link href="/login" className="btn-secondary flex-1 justify-center text-lg py-3.5 border-terracotta text-terracotta hover:bg-terracotta hover:text-white transition-colors">
                  <User size={20} />
                  Giriş Yaparak Satın Al
                </Link>
              )}
              <button className="btn-secondary px-4">
                <Heart size={20} />
              </button>
              <button onClick={() => setShowShare(!showShare)} className="btn-secondary px-4 relative">
                <Share2 size={20} />
              </button>
            </div>

            {/* Share dropdown */}
            {showShare && (
              <div className="bg-white rounded-2xl shadow-lg border border-cream p-4 animate-fade-in">
                <h4 className="font-semibold text-dark-brown mb-3 text-sm">Paylaş</h4>
                <div className="grid grid-cols-5 gap-2">
                  <ShareButton 
                    icon={<Camera size={18} />} 
                    label="Instagram" 
                    color="bg-pink-500"
                    href={`https://www.instagram.com/`}
                  />
                  <ShareButton 
                    icon={<Globe size={18} />} 
                    label="Facebook" 
                    color="bg-blue-600"
                    href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
                  />
                  <ShareButton 
                    icon={<XIcon size={18} />} 
                    label="X" 
                    color="bg-black"
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${shareUrl}`}
                  />
                  <ShareButton 
                    icon={<MessageCircle size={18} />} 
                    label="WhatsApp" 
                    color="bg-green-500"
                    href={`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`}
                  />
                  <button onClick={handleCopyLink} className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-cream transition-colors">
                    <div className="w-9 h-9 rounded-full bg-stone flex items-center justify-center text-white">
                      {copied ? <Check size={18} /> : <Copy size={18} />}
                    </div>
                    <span className="text-xs text-earth">{copied ? 'Kopyalandı' : 'Kopyala'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Specs Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card rounded-xl p-4 border border-cream">
                <div className="flex items-center gap-2 mb-2">
                  <User size={16} className="text-terracotta" />
                  <span className="text-xs font-semibold text-dark-brown uppercase tracking-wide">Üreten Kişi</span>
                </div>
                <p className="text-sm text-earth font-medium">{product.artisanName || 'Bilinmeyen Usta'}</p>
              </div>
              <div className="bg-card rounded-xl p-4 border border-cream">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin size={16} className="text-terracotta" />
                  <span className="text-xs font-semibold text-dark-brown uppercase tracking-wide">Üretim Yeri</span>
                </div>
                <p className="text-sm text-earth font-medium">{product.productionLocation || 'Avanos, Kapadokya'}</p>
              </div>
              <div className="bg-card rounded-xl p-4 border border-cream">
                <div className="flex items-center gap-2 mb-2">
                  <Palette size={16} className="text-terracotta" />
                  <span className="text-xs font-semibold text-dark-brown uppercase tracking-wide">Malzeme</span>
                </div>
                <p className="text-sm text-earth">{product.materials}</p>
              </div>
              <div className="bg-card rounded-xl p-4 border border-cream">
                <div className="flex items-center gap-2 mb-2">
                  <Hammer size={16} className="text-terracotta" />
                  <span className="text-xs font-semibold text-dark-brown uppercase tracking-wide">Teknik</span>
                </div>
                <p className="text-sm text-earth">{product.technique}</p>
              </div>
            </div>

            {/* AI Video Button - Only Admin/Seller */}
            {(isAdmin || isSeller) && (
              <button 
                onClick={handleAIVideo}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg mt-4"
              >
                <Film size={18} />
                AI Video Oluştur
              </button>
            )}
          </div>
        </div>

        {/* Product Story */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {/* Cultural Story */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-8 shadow-sm border border-cream">
            <h2 className="text-2xl font-bold text-deep-earth mb-4" style={{ fontFamily: 'var(--font-display)' }}>
              Ürünün Hikayesi
            </h2>
            <p className="text-earth leading-relaxed mb-6">
              {product.culturalStory && product.culturalStory !== 'Kapadokya bölgesinin otantik yapısına uygun olarak üretilmiştir.'
                ? product.culturalStory 
                : getDynamicStory(product.category, product.productId, 0)}
            </p>
            
            <h3 className="text-lg font-semibold text-dark-brown mb-3">Kapadokya ile Bağlantısı</h3>
            <p className="text-earth leading-relaxed">
              {getDynamicStory(product.category, product.productId, 1)}
            </p>
          </div>

          {/* Artisan Info */}
          {artisan && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-cream">
              <h3 className="text-lg font-semibold text-deep-earth mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                Usta Bilgileri
              </h3>
              <div className="flex flex-col items-center text-center mb-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-sunset to-terracotta flex items-center justify-center mb-3">
                  <User size={32} className="text-white" />
                </div>
                <h4 className="font-bold text-dark-brown">{artisan.name}</h4>
                <div className="flex items-center gap-1 text-sm text-earth mt-1">
                  <MapPin size={14} />
                  {artisan.region}
                </div>
              </div>
              <p className="text-sm text-earth leading-relaxed mb-4">{artisan.bio}</p>
              <div>
                <h5 className="text-xs font-semibold text-dark-brown uppercase tracking-wide mb-2">Uzmanlık Alanları</h5>
                <div className="flex flex-wrap gap-1.5">
                  {artisan.techniques.map(tech => (
                    <span key={tech} className="text-xs bg-cream text-earth px-2 py-1 rounded-lg">{tech}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Hackathon Technical Modules */}
        <div className="mt-16 pt-12 border-t border-stone/20 max-w-4xl">
          <h2 className="text-2xl font-bold text-deep-earth mb-8" style={{ fontFamily: 'var(--font-display)' }}>
            Hackathon Technical Modules
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
            {/* 1. Canlı Kur ile Fiyat Kartı */}
            <div className="bg-[#F5E6D3] rounded-2xl p-6 shadow-sm border border-stone/20">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign size={20} className="text-[#C65A2E]" />
                <h3 className="text-lg font-bold text-[#3E2A1F]" style={{ fontFamily: 'var(--font-display)' }}>{t('cards.currencyTitle')}</h3>
                {isCurrencyUpdating && (
                  <span className="ml-2 flex items-center text-xs text-earth bg-white/50 px-2 py-1 rounded-full animate-pulse border border-stone/10">
                    <RefreshCw size={12} className="mr-1 animate-spin text-[#C65A2E]" /> Güncelleniyor...
                  </span>
                )}
              </div>
              <div className="space-y-2 text-sm text-[#5A3E2B]">
                <div className="flex justify-between"><span>{t('cards.basePrice')}:</span> <span className="font-semibold text-[#C65A2E]">₺{product.price}</span></div>
                <div className="flex justify-between items-center">
                  <span>{t('cards.selectedCurrency')}:</span>
                  <select 
                    className="bg-white border border-[#C65A2E]/30 rounded px-2 py-1 text-xs"
                    value={selectedCurrency}
                    onChange={(e) => setSelectedCurrency(e.target.value)}
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
                <div className="flex justify-between"><span>{t('cards.currencySource')}:</span> <span>{currencyData?.source || 'TCMB EVDS'}</span></div>
                {currencyData?.seriesCode && (
                  <div className="flex justify-between"><span>EVDS Seri Kodu:</span> <span>{currencyData.seriesCode}</span></div>
                )}
                <div className="flex justify-between"><span>{t('cards.currentRate')}:</span> <span>1 {selectedCurrency} = {currencyData?.rate || 1} TL</span></div>
                {currencyData?.lastUpdated && (
                  <div className="flex justify-between"><span>{t('cards.lastUpdated')}:</span> <span>{currencyData.lastUpdated}</span></div>
                )}
                <div className="flex justify-between mt-2 pt-2 border-t border-[#3E2A1F]/10">
                  <span className="font-semibold">{t('cards.approxTotal')}:</span> 
                  <span className="font-bold text-lg text-[#C65A2E]">{(currencyData?.convertedPrice || product.price).toFixed(2)} {selectedCurrency}</span>
                </div>
              </div>
              <p className="text-[10px] text-[#C65A2E] mt-4 leading-tight italic font-medium bg-[#C65A2E]/5 p-2 rounded border border-[#C65A2E]/20">
                Tüm döviz kurları anlık olarak Türkiye Cumhuriyet Merkez Bankası (TCMB) EVDS sistemi üzerinden saniyesi saniyesine çekilmektedir. Fiyatlar tamamen canlıdır.
              </p>
            </div>

            {/* 2. Teslimat ve Karbon Hesaplama Kartı */}
            <DeliveryLocationSelector 
              onCalculate={handleGeoCalculation} 
              productWeight={product.weightKg} 
              productionLocation={product.productionLocation || 'Avanos'} 
            />
          </div>

        </div>

        {/* Video Section */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-cream mb-16">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-deep-earth" style={{ fontFamily: 'var(--font-display)' }}>
              AI Reklam Videosu
            </h2>
            {(isAdmin || isSeller) && (
              <button
                onClick={loadAllVideos}
                className="text-sm px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all flex items-center gap-2"
              >
                <Film size={14} />
                Video Ata
              </button>
            )}
          </div>
          {productVideo ? (
            <div className="aspect-video bg-black rounded-xl overflow-hidden">
              <video
                key={productVideo}
                controls
                className="w-full h-full"
                preload="metadata"
              >
                <source src={productVideo} type="video/mp4" />
                Tarayıcınız video etiketini desteklemiyor.
              </video>
            </div>
          ) : (
            <div className="aspect-video bg-cream/50 rounded-xl flex items-center justify-center border-2 border-dashed border-stone/30">
              <div className="text-center text-earth">
                <Video size={48} className="mx-auto mb-3 opacity-40" />
                <p className="font-medium">Bu ürün için henüz AI videosu atanmamıştır.</p>
                <p className="text-sm text-earth/60 mt-1">AI Video aracında video oluşturup buraya atayabilirsiniz.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Video Picker Modal */}
      {showVideoPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowVideoPicker(false)}>
          <div className="bg-white rounded-2xl p-8 max-w-lg mx-4 shadow-2xl animate-fade-in-up max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-dark-brown" style={{ fontFamily: 'var(--font-display)' }}>Video Seç</h3>
              <button onClick={() => setShowVideoPicker(false)} className="text-earth hover:text-dark-brown text-2xl">&times;</button>
            </div>
            {allVideos.length === 0 ? (
              <div className="text-center py-8 text-earth">
                <Film size={40} className="mx-auto mb-3 opacity-40" />
                <p>Henüz oluşturulmuş video yok.</p>
                <p className="text-sm mt-1">Önce AI Video aracında bir video oluşturun.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {allVideos.map(v => (
                  <button
                    key={v.id}
                    onClick={() => handleAssignVideo(v.id)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all hover:border-purple-400 hover:bg-purple-50 ${
                      v.productId === product?.productId ? 'border-purple-500 bg-purple-50' : 'border-stone/20'
                    }`}
                  >
                    <div className="text-left">
                      <p className="font-medium text-dark-brown text-sm">{v.id}</p>
                      <p className="text-xs text-earth">{new Date(v.createdAt).toLocaleString('tr-TR')}</p>
                      <p className="text-xs text-earth">{(v.size / 1024 / 1024).toFixed(1)} MB</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {v.productId === product?.productId && (
                        <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded-full">Atanmış</span>
                      )}
                      {v.productId && v.productId !== product?.productId && (
                        <span className="text-xs bg-stone/50 text-white px-2 py-1 rounded-full">Başka ürüne atanmış</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ShareButton({ icon, label, color, href }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-cream transition-colors">
      <div className={`w-9 h-9 rounded-full ${color} flex items-center justify-center text-white`}>
        {icon}
      </div>
      <span className="text-xs text-earth">{label}</span>
    </a>
  );
}
