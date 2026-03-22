# EMS Operatieverslag Generator

Operatie-tool binnen de multi-tool EMS GitHub-repository.

## Bestanden

- `index.html` → interface van de tool
- `styles.css` → styling van de tool
- `app.js` → logica, rapportopbouw en autosave
- `config.json` → configureerbare opties en kosten
- `README.md` → uitleg per tool

## Kenmerken

- geen database
- geen backend
- geen externe logging
- geschikt voor GitHub Pages
- automatische rapportopbouw
- automatische kostberekening
- export naar `.txt`
- export naar `.json`
- automatische lokale autosave via `localStorage`
- automatische herstel van vorige sessie in dezelfde browser
- aparte opslag per tool via unieke storage key
- knop om alleen lokale opslag te wissen
- reset wist zowel formulier als lokale opslag

## Pad binnen de repo

```text
tools/operatie-report/
