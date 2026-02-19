# Érmegyűjtemény Fotózó Alkalmazás

Családi érmegyűjtemény digitalizálására készült PWA alkalmazás Google Sheets és Drive integrációval.

## 🔐 Hosting és Verziókezelés

- **GitHub Repository**: Személyes Gmail fiókkal regisztrált GitHub-on
- **Deployment**: Személyes Gmail fiókkal regisztrált Render.com-on
- **Repository URL**: https://github.com/blaskovichbence-eng/erme-fotok

## Funkciók

- ✅ Google OAuth2 bejelentkezés
- ✅ Google Sheets integráció - érmék adatainak lekérdezése sorszám alapján
- ✅ Képfeltöltés mobilról (kamera vagy galéria)
- ✅ **4 képtípus támogatása**: Előlap (A), Hátlap (B), Doboz kép (D), Egyéb kép (E)
- ✅ Automatikus képfeldolgozás (tömörítés max 1MB)
- ✅ Google Drive feltöltés strukturált mappákba (50-es csoportok)
- ✅ Automatikus fájlnév generálás slug-gal (max 25 karakter)
- ✅ Sheet automatikus frissítése linkekkel és Drive ID-kkal (A-Y oszlopok)
- ✅ Háttérben futó feltöltési sor (upload queue)
- ✅ Lista nézet - képek nélküli érmék lapozható listája
- ✅ Automatikus következő érme betöltés lista nézetben
- ✅ PWA támogatás - Add to Home Screen

## Telepítés

### 1. Függőségek telepítése

```bash
npm install
```

### 2. Környezeti változók beállítása

Hozz létre egy `.env` fájlt a projekt gyökérkönyvtárában:

```env
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
VITE_GOOGLE_API_KEY=your-api-key
VITE_SHEET_ID=your-sheet-id
VITE_DRIVE_FOLDER_ID=your-drive-folder-id
```

### 3. Google Cloud Console beállítások

1. **APIs & Services** → **Credentials**
2. **OAuth 2.0 Client ID** létrehozása (Web application)
3. **Authorized JavaScript origins**:
   - `http://localhost:3000`
   - `http://127.0.0.1:3000`
   - Az ngrok URL (ha használod)
4. **API Key** létrehozása és korlátozása:
   - Google Sheets API
   - Google Drive API

### 4. Google Sheet struktúra

A Sheet-nek tartalmaznia kell ezeket az oszlopokat (A-Y):

| A | B | C | D | E | F | G | H | I | J | ... | O | ... | R | S | T | U | V | W | X | Y |
|---|---|---|---|---|---|---|---|---|---|-----|---|-----|---|---|---|---|---|---|---|---|
| Sorszám | Tervező | Leírás | Dobozban | Csomagolás | Év | Anyag | Súly | Méret | Megjegyzés | ... | Értékesítve | ... | Előlap Kép | Hátlap Kép | Előlap Drive ID | Hátlap Drive ID | Doboz Kép | Doboz Drive ID | Egyéb Kép | Egyéb Drive ID |

### 5. Google Drive mappa struktúra

Root mappa (pl. `Erme_kepek`) alatt automatikusan létrejönnek az 50-es almappák:
- `0001-0050`
- `0051-0100`
- `0101-0150`
- stb.

## Fejlesztés

### Lokális futtatás

```bash
npm run dev
```

Az alkalmazás elérhető: `http://localhost:3000`

### Hálózati hozzáférés (mobilról)

```bash
npm run dev -- --host
```

### ngrok használata (HTTPS)

```bash
ngrok http 3000
```

Majd add hozzá az ngrok URL-t a Google Cloud Console-ban az Authorized JavaScript origins-hez.

## Használat

1. **Bejelentkezés** Google fiókkal
2. **Sorszám megadása** (pl. 4086)
3. **Érme adatok ellenőrzése**
4. **Checkbox pipálása** ("Megerősítem, hogy ez a megfelelő érme")
5. **Fotózás** gombra kattintás
6. **Képek kiválasztása** (kamera vagy galéria)
7. **Feltöltés és mentés**
8. **Automatikus ugrás** következő sorszámra

## Fájlnév konvenció

```
<sorszám>_<slug>_<oldal>.jpg
```

Példa: `4086_csonka-janos-1852-1939_A.jpg`

- Sorszám: 4 számjegy, nullákkal kiegészítve
- Slug: leírásból generált, max 25 karakter, ékezet nélkül
- Oldal: 
  - **A** (előlap) - kötelező
  - **B** (hátlap) - kötelező
  - **D** (doboz kép) - opcionális
  - **E** (egyéb kép) - opcionális

## PWA Telepítés iPhone-on

1. Nyisd meg az alkalmazást Safari-ban
2. Kattints a **Share** gombra
3. Válaszd az **"Add to Home Screen"** opciót
4. Adj nevet az ikonnak
5. Kattints **"Add"**

## Technológiai Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **Icons**: Lucide React
- **Image Processing**: browser-image-compression
- **Google APIs**: gapi + Google Identity Services

## Projekt Struktúra

```
src/
├── components/
│   ├── CoinEntry.tsx       # Sorszám keresés
│   └── PhotoCapture.tsx    # Fotózás és feltöltés
├── services/
│   ├── googleAuth.ts       # OAuth2 autentikáció
│   ├── googleSheets.ts     # Sheets API
│   └── googleDrive.ts      # Drive API
├── utils/
│   ├── imageProcessor.ts   # Képfeldolgozás
│   └── fileNaming.ts       # Fájlnév és mappa logika
├── types/
│   ├── coin.ts            # Érme típusok
│   └── google.ts          # Google API típusok
└── App.tsx                # Főkomponens
```

## Fejlesztési Jegyzetek

- A Cross-Origin-Opener-Policy figyelmeztetések normálisak és nem akadályozzák a működést
- Az ngrok ingyenes verziója időnként új URL-t generál, amit frissíteni kell a Google Cloud Console-ban
- A PWA ikonok jelenleg placeholder SVG-k, később PNG-re cserélhetők

## Licensz

Családi használatra készült alkalmazás.
