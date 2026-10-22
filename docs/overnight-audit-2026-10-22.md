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

## Mise à jour du parcours La Rédaction

Après confirmation du déploiement `739d989` et vérification dans Chrome de la démo publique, le bouton du portail pointe directement vers `/demo` avec les UTMs existants. Libellés : « Essayer la démo » et « Try the demo ». Cette démo est fictive, sans compte; le portfolio ne promet pas d'abonnement ni d'inscription ouverts. Les fonctionnalités décrites restent celles déjà vérifiées.

## Mise à jour du parcours Fluide

Une nouvelle vérification dans Chrome a montré que le lien `/` ouvre le carnet personnel pour un visiteur déjà connecté. Le portail envoie désormais vers `/welcome#exemple`, avec les quatre UTMs conservés et le libellé « Essayer la démo » en français, « Try the demo » en anglais. L'ancre ouvre l'exemple interactif public quelle que soit la session. Les inscriptions gratuites restent accessibles depuis cette présentation; aucun paiement n'est lancé.

Le contrôle de non-régression vérifie les destinations des deux démos et leurs paramètres de campagne dans les deux langues. Les UTMs ne sont toujours pas propagés dans les liens d'inscription des applications : ils identifient le lien d'arrivée, sans établir une attribution de compte ou une conversion mesurée. La session Chrome existante n'a pas été déconnectée et aucun compte de test n'a été créé pour cet audit.

## Retour des produits vers le contact

L'activation native au clavier du lien `/produits` vers `/#contact` affiche bien le formulaire. Les clics synthétiques n'avaient pas déclenché la navigation pendant cette recette, ce qui n'établit pas un défaut du site. Le lien Next.js existant est conservé. Sa cible tactile, mesurée à 18,5 px de haut, passe à 44 px minimum pour faciliter l'accès sur téléphone. Le changement ne modifie ni le formulaire ni l'envoi des emails.

Les trois champs du contact utilisent 16 px sur téléphone (14 px conservés à partir du breakpoint `sm`) et le token de texte secondaire sans opacité réduite pour les placeholders. La recette a identifié les anciens 14 px et la couleur semi-transparente peu lisible sur fond sombre. Les labels accessibles, limites, validations et envois restent identiques.

## Reprise du soir : accès au contact et installation neuve

Le contrôle du site publié sur Chrome desktop a mesuré 20 px de haut pour le lien email de secours et 34 px pour les liens GitHub, LinkedIn, email et téléphone. Le token du projet prévoit 44 px minimum. Le correctif ajoute `min-h-11` aux deux composants concernés et centre le libellé du lien de secours. Les destinations, le retour à la ligne, le formulaire et le transport email restent identiques. Le brief cite maintenant la marque PhraseLane.

Une installation pnpm neuve a aussi révélé que `npm run lint` ne trouvait pas `eslint`. Il existait dans les deux lockfiles uniquement comme dépendance transitive. Le commit séparé `e6a1796` déclare directement la même version 9.39.5. Aucun paquet résolu ni empreinte d'intégrité ne change ; seuls les liens de dépendance directe et les métadonnées npm sont mis à jour. Aucun script d'installation tiers n'a été approuvé ou exécuté pendant cette correction.

Vérifications de cette passe : 9 tests sans envoi d'email, TypeScript, lint et build Next16.4.2 réussis, installation avec lock figé réussie en ignorant les scripts d'installation, diff propre et détecteur de design sans résultat. Revue indépendante favorable des deux classes de taille tactile.

La recette après changement a été effectuée dans la session Chrome commune « Codex Agents ». À 1470 px et dans un cadre local de 375 × 667 px, les cinq liens de contact mesurent chacun 44 px de haut. Le document mobile mesure 375 px sans débordement. Le cadre responsive permet ce contrôle sans modifier le viewport de la session des autres agents. Aucun essai sur téléphone physique n'est revendiqué.

Le défaut clavier du repère latéral a aussi été reproduit : Entrée sur « Contact », puis Tab, focalisait le lien du Hero et quittait le formulaire. Les boutons de défilement sont remplacés par des liens natifs vers les six sections. Les libellés, tailles, état courant et styles restent identiques. Le CSS existant conserve le défilement fluide et respecte la préférence de mouvement réduit.

Après recompilation et recharge de la vraie page dans Chrome, Entrée puis Tab focalise `contact-name`, avec le début de la section à 80 px sous l'en-tête après la fin du défilement. TypeScript, lint, build et diff réussis ; détecteur sans résultat. Revue indépendante favorable, puis recette du vrai parcours clavier. Les captures et mesures sont conservées hors dépôt dans `Codex/2026-10-22/portfolio-contact-audit/`. Aucun formulaire réel ni email envoyé.
