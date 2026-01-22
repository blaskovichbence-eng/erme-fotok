# Render.com Deployment Útmutató

Ez az útmutató segít telepíteni az Érmegyűjtemény Fotózó alkalmazást a Render.com hosting platformra.

## Előkészületek

### 1. GitHub Repository

Először töltsd fel a projektet GitHub-ra:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

## Render.com Beállítás

### 1. Új Web Service Létrehozása

1. Menj a [Render.com](https://render.com) oldalra és jelentkezz be
2. Kattints a **"New +"** gombra
3. Válaszd a **"Web Service"** opciót
4. Csatlakoztasd a GitHub repository-dat
5. Válaszd ki a projektet

### 2. Build & Deploy Beállítások

A következő beállításokat add meg:

| Mező | Érték |
|------|-------|
| **Name** | `ermegyujtemeny-fotozo` (vagy bármilyen név) |
| **Environment** | `Node` |
| **Region** | `Frankfurt (EU Central)` (vagy bármilyen EU régió) |
| **Branch** | `main` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Instance Type** | `Free` (vagy fizetős, ha gyorsabb kell) |

### 3. Environment Variables

Kattints az **"Advanced"** gombra és add hozzá ezeket a környezeti változókat:

| Key | Value | Honnan szerzed be |
|-----|-------|-------------------|
| `VITE_GOOGLE_CLIENT_ID` | `123456789-abc.apps.googleusercontent.com` | Google Cloud Console → Credentials |
| `VITE_GOOGLE_API_KEY` | `AIzaSy...` | Google Cloud Console → Credentials → API Keys |
| `VITE_SHEET_ID` | `1abc...xyz` | Google Sheets URL-ből |
| `VITE_DRIVE_FOLDER_ID` | `1def...uvw` | Google Drive mappa URL-ből |

**Fontos:** A `.env` fájlt **NE** töltsd fel GitHub-ra! Add hozzá a `.gitignore` fájlhoz.

### 4. Deploy

1. Kattints a **"Create Web Service"** gombra
2. Render automatikusan elkezdi a build-et
3. Várj 2-5 percet, amíg a deployment befejeződik
4. Megkapod az URL-t, pl: `https://ermegyujtemeny-fotozo.onrender.com`

## Google Cloud Console Frissítés

Miután megkaptad a Render URL-t, frissítsd a Google OAuth beállításokat:

### 1. Authorized JavaScript Origins

1. Menj a [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Kattints az OAuth 2.0 Client ID-ra
3. **Authorized JavaScript origins** részhez add hozzá:
   ```
   https://ermegyujtemeny-fotozo.onrender.com
   ```
4. Kattints **"Save"**
5. Várj 1-2 percet

### 2. Tesztelés

1. Nyisd meg a Render URL-t böngészőben
2. Próbálj bejelentkezni Google fiókkal
3. Teszteld a teljes folyamatot

## Automatikus Deployment

Render automatikusan újra deploy-ol minden alkalommal, amikor push-olsz a `main` branch-re:

```bash
git add .
git commit -m "UI improvements"
git push origin main
```

## Hibakeresés

### Build Hiba

Ha a build sikertelen, nézd meg a Render logs-ot:
- Kattints a service-re
- Menj a **"Logs"** fülre
- Keresd meg a hibaüzenetet

### Environment Variables Hiba

Ha a Google bejelentkezés nem működik:
1. Ellenőrizd, hogy minden `VITE_` prefixű változó be van-e állítva
2. Ellenőrizd, hogy a Google Cloud Console-ban hozzáadtad-e a Render URL-t
3. Várj 1-2 percet a Google beállítások frissülése után

### CORS Hiba

Ha CORS hibát kapsz:
- Ellenőrizd, hogy a Render URL pontosan egyezik a Google Cloud Console-ban megadottal
- Ne használj trailing slash-t (`/`) az URL végén

## Free Tier Korlátok

A Render.com ingyenes tier-je:
- ✅ 750 óra/hó (elég egy alkalmazáshoz)
- ⚠️ Alvó módba kerül 15 perc inaktivitás után
- ⚠️ Első betöltés lassú lehet (cold start ~30 sec)
- ✅ Automatikus HTTPS
- ✅ Automatikus deployment

### Cold Start Megoldás

Ha szeretnéd elkerülni a cold start-ot:
1. Használj fizetős instance-t ($7/hó)
2. Vagy használj cron job-ot, ami 10 percenként ping-eli az oldalt

## Költségek

| Tier | Ár | Jellemzők |
|------|-----|-----------|
| **Free** | $0/hó | 750 óra, alvó mód, cold start |
| **Starter** | $7/hó | Nincs alvó mód, gyorsabb |
| **Standard** | $25/hó | Több erőforrás, jobb teljesítmény |

## Hasznos Parancsok

### Lokális Production Build Tesztelés

```bash
npm run build
npm start
```

Majd nyisd meg: `http://localhost:3000`

### Logs Nézése Render-en

1. Menj a Render dashboard-ra
2. Kattints a service-re
3. **Logs** fül

### Manuális Redeploy

1. Render dashboard → Service
2. **Manual Deploy** → **Deploy latest commit**

## Biztonsági Megjegyzések

- ✅ `.env` fájl a `.gitignore`-ban van
- ✅ API kulcsok csak Render environment variables-ben
- ✅ HTTPS automatikusan engedélyezve
- ✅ Google OAuth csak engedélyezett domain-ekről

## Támogatás

Ha problémád van:
1. Nézd meg a Render logs-ot
2. Ellenőrizd a Google Cloud Console beállításokat
3. Teszteld lokálisan: `npm run build && npm start`

---

**Sikeres deployment-et!** 🚀
