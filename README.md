# Mairepood

Lokaalne arendus- ja tootmiskeskkond kasutab vaikimisi porti 10000 (võib üle kirjutada `PORT` keskkonnamuutujaga).

Käivitus

- Tavapärane stardi käsk:

```powershell
npm run start
```

- Käivitamine kindla pordiga (Linux/macOS):

```bash
PORT=10000 npm run start
```

- Windows PowerShell (keskkonnamuutuja sättimiseks enne käsu käivitamist):

```powershell
$env:PORT = "10000"; npm run start
```

- Spetsiaalne skript `start:10000` olemas mugavuseks.

Render/Platformid

Platvormid nagu Render või Heroku annavad reeglina `PORT` keskkonnamuutuja — see ületab vaikeseadistuse 10000 automaatselt.
