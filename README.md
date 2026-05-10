# SplitCart Demo

Ortak alışveriş / restoran / etkinlik / alışveriş sitesi ödemeleri için split checkout demo sistemi.

## v2 Notları

- Alışveriş Sitesi demosu eklendi.
- Local frontend portu 5188 yapıldı.
- Katılımcı kendi payından veya session kalan tutarından fazla ödeme başlatamaz.

## Canlı Demo Yapısı

- Landing: `/`
- Host panel: `/host/:sessionId`
- Katılımcı ödeme ekranı: `/pay/:sessionId/:participantId`

## Özellikler

- Yeni checkout session oluşturma
- Demo sepet ürünleri
- Katılımcı ekleme
- Eşit bölüşüm
- Her katılımcı için ödeme linki
- Kart / Banka QR / Nakit simülasyonu
- Host panelde ödeme ilerleme durumu
- Ledger kayıtları
- In-memory backend

## Local Çalıştırma

### Backend

```bash
cd server
npm install
npm run build
npm start
```

Backend:
```text
http://localhost:4000
```

### Frontend

Yeni terminal:

```bash
cd web
npm install
npm run build
npm run dev
```

Frontend:
```text
http://localhost:5188
```

## Deploy

Backend Render:
```text
Root Directory: server
Build Command: npm install && npm run build
Start Command: npm start
```

Frontend Netlify:
```text
Build Command: cd web && npm install && npm run build
Publish Directory: web/dist
```

Netlify Environment:
```text
VITE_API_BASE=https://SENIN-RENDER-API.onrender.com/api
```

## Not

Bu demo ödeme sağlayıcılarına gerçek bağlantı yapmaz. Payment provider adapter mimarisi simülasyon olarak kuruludur.
Gerçek uygulama için sıradaki adımlar:

- PostgreSQL / Prisma
- Auth
- WebSocket realtime
- Gerçek ödeme provider adapterları
- Merchant onboarding
- Settlement / reconciliation
