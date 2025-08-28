[Nederlands](MANUAL_TESTING.nl.md) | [English](MANUAL_TESTING.md)

# Handleiding handmatig testen

Gebruik deze gids om het spel handmatig te testen met de Adminbalk. Je kunt hiermee winnende vakjes tonen en verschillende toestanden valideren, waaronder het winnen van een troostprijs en de hoofdprijs.

- Voorkeur: open de live demo op https://nlo-assignment.pages.dev/.
- Alternatief (lokaal): volg de stappen hieronder.

## Vereisten
- Installeer dependencies: `pnpm install`
- Start dev-server: `pnpm dev`
- Open de app in je browser (de terminal toont de lokale URL). In dev staat MSW automatisch aan.

## Adminbalk inschakelen en gebruiken
- Zorg dat de Adminbalk zichtbaar is. Als deze verborgen is, gebruik de schakelaar bovenin om te tonen.
- De Adminbalk bevat o.a.:
  - "Toon prijzen" / "Verberg prijzen": schakelt de overlay met prijzen.
  - "Reset spel…": opent een modal om het bord te resetten met optionele seed.

## Winnende vakjes vinden en testen
1) Prijzen tonen
   - Klik op "Toon prijzen" in de Adminbalk. De prijzen worden zichtbaar op het raster zodat je winnende vakjes kunt vinden.

2) Troostprijs testen
   - Met prijzen zichtbaar, kies een winnend vakje dat niet de hoofdprijs is (een kleinere/troostprijs) en klik het open.
   - Controleer dat de UI naar de toestand "troostprijs gewonnen" gaat (let op prijsreveal, teksten en eventuele knoppen/prompts).
   - Optioneel: klik "Verberg prijzen" om te checken dat de toestand correct blijft zonder overlay.

3) Hoofdprijs testen
   - Klik op "Reset spel…" in de Adminbalk.
   - Laat in de resetmodal het Seed-veld LEEG en bevestig reset.
     - Tip: met een lege seed staat de hoofdprijs in de onderste rij (makkelijk te vinden).
   - Klik opnieuw op "Toon prijzen" om prijzen te tonen.
   - Zoek de hoofdprijs in de onderste rij en open dat vakje.
   - Controleer dat de UI naar de toestand "hoofdprijs gewonnen" gaat (visuals/tekst, eventuele speciale acties).

## Extra controles
- Schakel tussen "Toon prijzen" en "Verberg prijzen" om te verifiëren dat overlays reeds-gewonnen toestanden niet verstoren.
- Gebruik "Wissel van speler" om te bevestigen dat wisselen van sessie/speler de huidige speltoestand niet breekt.
- Pas de botsnelheid aan met de slider en controleer dat de UI responsief blijft en het identificeren/openen van winnende vakjes niet beïnvloedt.

## Reset voor een nieuwe run
- Gebruik "Reset spel…" (met of zonder numerieke seed) om scenario's opnieuw te doorlopen. Onthoud: lege seed plaatst de hoofdprijs op de onderste rij.

## Notities
- De Adminbalk is bedoeld voor testen/ontwikkeling en niet voor productie.
- Als de app bezig is met initialiseren, wacht tot het startscherm is voltooid voordat je met raster/admin-controls interacteert.
