# 🚀 Hızlı Başlangıç Komutu

Aşağıdaki komutları sırasıyla çalıştırın:

```bash
# 1. Bağımlılıkları yükle
npm install

# 2. .env dosyası oluştur
copy .env.example .env

# 3. .env dosyasını düzenle (Jira ve OpenAI bilgilerinizi girin)
notepad .env

# 4. Uygulamayı çalıştır
npm run dev
```

Tarayıcınızda http://localhost:3000 açın!

## Hızlı Test

```bash
# API'yi test et
curl http://localhost:3000/api/health

# Jira bağlantısını test et
curl http://localhost:3000/api/jira/test
```

Detaylı kurulum için `SETUP_GUIDE.md` dosyasına bakın.
