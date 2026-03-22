# EMS Trauma Rapportgenerator

Statische trauma-rapporttool in HTML/CSS/JS/JSON, zonder database en geschikt voor GitHub Pages.

## Bestanden

- `index.html` → de interface
- `styles.css` → de styling
- `app.js` → de logica
- `config.json` → configureerbare opties en kosten
- `Banner.png` → headerafbeelding

## Kenmerken

- geen database
- geen backend
- geen Google nodig
- werkt op GitHub Pages
- rapport automatisch opgebouwd
- MAP en shock index automatisch berekend
- kostprijs automatisch berekend
- export naar `.txt`
- export naar `.json`

## Publiceren op GitHub Pages

1. Maak een nieuwe repository aan.
2. Upload deze bestanden in de root van de repo.
3. Voeg ook `Banner.png` toe.
4. Ga naar **Settings** → **Pages**.
5. Kies branch `main` en folder `/root`.
6. Sla op.
7. Je tool staat daarna online via GitHub Pages.

## Aanpassen

### Opties wijzigen
Pas `config.json` aan voor:
- triage-opties
- eindstatus-opties
- bevindingen
- handelingen
- basistarieven
- supplementen

### Styling wijzigen
Pas `styles.css` aan.

### Logica uitbreiden
Pas `app.js` aan.

## Opmerking

Deze versie bevat bewust geen externe logging met geheime tokens in de frontend.
Als je later toch logging wil, doe dat best via een aparte veilige relay.
