# Deployment Guide

## Projektist
See repo sisaldab lihtsat Maire Rästa e‑poodi koos kahekordse frontendiga (`index.html` ja `admin.html`) ning Node/Express backendiga, mis salvestab tooted ja tellimused failidena.

Backend on konfigureeritud nii, et:
- tooted loetakse ja kirjutatakse `products.json`
- tellimused salvestatakse `orders/` kausta eraldi JSON-failidena
- GitHubi remote lisamine toimub automaatselt, kui `GITHUB_REPO` ja `GITHUB_TOKEN` on seadistatud

## Nõuded
- Node.js 18+ (või uuem)
- npm
- Git
- GitHubi isiklik access token

## 1. `package.json` ja sissetallimine
Installi sõltuvused:

```bash
npm install
```

Seejärel käivita server lokaalselt:

```bash
GITHUB_REPO=your-username/mairepood GITHUB_TOKEN=your_token npm run dev
```

Kui tahad lihtsalt käivitada ilma GitHubi ühenduseta, jäta `GITHUB_REPO` ja `GITHUB_TOKEN` määramata. Server töötab siis ainult kohalikult.

## 2. Keskkonnamuutujad
Backend otsib järgmisi väärtusi:

- `GITHUB_REPO` — GitHubi repo vormingus `kasutaja/mairepood`
- `GITHUB_TOKEN` — GitHubi personal access token
- `PORT` — serveri pordi olemasolul (vaikimisi `3000`)

Token peab olema kirjutusõigustega teie repo`sse. Klassikalist tokenit saad luua GitHubi seadetest: https://github.com/settings/tokens

## 3. Frontendi API-URL seadistamine
Avage `index.html` ja `admin.html` ning lisage `<script>` enne teisi skripte:

```html
<script>
  window.API_URL = 'https://your-backend-url.com';
</script>
```

Kui te seda ei lisa, kasutab frontend vaikimisi `http://localhost:3000`.

## 4. GitHubi ning deploy-platvormi seadistamine
Backend püüab serveri esimesel käivitamisel lisada Git remote'i, kui seda pole. Selleks peab olema seadistatud:

- `GITHUB_REPO` (näiteks `priit/mairepood`)
- `GITHUB_TOKEN`

Kui remote pole veel konfigureeritud, teeb server `git remote add origin https://<token>@github.com/<GITHUB_REPO>.git`.

### Soovitatud deploy-platvormid
- Vercel: lihtne seadistada ja toetab Node.js väljundit
- Render: sobib ka Node-backendile
- Railway: kiire deploy ja env muutujate haldus

Üldine ülesanne deploy jaoks:
1. Põhimeetod: loo GitHubis repo ja pushi kood
2. Loo deploy-platvormil uus projekt GitHub repo järgi
3. Lisa keskkonnamuutujad `GITHUB_REPO`, `GITHUB_TOKEN`, `PORT`
4. Kasuta antud URL-i `window.API_URL`

## 5. Mis failid GitHubi jõuavad
Sinu repo aluseks oleva projekti faili struktuur võib olla:

```text
admin.html
admin.js
app.js
index.html
package.json
server.js
styles.css
products.json
orders/
  order-xxxxx.json
```

Server lisab Git commit-id automaatselt iga tellimuse ja tooteuuenduse järel.

## 6. Testimine
### Lokaalselt
```bash
npm run dev
```
Ava brauseris `http://localhost:3000` ja kontrolli:
- `index.html` / ostukorv
- `admin.html` / tooted ja tellimused

### Backend ja GitHub
1. Ava `admin.html`
2. Lisa või muuda toodet
3. Kontrolli, kas `products.json` commititakse repo`sse
4. Ava `index.html`
5. Tee ostukorv ja esita tellimus
6. Kontrolli, kas uus tellimus on salvestatud `orders/` kausta GitHubis

## 7. Turvalisuse märkus
- `GITHUB_TOKEN` on sensitiivne väärtus. Ära pane seda otse lähtekoodi ega avalikku repo`sse.
- Kui kasutad platvormi nagu Vercel või Render, sisesta token keskkonnamuutujatesse.
- Kui tokeni asemel soovid turvalisemat lahendust, vaata GitHub Actionsi või spetsiaalset serverilahendust.

---

Kui soovid, saan ka sisu järgmise sammuna muuta, et see toetaks `main` haru, failide algset initimist ja admini automaatset esmakäitust.    
