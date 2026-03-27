# 🚀 PANDUAN DEPLOY PENUH — StockWise
## Dari Zero Sampai Online (Windows)

> Ikut langkah **IKUT URUTAN**. Jangan skip.

---

## BAHAGIAN 1 — INSTALL SOFTWARE (Buat Sekali Sahaja)

### 1A. Install Node.js
1. Pergi → https://nodejs.org
2. Klik butang **"LTS"** (yang hijau besar)
3. Download → double click → Next → Next → Finish
4. **Verify:** Buka Command Prompt (`Win + R` → taip `cmd` → Enter)
   ```
   node --version
   ```
   Kena keluar: `v20.x.x` atau lebih tinggi ✅

### 1B. Install Git
1. Pergi → https://git-scm.com/download/win
2. Download → install semua **default** (next sampai habis)
3. **Verify** dalam cmd:
   ```
   git --version
   ```
   Kena keluar: `git version 2.x.x` ✅

---

## BAHAGIAN 2 — SETUP AKAUN (Buat Sekali Sahaja)

### 2A. GitHub (simpan kod)
1. Pergi → https://github.com
2. Klik **Sign up**
3. Masuk email, password, username
4. Verify email
5. Pilih **Free plan** ✅

### 2B. Supabase (database percuma)
1. Pergi → https://supabase.com
2. Klik **Start your project**
3. Klik **Continue with GitHub** → authorize
4. Klik **New project**
5. Isi:
   - **Name:** `stockwise-db`
   - **Database Password:** buat password kuat, **SIMPAN DI TEMPAT SELAMAT**
   - **Region:** pilih `Southeast Asia (Singapore)`
6. Klik **Create new project**
7. Tunggu 2-3 minit sampai siap (ada loading bar)
8. Bila dah siap, pergi **Settings → Database**
9. Scroll ke bawah cari **"Connection string"** → pilih tab **"URI"**
10. Copy string tu — nampak macam ni:
    ```
    postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxx.supabase.co:5432/postgres
    ```
    **SIMPAN STRING INI** — akan guna lepas ni ✅

### 2C. Railway (host backend percuma)
1. Pergi → https://railway.app
2. Klik **Login** → **Login with GitHub**
3. Authorize Railway
4. Verify akaun dengan email jika diminta ✅

### 2D. Vercel (host frontend percuma)
1. Pergi → https://vercel.com
2. Klik **Sign Up** → **Continue with GitHub**
3. Authorize Vercel ✅

---

## BAHAGIAN 3 — UPLOAD KOD KE GITHUB

### 3A. Extract dan buka projek
1. Extract fail `inventory-saas.zip` — contoh extract ke `C:\Projects\inventory-saas`
2. Buka **VSCode**
3. **File → Open Folder** → pilih folder `inventory-saas`

### 3B. Buka Terminal dalam VSCode
- Tekan `` Ctrl + ` `` (backtick, butang kiri nombor 1)
- Atau **Terminal → New Terminal**

### 3C. Setup Git dan upload ke GitHub

**Dalam terminal VSCode, taip satu persatu:**

```bash
git init
git add .
git commit -m "Initial commit - StockWise inventory app"
```

Sekarang pergi ke GitHub:
1. Klik **+** (atas kanan) → **New repository**
2. **Repository name:** `stockwise`
3. Pilih **Private** (supaya orang lain tak nampak kod)
4. **JANGAN** tick "Add README" atau apa-apa
5. Klik **Create repository**
6. GitHub akan tunjuk arahan — copy bahagian **"push an existing repository"**:

```bash
git remote add origin https://github.com/USERNAME/stockwise.git
git branch -M main
git push -u origin main
```

Ganti `USERNAME` dengan username GitHub kau.

Bila push, Git akan tanya username dan password GitHub. Untuk password, kau kena guna **Personal Access Token**, bukan password biasa:
1. GitHub → klik avatar (atas kanan) → **Settings**
2. Scroll ke bawah → **Developer settings**
3. **Personal access tokens → Tokens (classic)**
4. **Generate new token (classic)**
5. Note: `stockwise-deploy`
6. Expiration: **No expiration**
7. Tick: **repo** (semua sub-options)
8. **Generate token** → **COPY TOKEN SEKARANG** (tak boleh tengok semula)
9. Guna token tu sebagai "password" masa Git tanya ✅

---

## BAHAGIAN 4 — DEPLOY BACKEND KE RAILWAY

### 4A. Buat project baru di Railway
1. Pergi → https://railway.app/dashboard
2. Klik **New Project**
3. Klik **Deploy from GitHub repo**
4. Kalau pertama kali, klik **Configure GitHub App** → authorize
5. Pilih repo `stockwise`
6. Railway akan detect ada 2 folder — pilih **server**
7. Klik **Deploy Now**

### 4B. Set Environment Variables di Railway
1. Dalam Railway project, klik service yang baru dibuat
2. Klik tab **Variables**
3. Klik **RAW Editor** dan paste semua ni sekaligus:

```
NODE_ENV=production
DATABASE_URL=PASTE_SUPABASE_CONNECTION_STRING_DARI_BAHAGIAN_2B
JWT_SECRET=PASTE_JWT_SECRET_DARI_LANGKAH_BAWAH
JWT_EXPIRES_IN=7d
CLIENT_URL=https://PLACEHOLDER_UPDATE_LATER.vercel.app
```

**Untuk generate JWT_SECRET:**
- Dalam VSCode terminal, taip:
  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```
