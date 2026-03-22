# EMS Ziekenhuiskosten Calculator

Losse webtool voor het berekenen van ziekenhuiskosten binnen een EMS / ziekenhuiscontext.

## Kenmerken
- Volledig in HTML, CSS, JavaScript en JSON
- Geen database
- Geen backend
- Geschikt voor GitHub Pages
- Makkelijk aanpasbare prijzen via `pricing.json`

## Bestanden
- `index.html` → interface
- `style.css` → opmaak
- `script.js` → logica
- `pricing.json` → tarieven
- `README.md` → documentatie

## Gebruik
1. Open `index.html` lokaal of via GitHub Pages
2. Kies een basiskost
3. Vink onderzoeken, behandelingen en extra's aan
4. Voeg indien nodig een manuele correctie toe
5. Kopieer het overzicht of de compacte tekst

## Prijzen aanpassen
Pas de waarden in `pricing.json` aan.

Voorbeeld:
```json
{ "id": "xray", "label": "X-ray", "price": 300 }
