# ProAgentAI - Adım Adım Kurulum Rehberi

Bu rehber, ProAgentAI'yi sıfırdan kurup çalıştırmanız için gereken tüm adımları içerir.

## 📋 Ön Gereksinimler

1. **Node.js** (v18 veya üzeri) - [İndir](https://nodejs.org/)
2. **Jira Hesabı** (Cloud) - [Atlassian Jira](https://www.atlassian.com/software/jira)
3. **OpenAI API Key** - [OpenAI Platform](https://platform.openai.com/)

---

## 🔧 Adım 1: Node.js Kurulumu

Eğer Node.js yüklü değilse:

```bash
# Node.js versiyonunu kontrol edin
node --version
npm --version
```

Yüklü değilse https://nodejs.org/ adresinden indirip kurun.

---

## 🚀 Adım 2: Bağımlılıkları Yükleyin

```bash
# Proje klasörüne gidin
cd ProAgentAI

# Bağımlılıkları yükleyin
npm install
```

Bu komut `package.json` dosyasındaki tüm bağımlılıkları yükleyecek.

---

## 🔑 Adım 3: Jira API Token Oluşturma

### 3.1. Jira'ya Giriş Yapın
https://id.atlassian.com/manage-profile/security/api-tokens adresine gidin

### 3.2. API Token Oluşturun
1. **"Create API token"** butonuna tıklayın
2. Token'a bir isim verin (örn: "ProAgentAI")
3. **"Create"** butonuna tıklayın
4. Token'ı kopyalayın (bir daha göremezsiniz!)

### 3.3. Jira Bilgilerinizi Bulun
- **Base URL**: `https://SIZIN-DOMAIN.atlassian.net` (Jira'nızın URL'si)
- **Email**: Jira hesabınızın email adresi
- **Project Key**: Jira projenizin kısa kodu (örn: PROJ, DEV, TEAM vb.)

Proje key'ini bulmak için:
1. Jira'da projenize gidin
2. URL'ye bakın: `https://domain.atlassian.net/jira/software/projects/PROJ/...`
3. `projects/` sonrasındaki kod sizin project key'iniz

---

## 🤖 Adım 4: OpenAI API Key Alma

### 4.1. OpenAI Hesabı Oluşturun
https://platform.openai.com/signup adresine gidin

### 4.2. API Key Oluşturun
1. https://platform.openai.com/api-keys adresine gidin
2. **"Create new secret key"** butonuna tıklayın
3. İsim verin (örn: "ProAgentAI")
4. Key'i kopyalayın (bir daha göremezsiniz!)

### 4.3. Kredi Yükleme
- API kullanımı için hesabınıza kredi yüklemeniz gerekebilir
- https://platform.openai.com/account/billing adresinden yapabilirsiniz

---

## ⚙️ Adım 5: Environment Ayarları

### 5.1. .env Dosyası Oluşturun

```bash
# .env.example dosyasını .env olarak kopyalayın
copy .env.example .env
```

### 5.2. .env Dosyasını Düzenleyin

`.env` dosyasını bir metin editörü ile açın ve bilgilerinizi girin:

```env
# Jira Configuration
JIRA_BASE_URL=https://SIZIN-DOMAIN.atlassian.net
JIRA_EMAIL=sizin-email@example.com
JIRA_API_TOKEN=sizin-jira-token-burada
JIRA_PROJECT_KEY=PROJ

# OpenAI Configuration
OPENAI_API_KEY=sk-sizin-openai-key-burada

# Server Configuration
PORT=3000
NODE_ENV=development
```

**ÖNEMLİ**: 
- `JIRA_BASE_URL`: Sonunda `/` olmamalı
- `JIRA_PROJECT_KEY`: Büyük harflerle, projenizin kısa kodu
- API key'leri kimseyle paylaşmayın!

---

## ▶️ Adım 6: Uygulamayı Çalıştırın

### Development Modu (Önerilen):

```bash
npm run dev
```

### Production Build:

```bash
# TypeScript kodlarını derleyin
npm run build

# Derlenmiş kodu çalıştırın
npm start
```

---

## 🌐 Adım 7: Uygulamaya Erişim

Tarayıcınızda şu adresi açın:

```
http://localhost:3000
```

**İlk Kontroller:**
1. Sağ üstte bağlantı durumunu kontrol edin
2. Yeşil ● görüyorsanız Jira bağlantısı başarılı!
3. Kırmızı ● görüyorsanız `.env` ayarlarınızı kontrol edin

---

## 🧪 Adım 8: İlk Testi Yapın

### 8.1. Jira Bağlantısını Test Edin

Tarayıcı console'unda veya şu URL'yi açarak test edin:
```
http://localhost:3000/api/health
http://localhost:3000/api/jira/test
```

### 8.2. Proje Analizi Test Edin

1. **"Proje Analizi"** sekmesine gidin
2. Proje açıklaması girin:
```
E-ticaret sitesi geliştirmek istiyorum. 
Kullanıcı kayıt/giriş sistemi, ürün listeleme, 
sepet yönetimi ve ödeme entegrasyonu olacak.
```
3. **"Analiz Et"** butonuna tıklayın
4. AI size görevler önerecek!

### 8.3. Jira'da Görev Oluşturun

1. **"Analiz Et ve Jira'da Oluştur"** butonuna tıklayın
2. Jira'nızı kontrol edin - görevler oluşturulmuş olmalı!

---

## ❓ Sorun Giderme

### Port Zaten Kullanımda

```bash
# Windows'ta port'u öldürün
netstat -ano | findstr :3000
taskkill /PID <PID_NUMARASI> /F

# Veya .env'de farklı bir port kullanın
PORT=3001
```

### Jira Bağlantı Hatası

**Hata**: "Jira bağlantısı başarısız"

**Çözümler**:
1. `.env` dosyasındaki `JIRA_BASE_URL` kontrol edin (sonunda `/` olmamalı)
2. Email adresinizi kontrol edin
3. API token'ın doğru olduğundan emin olun
4. Jira Cloud kullanıyor olun (Server/Data Center desteklenmez)

### OpenAI API Hatası

**Hata**: "insufficient_quota" veya "invalid_api_key"

**Çözümler**:
1. API key'in doğru olduğunu kontrol edin
2. OpenAI hesabınızda kredi olup olmadığını kontrol edin
3. https://platform.openai.com/account/usage adresinden kullanımı kontrol edin

### Issue Oluşturulamıyor

**Hata**: "Issue creation failed"

**Çözümler**:
1. Jira projenizde `Task`, `Story`, `Bug`, `Epic` issue type'larının olduğunu kontrol edin
2. Proje key'in doğru olduğunu kontrol edin
3. Kullanıcınızın proje oluşturma yetkisi olduğunu kontrol edin

---

## 📚 API Endpoints

Uygulamanın tüm API endpoint'leri:

### Health Check
- `GET /api/health` - Sistem durumu

### Jira
- `GET /api/jira/test` - Jira bağlantısını test et
- `GET /api/jira/issues` - Görevleri listele
- `GET /api/jira/issue/:key` - Belirli bir görevi getir
- `POST /api/jira/issue` - Yeni görev oluştur
- `PUT /api/jira/issue/:key` - Görevi güncelle
- `DELETE /api/jira/issue/:key` - Görevi sil

### AI Agent
- `POST /api/agent/analyze` - Proje analizi yap
- `POST /api/agent/plan-sprint` - Sprint planla
- `POST /api/agent/analyze-priority` - Öncelik belirle
- `POST /api/agent/estimate-effort` - Süre tahmini
- `POST /api/agent/improve-description` - Açıklamayı iyileştir
- `GET /api/agent/report` - Proje raporu oluştur
- `POST /api/agent/analyze-and-create` - Analiz et ve Jira'da oluştur

---

## 🎓 Örnek Kullanım Senaryoları

### Senaryo 1: Yeni Proje Başlatma

1. Proje açıklamasını girin
2. "Analiz Et ve Jira'da Oluştur" tıklayın
3. AI otomatik olarak görevleri oluşturur
4. Jira'da sprint planlaması yapabilirsiniz

### Senaryo 2: Sprint Planlama

1. "Sprint Planlama" sekmesine gidin
2. Takım kapasitesini girin (örn: 120 saat)
3. Takım üyelerini ekleyin
4. AI size optimal sprint planı önerir

### Senaryo 3: Proje Durumu Raporu

1. "Rapor" sekmesine gidin
2. "Rapor Oluştur" butonuna tıklayın
3. AI mevcut görevleri analiz edip rapor oluşturur

---

## 🔒 Güvenlik Notları

1. `.env` dosyasını asla Git'e commit etmeyin
2. API key'lerinizi kimseyle paylaşmayın
3. Production'da `NODE_ENV=production` kullanın
4. HTTPS kullanmayı unutmayın (production'da)

---

## 🆘 Yardım

Sorun yaşıyorsanız:

1. **Log'ları kontrol edin**: Terminal'de hata mesajlarını okuyun
2. **Browser Console**: F12 tuşuna basıp Console sekmesine bakın
3. **API Test**: Postman veya curl ile API'yi test edin

---

## 🎉 Başarılı Kurulum!

Tebrikler! ProAgentAI artık çalışıyor. 

**Sonraki Adımlar:**
- Kendi projelerinizi analiz edin
- Sprint planlaması yapın
- AI'ın önerilerini inceleyin
- Jira entegrasyonunu keşfedin

İyi çalışmalar! 🚀
