# Reprise complète de Dokploy pour Aetheris

## Résultat demandé

Faire de **Dokploy la base complète de l’espace connecté Aetheris** : reprendre fidèlement son design, sa navigation, ses cartes, ses tableaux, ses formulaires, ses paramètres et ses thèmes, puis connecter ses fonctionnalités open source. Il ne s’agit ni d’une simple inspiration ni d’un changement de couleurs limité à quelques pages.

L’accueil public reste hors de cette refonte de la « deuxième page ». L’identité Aetheris et les fonctions IA existantes restent présentes dans le nouvel espace.

## Base officielle et limite de réutilisation

- Utiliser le dépôt officiel [Dokploy/dokploy](https://github.com/Dokploy/dokploy), avec une révision identifiée pour garder une référence stable.
- Reprendre le code réutilisable et les éléments visuels open source, avec les mentions et notices requises par Apache-2.0.
- Le [fichier de licence officiel](https://github.com/Dokploy/dokploy/blob/canary/LICENSE.MD) exclut les dossiers `proprietary` de cette licence. Les fonctions exclusives de Dokploy Cloud ne sont donc pas automatiquement réutilisables : les inventorier séparément et signaler celles qui demandent une licence ou une autorisation. Ne pas les copier en les présentant comme open source.

## 1. Inventaire intégral, écran par écran

Créer une liste de correspondance entre chaque écran Dokploy, ses onglets, ses actions et sa future place dans Aetheris. Inclure les sous-écrans et fenêtres de configuration, pas seulement les pages principales.

Familles déjà repérées dans le dépôt officiel :
- Vue d’ensemble, projets, environnements et services.
- Applications, Docker Compose et bases PostgreSQL, MySQL, MariaDB, MongoDB, Redis et LibSQL.
- Déploiements, Docker, Swarm, réseaux, Traefik, suivi et tâches planifiées.
- Paramètres : profil, sessions, utilisateurs, serveurs, fournisseurs Git, registres, clés SSH, secrets, destinations, certificats, DNS, notifications, étiquettes et configuration des déploiements.
- Écrans dont la disponibilité libre ou Cloud doit être vérifiée individuellement : suivi avancé, audit, SSO, marque blanche, licences et facturation.

Cet inventaire sera le suivi de couverture de la reprise complète. Aucun écran ne sera silencieusement abandonné ou remplacé par une carte décorative.

## 2. Reprise fidèle du design complet

- Reproduire la structure Dokploy : menu latéral, en-têtes, navigation entre projets et services, onglets, menus, recherche, tableaux, cartes, fenêtres et formulaires.
- Reprendre ses couleurs officielles, bordures, dimensions, typographie, icônes et états des contrôles ; remplacer le traitement cyan/violet et les effets vitrés actuels dans l’espace connecté.
- Reprendre les thèmes clair, sombre et système ainsi que les autres choix réellement proposés dans la version retenue ; conserver le choix de l’utilisateur.
- Conserver l’identité Aetheris et proposer les libellés en français sans changer arbitrairement l’organisation Dokploy.
- Étendre ce même design à Marketplace IA, Mes modèles, Stockage, Clés API, Workspace et Colab, plutôt que conserver deux styles différents.

## 3. Reprise des fonctionnalités réelles

- Exécuter Dokploy sur un serveur adapté et connecter Aetheris à ses interfaces officielles pour les projets, services, déploiements, domaines, bases, sauvegardes, journaux et opérations serveur disponibles dans la version retenue.
- Vérifier chaque action disponible et ses autorisations avant de l’exposer aux utilisateurs Aetheris. Ne jamais donner à chaque utilisateur les droits administrateur du serveur.
- Conserver les connexions Hugging Face, les clés Aetheris, le stockage et Colab, et vérifier leur fonctionnement après adaptation.
- Pour le terminal, distinguer les commandes Aetheris des commandes exécutées dans un vrai conteneur ; vérifier le mécanisme d’accès Dokploy avant de promettre un shell distant.
- Remplacer les statuts et mesures de moteur simulés par des résultats réels. Tant qu’aucun serveur n’est connecté, afficher un état non connecté, jamais un serveur prétendument en marche.
- Ne pas présenter la facturation ou une fonction réservée à Dokploy Cloud comme activée simplement parce que son écran a été repris.

## 4. Ordre de réalisation

La cible reste la reprise complète ; les lots permettent de la vérifier sans casser les fonctions actuelles :
1. Référence officielle, inventaire de couverture et vérification des licences.
2. Ensemble visuel commun et adaptation de toutes les pages Aetheris existantes.
3. Pages Dokploy : projets, environnements, services et tous leurs paramètres libres.
4. Connexion à l’instance Dokploy, déploiements réels et terminal distant si pris en charge.
5. Autres fonctionnalités libres de l’inventaire, puis contrôle final de couverture.

## Vérification et conditions de fin

- Comparer les écrans Aetheris à ceux de la révision Dokploy retenue, en clair et sombre, sur petits et grands écrans.
- Tester avec un utilisateur connecté : créer un projet et un service, lancer un déploiement réel, consulter son état et ses journaux, puis effectuer une opération et vérifier le résultat relu à l’écran.
- Tester les paramètres enregistrés et la séparation des utilisateurs ; vérifier qu’aucun secret serveur n’est envoyé au navigateur.
- Vérifier les parcours IA existants et les liens de navigation.
- Livrer l’inventaire final : repris et vérifié, bloqué par une connexion externe, ou soumis à une licence. Un écran seul ne compte pas comme une fonctionnalité terminée.

## Détails techniques

- Aetheris utilise TanStack Start ; Dokploy est une application différente. Adapter ses composants libres et ses parcours à la structure existante plutôt que remplacer Aetheris par une application Next.js incompatible.
- Dokploy et Docker tourneront sur un serveur externe, pas dans l’environnement d’hébergement du site. Aetheris restera l’interface utilisateur, avec une connexion serveur sécurisée vers Dokploy.
- Préserver l’authentification existante, ajouter les correspondances d’utilisateurs et de ressources nécessaires, et contrôler les autorisations à chaque opération.
- Ajouter les pages réellement référencées, leurs métadonnées et les tests des règles d’accès ; conserver une liste de tâches pour suivre les lots.

## Dépendances à fournir au moment de la connexion

La reprise du design peut commencer sans serveur. Pour vérifier les opérations réelles, il faudra une instance Dokploy accessible et une clé fournie dans un formulaire sécurisé, jamais dans le chat. La présence actuelle d’une instance n’est pas confirmée. Les fonctions propriétaires nécessitent une autorisation distincte ; elles ne font pas partie de la promesse de reprise libre.
