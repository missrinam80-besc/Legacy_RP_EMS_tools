# EMS Behandelingstool v2

## Doel
Deze tool helpt EMS-medewerkers om op basis van letsels, fracturen, vitale functies, pijnniveau en bloedverlies een logisch behandeladvies te krijgen.

## Functionaliteiten
- meerdere verwondingen per lichaamsdeel
- vaste lichaamsdelen:
  - linkerarm
  - rechterarm
  - linkerbeen
  - rechterbeen
  - hoofd
  - rompgedeelte
- invoer van:
  - hartslag / pols
  - bloeddruk
  - lichaamstemperatuur
  - pijnlevel
  - bloedverlies
- automatische urgentie-inschatting
- behandeling per lichaamsdeel
- algemene behandeling
- waarschuwingen
- materiaal- en medicatielijst
- kopieerbare en downloadbare samenvatting

## Bestanden
- `index.html` → structuur van de tool
- `style.css` → opmaak en EMS-stijl
- `script.js` → logica en analyse
- `config.json` → alle aanpasbare data

## Belangrijk
De tool gebruikt `fetch()` om `config.json` te laden.

Werk daarom:
- via GitHub Pages
- of via een lokale webserver

Niet via dubbelklikken op `index.html`, want dan blokkeert de browser vaak het laden van JSON.

## Wat kan je aanpassen in config.json
- titel en subtitel
- lichaamsdelen
- wondtypes
- labels
- bloeding en pijnscores
- nood aan hechten
- verbanden en effectiviteit
- medicatie
- vitale drempelwaarden

## Mogelijke volgende uitbreidingen
- extra symptoomvelden
- aparte modus voor trauma / opname / operatie
- export naar rapporttekst
- protocolteksten volledig uit aparte JSON
- kleurcodes per lichaamsdeel
- aparte waarschuwingen voor torso/head trauma
