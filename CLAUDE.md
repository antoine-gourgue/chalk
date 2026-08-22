@AGENTS.md

# Chalk

Le logiciel d'une salle de sport : le coach programme les séances, les membres réservent et notent
leurs perfs, et l'écran du mur affiche la séance, le chrono et le classement du créneau en direct.

## Stack

Next.js App Router · TypeScript strict · Tailwind 4 · Prisma + PostgreSQL · socket.io · vitest

## Les trois surfaces

| Surface | Route    | Auth                   | Contexte                           |
| ------- | -------- | ---------------------- | ---------------------------------- |
| Mur     | `/wall`  | Appairage à 6 chiffres | Écran fixe, lu à 5 mètres          |
| Coach   | `/box/…` | E-mail                 | Desktop, dense, au clavier         |
| Membre  | `/app/…` | E-mail                 | Mobile, au pouce, une action/écran |

## Règle non négociable

**Le chrono ne se diffuse pas tick par tick.** Le serveur garde l'instant de départ du bloc, chaque
écran calcule son affichage (`src/lib/timer.ts`), et la dérive d'horloge est corrigée à la poignée
de main. Sinon le mur et les téléphones divergent de plusieurs secondes.

## Design

Direction « salle obscure » : fond violet très sombre, trois couleurs à emploi unique — violet
(marque et interactif), rose (urgence, tête de classement), cyan (données). Jetons dans
`src/app/globals.css`, planche complète dans `docs/identite.html`, comparatif des directions
écartées dans `docs/maquettes.html`. Typo : Outfit, plus IBM Plex Mono pour les colonnes de chiffres.

## Conventions

- Commits : conventional commits, sujet en minuscule (vérifiés par husky et par le CI)
- CI : GitHub Actions autonome (`.github/workflows/ci.yml`)
- Images : `ghcr.io/antoine-gourgue/chalk`

## GitHub

- Project : antoine-gourgue/Chalk
- Board : les tickets sont créés par l'agent product-manager