- Copy output (string panjang) → paste dalam `JWT_SECRET`

4. Klik **Update Variables**
5. Railway akan auto-redeploy

### 4C. Run database migration
1. Dalam Railway, klik tab **Settings**
2. Cari **Deploy** section
3. Dalam **Start Command**, tukar kepada:
   ```
   npm run db:migrate && npm start
   ```
4. Save → Railway akan redeploy dan jalankan migration secara auto

### 4D. Dapat Railway URL
1. Klik tab **Settings** → **Domains**
2. Klik **Generate Domain**
3. Kau dapat URL macam: `stockwise-production-xxxx.railway.app`
4. **SIMPAN URL INI** ✅

**Test backend hidup:** Buka browser → `https://stockwise-production-xxxx.railway.app/health`
Kena nampak: `{"success":true,"message":"API is running"...}` ✅

---

## BAHAGIAN 5 — DEPLOY FRONTEND KE VERCEL

### 5A. Import project ke Vercel
1. Pergi → https://vercel.com/dashboard
2. Klik **Add New → Project**
3. Pilih repo `stockwise` dari GitHub
4. Vercel detect ada 2 folder — klik **Edit** next to Root Directory
5. Tukar ke `client`
6. Klik **Continue**

### 5B. Set Environment Variable
Dalam bahagian **Environment Variables** sebelum deploy:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_API_URL` | `https://stockwise-production-xxxx.railway.app/api` |

(Ganti dengan Railway URL kau dari Bahagian 4D)

### 5C. Deploy
1. Klik **Deploy**
2. Tunggu 2-3 minit
3. Vercel bagi URL: `https://stockwise-xxxx.vercel.app`
4. **SIMPAN URL INI** ✅

---

## BAHAGIAN 6 — UPDATE CORS DI RAILWAY

Sekarang kau dah ada Vercel URL, kena update Railway supaya accept request dari situ:

1. Pergi Railway → Variables
2. Update `CLIENT_URL`:
   ```
   CLIENT_URL=https://stockwise-xxxx.vercel.app
   ```
   (URL Vercel kau)
3. Save → Railway redeploy (1-2 minit)

---

## BAHAGIAN 7 — BUAT AKAUN PERTAMA (KAU SEBAGAI ADMIN)

1. Buka `https://stockwise-xxxx.vercel.app`
2. Klik **Create Account**
3. Daftar dengan email dan password kau
4. Done — kau masuk dashboard! ✅

---

## BAHAGIAN 8 — SHARE KE USER

URL yang kau share ke customer:
```
https://stockwise-xxxx.vercel.app
```

Dorang boleh:
- Register akaun sendiri
- Login dan manage inventory dorang sendiri
- Data dorang terasing (multi-tenant)

---

## TROUBLESHOOTING

**❌ "git is not recognized"**
→ Restart VSCode selepas install Git

**❌ Railway deploy failed**
→ Klik **View Logs** → screenshot error → tanya aku

**❌ Frontend nampak tapi login tak jalan**
→ Check `NEXT_PUBLIC_API_URL` dalam Vercel variables — kena ada `/api` di hujung
→ Check `CLIENT_URL` dalam Railway — kena match URL Vercel

**❌ Database error**
→ Verify Supabase DATABASE_URL betul — kena include password

**❌ "Invalid token" selepas login**
→ JWT_SECRET dalam Railway variables kena ada dan panjang

---

## SELEPAS DEPLOY — APA KENA BUAT

### Dapatkan domain sendiri (optional, ~RM45/tahun)
1. Beli domain di → https://namecheap.com atau https://cloudflare.com
2. Connect ke Vercel: Vercel Dashboard → Domains → Add

### Bila nak charge user (Stripe)
1. Daftar → https://stripe.com
2. Tak perlu modal — Stripe ambil % dari setiap bayaran je
3. Beritahu aku bila ready — aku akan generate kod payment integration

### Upgrade bila traffic tinggi
- Railway: $5/bulan bila free tier habis
- Supabase: free sampai 500MB database
- Vercel: free untuk traffic biasa

---

## RINGKASAN URLS

Simpan semua ini:

| Apa | URL |
|-----|-----|
| App (user guna) | https://stockwise-xxxx.vercel.app |
| Backend API | https://stockwise-xxxx.railway.app |
| Database | https://supabase.com (login untuk monitor) |
| Code | https://github.com/USERNAME/stockwise |

