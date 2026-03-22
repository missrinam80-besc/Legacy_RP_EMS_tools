# EMS Ziekenhuiskosten Calculator v2

Versie 2 van de kostencalculator met een dropdown voor type bezoek.

## Kenmerken
- HTML / CSS / JavaScript / JSON
- Geen database
- Geen backend
- Werkt op GitHub Pages
- Dropdown bepaalt welke prijsopties zichtbaar zijn

## Beschikbare types
- Standaard consult
- Spoed / trauma
- Opname
- Operatie
- Overlijden / doodverklaring

## Werking
1. Kies het type bezoek
2. De tool toont enkel relevante kostenopties
3. Kies basiskost, onderzoeken, behandelingen en extra's
4. Voeg indien nodig een correctie toe
5. Kopieer de output

## Prijzen aanpassen
Pas `pricing.json` aan.

Elke prijsregel heeft:
- `id`
- `label`
- `price`
- `types`

Voorbeeld:
```json
{
  "id": "xray",
  "label": "X-ray",
  "price": 300,
  "types": ["emergency", "admission", "surgery"]
}
