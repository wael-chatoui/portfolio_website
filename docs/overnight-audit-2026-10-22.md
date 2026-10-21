# Audit et corrections du 22 octobre 2026

## Constat principal

Le formulaire attendait `resend.emails.send()` puis répondait succès sans contrôler `result.error`. Un refus du fournisseur pouvait être affiché comme une demande envoyée. Le nouveau contrat n’accepte un succès qu’en présence d’un identifiant email. La documentation de référence est [le guide Next.js officiel de Resend](https://resend.com/docs/send-with-nextjs).

Le formulaire contrôle les types et limites, distingue JSON invalide et service indisponible, dispose d’un champ antirobot, d’un délai côté navigateur et d’un lien email direct. Les erreurs ne contiennent ni clé, ni email, ni contenu du prospect dans les logs.

## Autres problèmes corrigés

- Liens publics pointant vers les dépôts privés Leads et Attio Bridge : remplacés par des études de cas internes et un contact, sans exposer de code.
- Liens imbriqués dans les cartes projet : HTML simplifié, zéro ancre imbriquée confirmé dans le DOM.
- Dialogues sans gestion du focus : les catalogues secondaires utilisent des accordéons natifs. Le menu mobile utilise un dialogue natif, avec Échap et retour du focus.
- Descriptions françaises en anglais : contenu des réalisations et catégories bilingue. Les erreurs du formulaire suivent maintenant la langue courante.
- Cookie de langue arbitraire : seules les valeurs `fr` et `en` sont acceptées, les autres retombent sur le français.
- Métadonnées limitées, domaine historique non configuré : titres localisés, canonical sur le domaine actif, carte sociale, données structurées Person, sitemap et robots. Les previews et l’ancienne candidature restent hors indexation.
- Anciennes dépendances serveur et carrousel inutilisées : retirées. Next.js passe de16.1.7 à16.4.2; configuration ESLint adaptée à cette version. Aucun changement de majeure Tailwind.
- Acquisition : trois prestations reliées à leurs preuves, proposition au forfait sans tarif affiché, portail public `/produits` vers FluentFlow, Fluide et La rédaction. Liens de campagne sans donnée personnelle.

## Vérification locale

- 8 tests passent : vrai succès, rejet et panne fournisseur, validation, mauvais formats, absence de configuration, antirobot et liens de campagne.
- TypeScript, ESLint et build de production passent.
- `/`, `/produits`, `/sitemap.xml`, `/robots.txt` et `/opengraph-image` répondent correctement. Un cookie de langue invalide renvoie200 en français.
- Chrome utilisateur : rendu desktop et390×844, aucun débordement, FR/EN, menu mobile, Échap, retour du focus, navigation produits et échec contrôlé du formulaire. Aucun email réel envoyé.
- Audit des dépendances de production :0 vulnérabilité. Les avis restants concernent les outils de développement Tailwind3 et leurs bibliothèques de globbing. Leur suppression complète nécessite une migration distincte et une nouvelle recette visuelle.

## Limites concrètes

- Aucun lien de réservation n’a été fourni : le parcours débouche sur la demande de projet et l’email direct.
- L’acceptation par Resend ne démontre pas la réception en boîte email; la suite de tests n’envoie aucun message réel.
- Les URLs FR/EN du portfolio restent identiques et dépendent du cookie. Le site ne déclare pas de faux alternates.
- Les UTMs ne sont pas un outil d’analytics. Aucun tracker additionnel n’a été installé.
- Le domaine`.ovh` doit être rétabli avant de redevenir canonique. Le domaine Vercel actif est confirmé dans le navigateur.
- Les fonctions d’inscription, d’abonnement ou de démo des autres produits ne sont annoncées qu’après leur propre recette.
