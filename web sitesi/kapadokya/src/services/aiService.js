import { delay } from '../utils/formatters';

// AI Service - Currently returns mock/demo results
// In production: Connect to Cloud Functions / AI API endpoints

export const aiService = {
  /**
   * Analyze product image and return AI detection results
   * In Firebase: Call Cloud Function that uses Vision AI
   */
  analyzeProduct: async (imageData) => {
    const getCategoryDetails = () => ({
      'Comlek': {
        category: 'Çömlek',
        confidence: 0.92,
        suggestedName: 'Kapadokya Geleneksel Çömlek',
        suggestedDescription: 'Volkanik topraklardan elde edilen kil ile şekillendirilen geleneksel Kapadokya çömleği.',
        suggestedMaterials: 'Yerel kırmızı kil, doğal sır',
        suggestedTechnique: 'Çömlekçi çarkı, geleneksel fırınlama',
        suggestedCulturalStory: 'Kapadokya çömlekleri, yüzyıllardır bölge mutfağının ayrılmaz bir parçasıdır.'
      },
      'Vazo': {
        category: 'Vazo',
        confidence: 0.94,
        suggestedName: 'Kapadokya El Yapımı Kırmızı Kil Vazo',
        suggestedDescription: 'Avanos\'un geleneksel çömlekçilik tekniğiyle, Kızılırmak kilinden üretilmiş el yapımı vazo. Doğal mineral pigmentlerle renklendirilmiştir.',
        suggestedMaterials: 'Kızılırmak kırmızı kili, doğal mineral pigmentler',
        suggestedTechnique: 'Geleneksel çömlekçi çarkı, el şekillendirme, 1050°C fırınlama',
        suggestedCulturalStory: 'Bu vazo, 3000 yıllık Avanos çömlekçilik geleneğinin yaşayan bir örneğidir.'
      },
      'Hali': {
        category: 'Halı',
        confidence: 0.91,
        suggestedName: 'Kapadokya Geleneksel El Dokuma Halı',
        suggestedDescription: 'Doğal boyalarla renklendirilmiş yünlerden, geleneksel Anadolu motifleriyle dokunmuş otantik halı.',
        suggestedMaterials: 'Doğal yün, bitkisel boyalar (ceviz kabuğu, nar kabuğu)',
        suggestedTechnique: 'El dokuma, Gördes düğümü, doğal boyama',
        suggestedCulturalStory: 'Kapadokya halıları, Türk halıcılık sanatının en nadide örneklerindendir.'
      },
      'Kilim': {
        category: 'Kilim',
        confidence: 0.90,
        suggestedName: 'Kapadokya El Dokuma Kilim',
        suggestedDescription: 'Yüzyıllık Anadolu geleneğiyle, doğal boyalarla renklendirilmiş yünlerden el tezgahında dokunmuş otantik kilim.',
        suggestedMaterials: 'Doğal yün, bitkisel boyalar',
        suggestedTechnique: 'El dokuma, düz dokuma tekniği, doğal boyama',
        suggestedCulturalStory: 'Kapadokya kilimleri, Anadolu dokumacılığının en kadim örneklerindendir. Her motif bir hikaye anlatır.'
      },
      'Tabak': {
        category: 'Tabak',
        confidence: 0.90,
        suggestedName: 'Kapadokya El İşi Dekoratif Tabak',
        suggestedDescription: 'İznik çini geleneğinden ilham alan, el boyama dekoratif tabak.',
        suggestedMaterials: 'Beyaz kil, kobalt oksit, turkuaz pigment',
        suggestedTechnique: 'El boyama, İznik sırlama tekniği, çift fırınlama',
        suggestedCulturalStory: 'İznik çini sanatı, Osmanlı İmparatorluğu\'nun en değerli sanat formlarından biridir.'
      }
    });

    // 1. Kendi Eğittiğimiz Python AI Modeline bağlanmayı dene
    const tryFetch = async (retries = 3) => {
      for (let i = 0; i < retries; i++) {
        try {
          if (!imageData) return null;
          
          let blob;
          if (typeof imageData === 'string' && imageData.startsWith('data:image')) {
            const res = await fetch(imageData);
            blob = await res.blob();
          } else {
            blob = imageData; // File object
          }

          const formData = new FormData();
          formData.append("file", blob, "upload.jpg");

          const response = await fetch("http://127.0.0.1:8000/predict", {
            method: "POST",
            body: formData,
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.category) {
              const results = getCategoryDetails();
              return results[data.category] || {
                ...results['Seramik'],
                category: data.category,
                suggestedName: `Özel ${data.category} Eseri`,
                confidence: 0.95
              };
            }
          }
        } catch (e) {
          if (i === 0) {
            console.log("FastAPI kapalı, otomatik başlatılıyor...");
            // Sunucuyu başlatmayı tetikle
            try {
              await fetch('/api/open-folder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'start-fastapi' })
              });
            } catch (err) {}
          }
          // Modellerin yüklenmesi için bekle (her denemede 5 saniye bekle)
          if (i < retries - 1) {
            console.log(`AI modeli yükleniyor... Bekleniyor (${i+1}/${retries})`);
            await delay(5000);
          }
        }
      }
      throw new Error("Yapay Zeka sunucusu başlatılamadı. Lütfen manuel olarak python_api/app.py dosyasını çalıştırın.");
    };

    return await tryFetch();
  },

  /**
   * Generate advertisement text for a product
   * In Firebase: Call Cloud Function with AI text generation
   */
  generateAdText: async (productName, category, description) => {
    await delay(1500);
    
    return {
      adText: `${productName} — Kapadokya'nın kalbinden gelen eşsiz bir el sanatı eseri! ${category} kategorisinde, geleneksel tekniklerle üretilmiş bu benzersiz parça, evinize Anadolu'nun sıcaklığını taşıyor. Şimdi keşfedin!`,
      productIntroText: `${description} Her biri usta ellerin benzersiz dokunuşunu taşıyan bu eser, Kapadokya'nın binlerce yıllık kültürel mirasının modern bir yorumudur. Doğal malzemeler ve geleneksel tekniklerle üretilen bu ${category.toLowerCase()}, hem estetik hem de kültürel değer taşımaktadır.`,
      voiceAdText: `Kapadokya'nın büyülü topraklarından, usta ellerin dokunuşuyla hayat bulan bir başyapıt. ${productName}, binlerce yıllık Anadolu geleneğini modern yaşamınıza taşıyor. Doğal malzemeler, geleneksel teknikler ve eşsiz bir hikaye. Şimdi bu benzersiz eseri keşfedin ve tarihe dokunun.`
    };
  },

  /**
   * AI Video generation
   */
  generateVideo: async (productId) => {
    try {
      await fetch('/api/open-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start-ai-video' })
      });
      return {
        success: true,
        message: 'AI Video aracı ayrı bir pencerede açılıyor. Videoyu orada oluşturduktan sonra buraya dönebilirsiniz.'
      };
    } catch (e) {
      return {
        success: false,
        message: 'AI video aracı başlatılamadı.'
      };
    }
  }
};
