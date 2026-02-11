# ProAgentAI - AI Project Manager

AI destekli proje yönetimi asistanı. Jira entegrasyonu ile görev yönetimi, sprint planlama ve ekip koordinasyonu sağlar.

## 🚀 Özellikler

- ✅ Jira entegrasyonu (task oluşturma, güncelleme, listeleme)
- 🤖 AI destekli görev analizi ve önceliklendirme
- 📊 Sprint planlama önerileri
- 🎯 Akıllı görev atama
- 📈 Proje durumu raporlama

## 📦 Kurulum

### 1. Bağımlılıkları yükleyin:
```bash
npm install
```

### 2. Environment değişkenlerini ayarlayın:
`.env.example` dosyasını `.env` olarak kopyalayın ve gerekli bilgileri doldurun:

```bash
cp .env.example .env
```

### 3. Jira API Token Oluşturma:
1. https://id.atlassian.com/manage-profile/security/api-tokens adresine gidin
2. "Create API token" butonuna tıklayın
3. Token'ı kopyalayın ve `.env` dosyasına ekleyin

### 4. OpenAI API Key:
1. https://platform.openai.com/api-keys adresine gidin
2. Yeni bir API key oluşturun
3. Key'i `.env` dosyasına ekleyin

## 🏃 Çalıştırma

### Development modunda:
```bash
npm run dev
```

### Production build:
```bash
npm run build
npm start
```

## 📖 Kullanım

Tarayıcınızda `http://localhost:3000` adresini açın.

### API Endpoints:

- `GET /api/health` - Sistem durumu
- `POST /api/agent/analyze` - Proje analizi yap
- `GET /api/jira/issues` - Jira görevlerini listele
- `POST /api/jira/issue` - Yeni görev oluştur
- `PUT /api/jira/issue/:id` - Görevi güncelle
- `POST /api/agent/plan-sprint` - Sprint planla

## 🛠️ Teknolojiler

- **Backend**: Node.js, TypeScript, Express
- **AI**: OpenAI GPT-4
- **Jira**: Atlassian REST API
- **Frontend**: HTML, CSS, Vanilla JavaScript

## 📝 Lisans

MIT
