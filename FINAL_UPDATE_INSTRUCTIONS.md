# SKy Fit v9 — tətbiq qaydası

## 1. Supabase

`supabase/final-stabilization.sql` faylını Supabase SQL Editor-də bütöv `Run` edin.

Bu migration:
- məlumat silmir;
- köhnə günlük membership qeydlərini attendance tarixçəsinə köçürür;
- günlük membership qeydlərini tarixçə saxlanılmaqla bağlayır;
- hələ qüvvədə olan aylıq planı lazım olduqda yenidən aktivləşdirir;
- həssas RPC funksiyalarının anonim icrasını bağlayır.

## 2. GitHub

Arxivdəki faylları repository-də eyni yollar üzrə əvəz edin.

Əsas dəyişən fayllar:
- `js/admin.js`
- `js/profile.js`
- `js/app.js`
- `js/favorites.js`
- `css/style.css`
- `service-worker.js`
- `manifest.json`
- `package.json`
- `electron/main.js`
- `index.html`
- `profile.html`
- `sevimliler.html`
- `js/config.js`
- `js/config.example.js`

Yeni fayllar:
- `assets/img/icon-192.png`
- `assets/img/icon-512.png`
- `assets/img/icon-maskable-512.png`
- `assets/img/icon.ico`
- `assets/img/fitness-loader-optimized.gif`
- `supabase/final-stabilization.sql`

## 3. Cache

Commit-dən sonra saytı açın və bir dəfə `Ctrl + F5` edin.

Köhnə PWA qalarsa Firefox/Chrome DevTools-da Service Worker-i `Unregister` edin və səhifəni yeniləyin.

## 4. Test sırası

1. Giriş qeydiyyatı
2. Aylıq abunəlik yaratma
3. POS ödənilmiş satış
4. POS borc satışı
5. Borc ödənişi
6. Stok hərəkətləri
7. Hesabat blokları
8. Tənzimləmələrdə PWA, Realtime və işçi siyahısı
9. Üzv profilində abunəlik, borc, alış və giriş tarixçəsi
