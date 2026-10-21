# Wael Chatoui, freelance product engineer

Portfolio bilingue FR/EN consacré aux outils métier, CRM, SaaS et automatisations IA. L’offre est présentée au forfait après cadrage, sans TJM public.

Site actif : [wael-chatoui.vercel.app](https://wael-chatoui.vercel.app). La branche de production du dépôt est `master` et Vercel la déploie automatiquement.

## Parcours publics

- `/` : prestations, réalisations, produits et demande de projet.
- `/produits` : FluentFlow, Fluide et La rédaction, avec liens de campagne sans données personnelles.
- `/api/contact` : traitement des demandes via Resend.
- `/robots.txt`, `/sitemap.xml`, `/opengraph-image` : découverte et partage.
- `/rippletide` : ancienne page de candidature, exclue de l’indexation.

Les descriptions des réalisations existent en français et en anglais. Les projets au code privé sont décrits sans exposer leur dépôt. Le choix de langue est conservé dans un cookie limité à `fr` et `en`.

## Développer et vérifier

Node.js 22 et pnpm sont utilisés. Les deux lockfiles existants sont synchronisés.

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm test
pnpm typecheck
pnpm lint
pnpm build
pnpm start -- --port 3195
```

Le fichier `.env.example` contient uniquement les noms et valeurs publiques. `RESEND_API_KEY` reste côté serveur. `CONTACT_FROM_EMAIL` peut désigner un expéditeur vérifié. La destination est fixée côté serveur au propriétaire du portfolio.

Le formulaire vérifie les types, longueurs et l’adresse email, ignore un champ antirobot et ne confirme l’envoi qu’après acceptation explicite par Resend. Un refus ou une indisponibilité renvoie une erreur, avec un lien email direct dans l’interface. L’acceptation par le fournisseur ne prouve pas la livraison en boîte de réception. Les tests simulent le fournisseur et n’envoient aucun email.

## Indexation et domaine

`NEXT_PUBLIC_SITE_URL` définit l’origine canonique. Sa valeur par défaut est le domaine Vercel réellement configuré. Le domaine historique `.ovh` n’est pas déclaré comme canonique tant que son hébergement et son DNS ne sont pas rétablis.

Seul `VERCEL_ENV=production` autorise l’indexation. Les previews restent en `noindex`. Le site est bilingue à URL identique par cookie; il ne prétend pas disposer de routes anglaises séparées. Les données structurées décrivent uniquement le profil visible, sans avis ni chiffres inventés.

Les liens des produits comportent `utm_source=portfolio`, `utm_medium=referral`, `utm_campaign=produits` et un identifiant de produit. Ces paramètres permettent une attribution dans les outils qui les exploitent; aucun système de mesure ou traceur additionnel n’est installé par le portfolio.

## Publication

Avant un push sur `master` : tests, vérification TypeScript, lint, build et contrôle visuel mobile/desktop. La mise en production passe par le dépôt Git connecté à Vercel. L’administration du service s’effectue dans le navigateur utilisateur, conformément à la consigne du 22 octobre 2026.

Contexte graphique : `.ui-craft/brief.md` et `.ui-craft/tokens.md`.
