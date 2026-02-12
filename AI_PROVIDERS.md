# 🤖 AI Provider Konfigürasyonu

ProAgentAI artık **iki farklı AI provider**'ı destekliyor:

## 🔹 Desteklenen Provider'lar

### 1. **Google Gemini 1.5 Flash** (Önerilen) ⚡
- **Ücretsiz Tier**: Günde 1500 request 
- **Ücretli**: $0.075/1M input token, $0.30/1M output token
- **Hız**: Çok hızlı
- **Kalite**: Yüksek

### 2. **OpenAI GPT-4o-mini**
- **Ücretli**: $0.15/1M input token, $0.60/1M output token  
- **Kalite**: Mükemmel
- **Mevcut**: Zaten entegre

## ⚙️ Konfigürasyon

`.env` dosyanıza şunları ekleyin:

```env
# AI Provider Seçimi ('gemini' veya 'openai')
AI_PROVIDER=gemini

# Google Gemini API Key (Önerilen)
GOOGLE_API_KEY=your-google-api-key-here

# OpenAI API Key  
OPENAI_API_KEY=your-openai-api-key-here

# Demo Mode (API çağrısı yapmadan test için)
DEMO_MODE=false
```

## 🔑 API Key Alma

### Google Gemini API Key Almak:
1. [Google AI Studio](https://makersuite.google.com/app/apikey)'ya gidin
2. "Get API Key" butonuna tıklayın
3. Yeni bir API key oluşturun
4. `.env` dosyasındaki `GOOGLE_API_KEY` değerini güncelleyin

### OpenAI API Key Almak:
1. [OpenAI Platform](https://platform.openai.com/api-keys)'a gidin
2. "Create new secret key" butonuna tıklayın
3. API key'i kopyalayın
4. `.env` dosyasındaki `OPENAI_API_KEY` değerini güncelleyin

## 🎯 Kullanım

### Gemini ile çalıştırmak (Önerilen):
```env
AI_PROVIDER=gemini
GOOGLE_API_KEY=AIza...your-key
DEMO_MODE=false
```

### OpenAI ile çalıştırmak:
```env  
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...your-key
DEMO_MODE=false
```

### Demo Mode (API gerektirmez):
```env
AI_PROVIDER=gemini
DEMO_MODE=true
```

## 💰 Maliyet Karşılaştırması

| Provider | Input (1M token) | Output (1M token) | Aylık Ücretsiz |
|----------|------------------|-------------------|----------------|
| **Gemini 1.5 Flash** | $0.075 | $0.30 | ✅ 1500/gün |
| **GPT-4o-mini** | $0.15 | $0.60 | ❌ Yok |

**Örnek**: 1000 analiz isteği (her biri ~2000 token):
- Gemini: ~$0.15 💚
- GPT-4o-mini: ~$0.30

## 🔄 Provider Değiştirmek

Sadece `.env` dosyasındaki `AI_PROVIDER` değerini değiştirin ve sunucuyu yeniden başlatın:

```bash
npm run dev
```

## 📊 Performans

Her iki provider da benzer kalitede sonuçlar üretir:
- ✅ Proje analizi
- ✅ Sprint planlama
- ✅ Görev önceliklendirme
- ✅ Rapor oluşturma
- ✅ Retrospective analizi

## 🛠️ Sorun Giderme

**API key çalışmıyor:**
- Key'in doğru kopyalandığından emin olun (boşluk yok)
- Provider değerinin doğru olduğunu kontrol edin
- Konsol loglarını kontrol edin

**"No AI provider configured" hatası:**
- `.env` dosyasının doğru yerde olduğunu kontrol edin
- `AI_PROVIDER` değerini ayarlayın
- En az bir API key'in tanımlı olduğunu kontrol edin

**Başlatmada hata:**
```bash
npm install  # Paketti yeniden yükleyin
npm run build # TypeScript'i derleyin
npm run dev # Servisi başlatın
```
