# SKy Fit — Real Supabase/PWA/Electron sistemi

## 1. Supabase qur
1. Supabase Dashboard-da yeni project yarat.
2. SQL Editor → New query.
3. `supabase/database.sql` faylının hamısını yapışdır və **Run** et.
4. Authentication → Providers → Email aktiv qalsın.
5. Authentication → URL Configuration:
   - Site URL: GitHub Pages ünvanın
   - Redirect URLs: `https://USERNAME.github.io/REPO/**`
6. Project Settings → API:
   - Project URL
   - anon public key
   məlumatlarını götür.
7. `js/config.js` daxilində `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SITE_URL` dəyiş.

## 2. İlk admin
1. Saytda `register.html` ilə öz hesabını yarat.
2. Email təsdiqini et.
3. SQL Editor-da:
```sql
update public.profiles
set role='admin'
where email='SENIN_EMAILIN';
```
4. Çıxış edib yenidən daxil ol və `admin.html` aç.

## 3. Məhsul məntiqi
- `unit`: Su, bağlı protein, aksesuar. Hər satış stokdan say qədər düşür.
- `portion`: Açıq protein, kreatin, amino.
  - `stock_quantity`: 5000 qram və ya 500 tablet.
  - `portion_size`: 30 qram və ya 6 tablet.
  - `portion_price`: 2 və ya 3 AZN.
  - 1 porsiya satılanda stokdan `portion_size` avtomatik düşür.

## 4. GitHub Pages
Bütün faylları repository kökünə yüklə.
Settings → Pages → Deploy from branch → main / root.

## 5. PWA
GitHub Pages HTTPS ilə açıldıqdan sonra brauzerdə Install App görünəcək.
Service worker statik faylları cache edir; Supabase sorğuları həmişə onlayn qalır.

## 6. Windows EXE
Node.js quraşdır.
Terminal:
```bash
npm install
npm run start
npm run dist
```
Installer `dist/` qovluğunda yaranacaq.

## Təhlükəsizlik
- Brauzerdə yalnız `anon key` istifadə olunur.
- `service_role` key heç vaxt frontendə yazılmamalıdır.
- Məlumat icazələri RLS ilə qorunur.
- POS/stok/borc əməliyyatları SQL RPC daxilində transaction kimi işləyir.
