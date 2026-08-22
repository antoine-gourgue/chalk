# Chalk

**La séance au mur, en direct.**

Le logiciel d'une salle de sport, en trois surfaces : le coach programme la semaine, les membres
réservent leur créneau et notent leurs perfs, et l'écran accroché au mur de la salle affiche la
séance du jour, le chrono et le classement du créneau en temps réel.

## Démarrer

```bash
cp .env.example .env      # puis renseigner DATABASE_URL et AUTH_SECRET
npm install
npm run db:up             # PostgreSQL local
npm run db:migrate
npm run dev:all           # Next.js + passerelle temps réel
```

## Voir le produit

- `/demo/wall` — le mur de la salle de démonstration, sans compte ni appairage
- `/box/demo/chrono` — le pupitre du coach qui le pilote
- `/app/demo` — l'app membre, qui remplit le classement

## Comptes de démonstration

Après `npm run db:seed`, mot de passe `chalk` pour tout le monde :

| Compte               | Rôle   | Atterrit sur        |
| -------------------- | ------ | ------------------- |
| `lea@chalk.demo`     | Owner  | `/box/demo/semaine` |
| `membre1@chalk.demo` | Membre | `/app/demo`         |

## Scripts

| Script              | Rôle                                 |
| ------------------- | ------------------------------------ |
| `npm run dev:all`   | App et passerelle socket.io ensemble |
| `npm run lint`      | ESLint                               |
| `npm run typecheck` | `tsc --noEmit`                       |
| `npm run test`      | vitest                               |
| `npm run format`    | Prettier sur tout le dépôt           |
| `npm run db:studio` | Prisma Studio                        |

## Architecture

- `src/app` — App Router : le mur, l'app coach, l'app membre
- `src/lib` — logique métier partagée (dont le calcul du chrono)
- `realtime/` — passerelle socket.io : état des chronos et classements en direct
- `prisma/` — schéma et migrations
- `docs/` — planche d'identité et directions visuelles

Le chrono n'est jamais diffusé seconde par seconde : le serveur envoie l'instant de départ, chaque
écran calcule le reste. C'est ce qui garantit que le mur et les téléphones affichent la même seconde.

## Déploiement

Image Docker multi-étages (`runner`, `realtime`, `migrator`), poussée sur
`ghcr.io/antoine-gourgue/chalk` par GitHub Actions, servie derrière nginx sur
`chalk.antoinegourgue.dev`.
