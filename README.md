<div align="center">

# 🤖 ProAgentAI

### AI-Powered Project Management Assistant

*Yapay zeka destekli proje yönetimi asistanı. Jira entegrasyonu ile görev yönetimi, sprint planlama ve ekip koordinasyonunu otomatikleştirir.*

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white)](https://openai.com/)
[![Jira](https://img.shields.io/badge/Jira-0052CC?style=for-the-badge&logo=jira&logoColor=white)](https://www.atlassian.com/software/jira)

[Demo](#-demo) • [Özellikler](#-temel-özellikler) • [Kurulum](#-kurulum) • [Kullanım](#-kullanım) • [API](#-api-endpoints)

</div>

---

## 📸 Demo

### Ana Dashboard
![ProAgentAI Dashboard](./docs/screenshots/dashboard.png)
> *Modern ve kullanıcı dostu arayüz ile tüm proje yönetimi işlemlerinizi tek yerden yönetin*

### Proje Analizi
![Proje Analizi](./docs/screenshots/analysis.png)
> *AI, proje açıklamanızı analiz eder ve otomatik olarak görevlere böler*

### Sprint Planlama  
![Sprint Planlama](./docs/screenshots/sprint-planning.png)
> *Takım kapasitesine göre optimal sprint planı oluşturur*

### Jira Entegrasyonu
![Jira Görevleri](./docs/screenshots/jira-integration.png)
> *Jira'daki görevlerinizi görüntüleyin ve yönetin*

---

## 🎯 Temel Özellikler

### 🤖 AI Destekli Analiz
- **Akıllı Görev Oluşturma**: Proje açıklamasından otomatik görev çıkarımı
- **Önceliklendirme**: AI tabanlı akıllı öncelik belirleme
- **Süre Tahmini**: Görevler için gerçekçi süre tahminleri
- **Açıklama İyileştirme**: Görev açıklamalarını otomatik iyileştirme

### 📊 Proje Yönetimi
- **Sprint Planlama**: Takım kapasitesine göre optimal sprint planları
- **Görev Dağılımı**: Ekip üyelerine akıllı görev ataması
- **Durum Takibi**: Gerçek zamanlı proje durum raporları
- **Bağımlılık Yönetimi**: Görev bağımlılıklarını otomatik tespit

### 🔗 Jira Entegrasyonu
- **Senkronizasyon**: Jira ile tam entegrasyon
- **Toplu İşlemler**: Çoklu görev oluşturma ve güncelleme
- **Sprint Yönetimi**: Jira sprint'lerine otomatik görev ataması
- **Gerçek Zamanlı**: Anlık görev durumu güncellemeleri

### 📈 Raporlama
- **AI Raporları**: Detaylı proje durum raporları
- **İstatistikler**: Takım performans metrikleri
- **Risk Analizi**: Potansiyel sorunları önceden tespit
- **Öneriler**: İyileştirme önerileri

---

## 🛠️ Teknoloji Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **AI**: OpenAI GPT-4 Turbo

### Frontend
- **HTML5** - Modern semantic markup
- **CSS3** - Responsive design
- **Vanilla JS** - Pure JavaScript (no frameworks)

### Entegrasyonlar
- **Jira API**: Atlassian REST API v3
- **OpenAI API**: GPT-4 Turbo Preview

---

## 📦 Kurulum

### Ön Gereksinimler

```bash
Node.js >= 18.0.0
npm >= 9.0.0
```

Ayrıca gerekli:
- Jira Cloud hesabı
- OpenAI API key

### Adım 1: Projeyi Klonlayın

```bash
git clone https://github.com/FahriFurkanIlgen/PROAGENTAI.git
cd PROAGENTAI
```

### Adım 2: Bağımlılıkları Yükleyin

```bash
npm install
```

### Adım 3: Environment Ayarları

`.env.example` dosyasını `.env` olarak kopyalayın:

```bash
copy .env.example .env  # Windows
# veya
cp .env.example .env    # Linux/Mac
```

`.env` dosyasını düzenleyin:

```env
# Jira Configuration
JIRA_BASE_URL=https://your-domain.atlassian.net
JIRA_EMAIL=your-email@example.com
JIRA_API_TOKEN=your-jira-api-token
JIRA_PROJECT_KEY=PROJ

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key

# Server Configuration
PORT=3000
NODE_ENV=development
```

### Adım 4: API Key'leri Alın

#### Jira API Token:
1. https://id.atlassian.com/manage-profile/security/api-tokens adresine gidin
2. **"Create API token"** butonuna tıklayın
3. Token'a bir isim verin (örn: "ProAgentAI")
4. Token'ı kopyalayın ve `.env` dosyasına yapıştırın

#### OpenAI API Key:
1. https://platform.openai.com/api-keys adresine gidin
2. **"Create new secret key"** butonuna tıklayın
3. Key'e bir isim verin
4. Key'i kopyalayın ve `.env` dosyasına yapıştırın

### Adım 5: Uygulamayı Başlatın

**Development Modu:**
```bash
npm run dev
```

**Production Build:**
```bash
npm run build
npm start
```

Uygulama `http://localhost:3000` adresinde çalışacaktır.

---

## 🚀 Kullanım

### 1️⃣ Proje Analizi

Proje açıklamanızı girin, AI otomatik olarak görevlere böler:

```
E-ticaret sitesi geliştirmek istiyorum. 
Kullanıcı kayıt/giriş sistemi, ürün listeleme, 
sepet yönetimi ve ödeme entegrasyonu olacak.
```

**AI Çıktısı:**
- 🔐 Kullanıcı Kimlik Doğrulama Sistemi (8 saat)
- 🛍️ Ürün Katalog Yönetimi (12 saat)
- 🛒 Sepet İşlemleri (10 saat)
- 💳 Ödeme Entegrasyonu (16 saat)

### 2️⃣ Sprint Planlama

Takım bilgilerinizi girin:
- **Takım Kapasitesi**: 120 saat/sprint
- **Takım Üyeleri**: Ali, Ayşe, Mehmet
- **Sprint Hedefi**: MVP tamamlanacak

AI size optimal dağılım önerir!

### 3️⃣ Jira Entegrasyonu

- **"Analiz Et ve Jira'da Oluştur"** butonuna tıklayın
- AI tüm görevleri otomatik olarak Jira'da oluşturur
- Sprint'lere otomatik atama yapılır

### 4️⃣ Proje Raporu

**"Rapor Oluştur"** butonuna tıklayın, AI size detaylı rapor sunar:
- 📊 Tamamlanma oranları
- ⚠️ Risk analizi
- 💡 İyileştirme önerileri
- 📈 Trend analizleri

---

## 🔌 API Endpoints

### Health Check
```http
GET /api/health
```

### AI Agent

#### Proje Analizi
```http
POST /api/agent/analyze
Content-Type: application/json

{
  "description": "Proje açıklaması",
  "context": "Ek bağlam (opsiyonel)"
}
```

#### Sprint Planlama
```http
POST /api/agent/plan-sprint
Content-Type: application/json

{
  "teamCapacity": 120,
  "teamMembers": ["Ali", "Ayşe"],
  "goals": "Sprint hedefleri"
}
```

#### Analiz ve Oluştur
```http
POST /api/agent/analyze-and-create
Content-Type: application/json

{
  "description": "Proje açıklaması"
}
```

### Jira

#### Görevleri Listele
```http
GET /api/jira/issues?jql=status="In Progress"
```

#### Görev Oluştur
```http
POST /api/jira/issue
Content-Type: application/json

{
  "fields": {
    "project": { "key": "PROJ" },
    "summary": "Görev başlığı",
    "description": "Açıklama",
    "issuetype": { "name": "Task" },
    "priority": { "name": "High" }
  }
}
```

#### Görev Güncelle
```http
PUT /api/jira/issue/:key
Content-Type: application/json

{
  "fields": {
    "summary": "Yeni başlık"
  }
}
```

---

## 📁 Proje Yapısı

```
ProAgentAI/
├── src/
│   ├── routes/
│   │   ├── agent.routes.ts      # AI endpoint'leri
│   │   └── jira.routes.ts       # Jira endpoint'leri
│   ├── services/
│   │   ├── ai-agent.service.ts  # OpenAI entegrasyonu
│   │   └── jira.service.ts      # Jira API client
│   ├── types/
│   │   └── index.ts             # TypeScript tipleri
│   └── server.ts                # Express sunucusu
├── public/
│   ├── index.html               # Ana sayfa
│   ├── styles.css               # CSS stilleri
│   └── app.js                   # Frontend logic
├── docs/
│   └── screenshots/             # Ekran görüntüleri
├── .env.example                 # Environment şablonu
├── .gitignore                   # Git ignore kuralları
├── package.json                 # NPM dependencies
├── tsconfig.json                # TypeScript config
└── README.md                    # Bu dosya
```

---

## 🤝 Katkıda Bulunma

Katkılarınızı bekliyoruz! 

1. Bu repo'yu fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

---

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

---

## 👤 Yazar

**Furkan İlgen**

- GitHub: [@FahriFurkanIlgen](https://github.com/FahriFurkanIlgen)

---

## 🙏 Teşekkürler

- [OpenAI](https://openai.com/) - GPT-4 API
- [Atlassian](https://www.atlassian.com/) - Jira REST API
- [Express.js](https://expressjs.com/) - Web framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety

---

## 📞 İletişim

Sorularınız veya önerileriniz için [issue](https://github.com/FahriFurkanIlgen/PROAGENTAI/issues) açabilirsiniz.

---

<div align="center">

**[⬆ Başa Dön](#-proagentai)**

Made with ❤️ by [Furkan İlgen](https://github.com/FahriFurkanIlgen)

</div>
