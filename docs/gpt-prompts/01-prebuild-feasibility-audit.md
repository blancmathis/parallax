# Prompt — Audit de faisabilité pré-implémentation de Parallax

Copie-colle le prompt ci-dessous dans une nouvelle conversation avec GPT-5.6 Pro.

---

Tu es l'architecte produit et systèmes chargé de faire une revue contradictoire approfondie de Parallax avant que nous écrivions réellement le produit.

## Ta mission

Analyse intégralement le dépôt public suivant, sur sa branche `main` :

- dépôt canonique : [blancmathis/parallax](https://github.com/blancmathis/parallax)
- commit vérifié au moment de ce prompt : `df6f316e989d5d420003c47b39035a084c6a1c0a`

Commence par indiquer le commit et la date que tu as effectivement analysés. Si tu n'as pas accès au contenu complet du dépôt, dis-le immédiatement et demande-moi soit une archive du dépôt, soit les fichiers précis qu'il te manque. Ne simule pas une analyse de fichiers auxquels tu n'as pas eu accès.

Je veux d'abord une analyse, pas une réécriture de la documentation et pas du code. Le but de cette étape est de découvrir tout ce qui, dans la conception documentée de Parallax, est techniquement irréalisable, contradictoire, trop vague, risqué, prématuré ou insuffisamment prouvé. Nous utiliserons ensuite cette analyse pour prendre ensemble les décisions d'architecture et seulement après pour produire une documentation canonique propre.

Le résultat recherché n'est pas une promesse artificielle de faisabilité à 100 % avant implémentation. Je veux arriver à un état où :

1. aucune contradiction ou impossibilité connue ne subsiste dans la conception ;
2. chaque comportement important possède un contrat vérifiable ;
3. chaque incertitude restante est explicitement classée comme décision ouverte, dépendance externe ou hypothèse à valider ;
4. toute hypothèse critique possède un petit test de faisabilité, une preuve attendue et un critère d'arrêt avant le développement principal ;
5. les documents distinguent clairement ce qui existe aujourd'hui, la cible choisie et les idées encore exploratoires.

## Contexte du projet

Parallax est un projet public et open source porté par Peerlab. Son ambition est de transformer un débat polarisé en une carte structurée et auditable plutôt qu'en un fil de commentaires ou un match avec un gagnant.

Les objets envisagés comprennent notamment :

- des positions distinctes dans un débat ;
- des arguments rattachés à ces positions ;
- des claims atomiques et falsifiables ;
- des sources et extraits liés à un claim précis ;
- des qualifications de preuve limitées au lien source-claim, et non une note globale de fiabilité d'une source ;
- les valeurs, compromis et désaccords normatifs ;
- la provenance, les révisions et l'audit des décisions ;
- un signal volontaire avant/après permettant d'observer si un lecteur a changé de position ;
- la recherche de terrains d'entente entre personnes ou camps en désaccord ;
- à long terme, la réutilisation des claims entre plusieurs débats et potentiellement un graphe global de claims.

Le système envisagé utilise l'IA pour proposer une première structuration, identifier des éléments à vérifier et éventuellement assister la recherche de sources. L'IA ne doit pas publier seule un jugement définitif. L'autorité finale sur les états éditoriaux, les qualifications et les révisions doit rester humaine, traçable et contestable.

Principes actuellement revendiqués, que tu dois aussi mettre à l'épreuve :

- pas de mécanisme conçu pour déclarer un camp vainqueur ;
- pas de score global et permanent de fiabilité d'une source ;
- les qualifications de preuve sont contextualisées par claim ;
- les propositions de l'IA sont soumises à revue humaine ;
- les changements importants doivent être auditables et révisables ;
- l'interface et le contenu doivent pouvoir exister en anglais et en français ;
- le projet doit pouvoir être compris, inspecté et contribué publiquement.

Les documents emploient parfois des termes ambitieux comme « vérité », « objectivité », « vérifié », « consensus » ou « les humains revoient tout ». Ne les accepte pas comme des garanties : transforme-les en définitions opérationnelles, limites et critères testables, ou explique pourquoi ils doivent être remplacés.

## Hiérarchie de vérité pour cette revue

Respecte cet ordre :

1. les instructions de ce prompt ;
2. les décisions explicites que je prendrai ensuite dans notre conversation ;
3. les documents du dépôt comme expression de l'intention actuelle ;
4. le code, les migrations, les tests et la configuration comme preuves de l'état du prototype ou de contraintes déjà rencontrées.

Le code existant n'est pas la cible à préserver. Tu peux et dois l'inspecter quand il apporte une preuve, révèle un écart avec les documents ou permet de juger une hypothèse. Mais tu ne dois ni modifier du code, ni produire un plan de refactorisation détaillé, ni laisser les choix actuels du prototype enfermer l'architecture future.

Pour chaque affirmation significative, distingue explicitement :

- **observé aujourd'hui** : prouvé par le dépôt ;
- **cible affirmée** : décrite comme future ou souhaitée ;
- **hypothèse** : plausible mais non validée ;
- **question ouverte** : nécessite une décision ;
- **contradiction** : deux contrats incompatibles coexistent ;
- **non réalisable tel qu'écrit** : la promesse doit être modifiée ou fortement contrainte.

Ne confonds jamais absence de preuve et preuve d'absence.

## Périmètre à lire

Lis l'ensemble du dépôt, puis accorde une attention particulière à :

- `README.md` ;
- `CONTRIBUTING.md` ;
- `SECURITY.md` ;
- tous les fichiers sous `docs/`, dont la vision, le modèle de données, l'architecture, la roadmap, la recherche, les sources, le déploiement et le débat exemple ;
- les fichiers de configuration et manifests utiles ;
- les types partagés et les principaux parcours d'interface ;
- les fonctions backend et Edge Functions ;
- les migrations, politiques de sécurité et tests SQL ;
- les tests et fixtures qui révèlent des contrats réels.

Les documents sont l'objet principal de la revue. N'utilise le reste que comme preuve ou contre-preuve de leur réalisme.

## Signaux déjà repérés à vérifier indépendamment

Ce ne sont pas des conclusions à recopier. Vérifie-les dans le dépôt, corrige-les si nécessaire et cherche surtout les problèmes plus profonds qu'ils révèlent :

- la roadmap semble en retard sur certaines fonctions déjà présentes dans le prototype ;
- la documentation et l'interface peuvent faire croire à une véritable analyse par modèle, alors que le mode actuel pourrait seulement vérifier la disponibilité d'un fournisseur avant de terminer un traitement simulé ;
- les ports Supabase locaux ne semblent pas cohérents entre tous les fichiers de configuration ;
- plusieurs identités publiques semblent coexister : Peerlab, projet indépendant, projet non lucratif ou future association ;
- les affirmations sur la confidentialité du signal de position semblent en tension avec son envoi au backend et avec la capacité réelle d'appliquer « une réponse révisable par lecteur » sans identité persistante ;
- des documents de recherche paraissent représenter une phase ancienne et mentionnent possiblement un livrable inexistant ;
- l'état actuel du prototype, la cible produit et la vision d'un graphe global sont parfois mélangés ;
- le dépôt ne semble pas encore posséder d'index canonique clair de la documentation, de registre de décisions ou de séparation nette entre spécifications et travaux exploratoires ;
- certaines références de propriétaire du dépôt pourraient encore pointer vers un ancien namespace GitHub.

## Axes d'audit obligatoires

### 1. Promesse produit et comportements utilisateurs

Vérifie si chaque parcours important est cohérent de bout en bout : création d'un débat, génération ou saisie initiale, revue, publication, lecture, contribution, contestation, correction, rétractation, signal avant/après, traduction et réutilisation d'un claim.

Identifie les rôles réels nécessaires, leurs pouvoirs, les conflits d'intérêts, les incitations perverses, les situations d'abus, les boucles de modération et les recours. Cherche en particulier ce qui arrive lorsqu'aucun humain compétent ne veut revoir une proposition ou lorsqu'une communauté est hostile à une conclusion.

### 2. Ontologie et modèle de données

Teste la solidité des notions de débat, position, argument, claim, preuve, source, extrait, valeur, accord, contradiction, consensus et révision.

Examine notamment :

- l'identité d'un claim réutilisé dans plusieurs débats ;
- son périmètre, sa temporalité, sa langue et ses présupposés ;
- la distinction entre claim équivalent, proche, plus large, plus étroit ou contradictoire ;
- les limites d'une déduplication par embeddings ;
- les relations entre preuve, absence de preuve, réfutation et incertitude ;
- les révisions, versions, fusions, séparations, retraits et suppressions ;
- la provenance immuable et les corrections légitimes ;
- la capacité à reconstruire qui a proposé, validé, refusé ou modifié quoi ;
- les conséquences juridiques ou éthiques d'une conservation permanente.

Dis si un modèle relationnel suffit, si une représentation graphe ou hybride devient nécessaire, et surtout à quel moment. Ne recommande pas une technologie seulement parce qu'elle paraît élégante.

### 3. Pipeline IA

Audite la chaîne complète envisagée : entrée utilisateur, recherche éventuelle, sélection de sources, extraction, structuration, validation, revue humaine, publication et révision.

Traite au minimum :

- hallucinations et faux rapprochements ;
- prompt injection contenue dans des pages ou sources ;
- sorties structurées invalides ou partiellement valides ;
- attribution incorrecte d'un extrait ;
- citations qui ne soutiennent pas réellement le claim ;
- dates, versions, traductions et changements de sources ;
- coûts, latence, limites de contexte et quotas ;
- dépendance à un fournisseur ou à un modèle ;
- reproductibilité et traçabilité sans exposer de raisonnements privés ;
- volume de revue humaine réellement supportable ;
- critères précis empêchant une proposition de devenir silencieusement un fait publié.

### 4. Consensus, réputation et gouvernance

Mets à l'épreuve toute mécanique de consensus entre camps : constitution des camps, éligibilité, seuils, quorum, révision, refus de participer, minorités, nouveaux utilisateurs, identités multiples, brigading, attaques Sybil, coordination malveillante et capture par les stewards.

Sépare bien consensus social, accord sur une formulation, accord sur une valeur et force probante d'une source. Dis si les documents les confondent.

### 5. Sources, droits et recherche

Analyse la faisabilité du moteur de sources et de la conservation des extraits : licences, copyright, droit de citation, conditions d'utilisation, paywalls, robots, API, retraits, corrections, versions, liens morts et redistribution d'un corpus ouvert.

Teste le principe « pas de score global de source » dans les cas où une même source diffuse systématiquement des informations trompeuses. Propose le contrat minimal qui permet de contextualiser sans créer implicitement le score interdit.

### 6. Confidentialité, sécurité et conformité

Examine l'authentification, l'autorisation, la sécurité par ligne, les entrées non fiables, les secrets, les journaux, l'anonymat, les agrégats et la tension entre vie privée et anti-abus.

Inclue les risques liés aux opinions politiques ou philosophiques, aux données sensibles, aux mineurs, à la conservation, à l'accès, à la rectification, à la suppression, à la portabilité, à la modération de contenu et au caractère public du corpus. Distingue ce qui relève d'une obligation juridique certaine, d'un risque plausible et d'une décision de politique produit.

### 7. Architecture et exploitation

Évalue si l'architecture décrite peut soutenir les contrats produit : états et transitions, cohérence transactionnelle, idempotence, files de tâches, reprises après erreur, versionnement, indexation, recherche, embeddings, cache, invalidation, migrations, sauvegardes, restauration, observabilité, quotas, abus, disponibilité, déploiement et coûts.

Pour chaque système distribué ou asynchrone envisagé, décris les états d'échec et la manière dont un utilisateur ou un steward sait ce qui s'est réellement passé.

Ne conçois pas immédiatement pour une échelle mondiale hypothétique. Identifie ce qui doit être vrai pour le premier produit crédible, puis les seuils objectifs qui justifieraient une architecture plus complexe.

### 8. Faisabilité et séquençage

Détermine le plus petit parcours vertical qui prouve la valeur centrale sans prétendre résoudre immédiatement la gouvernance mondiale de la vérité.

Classe chaque capacité majeure en :

- nécessaire avant le premier produit crédible ;
- acceptable sous forme manuelle ou assistée au départ ;
- à valider par un spike ou une recherche ciblée ;
- explicitement reportable ;
- à abandonner ou reformuler si son coût ou son risque dépasse sa valeur.

Pour les risques critiques, définis une preuve préalable minimale : question testée, protocole, résultat attendu, critère de succès, critère d'arrêt et décision débloquée. À ce stade, décris ces preuves sans écrire de code.

### 9. Architecture documentaire

Évalue si quelqu'un pourrait construire le bon produit uniquement à partir des documents futurs, sans deviner les décisions fondamentales.

Propose une architecture documentaire canonique qui sépare au minimum :

- vision et principes stables ;
- état actuel vérifié ;
- cible produit et architecture cible ;
- exigences et critères d'acceptation ;
- modèle de domaine et invariants ;
- décisions d'architecture et leur statut ;
- menaces, abus, confidentialité et conformité ;
- recherches, expériences et preuves ;
- opérations, déploiement et reprise ;
- roadmap conditionnée par des preuves ;
- historique et documents dépréciés.

Identifie pour chaque futur document son rôle, son propriétaire canonique et les informations qu'il ne doit pas dupliquer.

## Recherche externe

Lorsque la faisabilité dépend d'un service, d'une API, d'une réglementation ou d'une pratique actuelle, vérifie l'information avec des sources primaires et à jour : documentation officielle des fournisseurs, textes réglementaires, standards ou publications de recherche originales. Cite les liens directement à côté des affirmations concernées.

N'utilise pas une recherche web pour remplacer la lecture du dépôt. Signale les interprétations juridiques ou commerciales incertaines et ne les présente pas comme des avis professionnels définitifs.

## Contraintes de travail

- Ne modifie rien dans le dépôt.
- Ne crée pas de code, de commit, d'issue ou de pull request.
- Ne commence pas encore la réécriture des documents.
- Ne te contente pas d'un résumé du projet ou d'une liste générique de bonnes pratiques.
- Appuie chaque constat interne important sur un chemin de fichier et, si possible, des lignes précises.
- Explique le mécanisme concret de défaillance : pas seulement « manque de clarté », mais ce que deux personnes, deux services ou deux états feraient de manière incompatible.
- Ne suppose pas qu'une fonctionnalité est faisable parce qu'elle est courante dans une démo.
- Ne recommande pas une microarchitecture, un graphe, une blockchain, des agents multiples ou un système de réputation sophistiqué sans besoin prouvé.
- Ne traite pas une promesse de revue humaine comme une solution complète : chiffre ou borne la charge et traite les cas d'absence, de conflit et de mauvaise foi.
- Si une information manque, avance avec une hypothèse provisoire clairement marquée au lieu de bloquer l'audit. Pose les questions après avoir livré ta première analyse.

## Format de réponse attendu

Réponds en français. Sois dense, précis et contradictoire, sans remplissage. Structure ta réponse ainsi :

### A. Périmètre et fiabilité de l'analyse

- commit, date et fichiers réellement consultés ;
- éléments inaccessibles ;
- niveau de confiance général.

### B. Verdict exécutif

- niveau de préparation documentaire actuel : **bloqué**, **très incomplet**, **partiellement spécifié** ou **prêt pour spécification finale** ;
- les cinq raisons principales ;
- ce qui est déjà conceptuellement solide et mérite d'être conservé.

### C. Registre des constats

Présente un tableau trié par criticité avec les colonnes :

`ID | Gravité | Domaine | Statut de l'affirmation | Preuve dans le dépôt | Problème précis | Scénario de défaillance | Décision ou correction nécessaire | Preuve supplémentaire requise`

Utilise les gravités suivantes :

- **B0 — bloque la conception** : contradiction ou impossibilité empêchant de définir le produit ;
- **B1 — bloque l'implémentation** : contrat indispensable absent ou non testable ;
- **B2 — risque majeur** : peut imposer une refonte, créer un risque légal/sécurité important ou rendre l'exploitation intenable ;
- **B3 — dette documentaire** : ambiguïté ou incohérence locale à corriger ;
- **B4 — amélioration** : utile mais non structurante.

Ne fusionne pas artificiellement des problèmes différents pour raccourcir le tableau.

### D. Conclusions de faisabilité par catégorie

Fais quatre listes séparées :

1. non réalisable ou contradictoire tel qu'écrit ;
2. réalisable mais insuffisamment spécifié ;
3. plausible uniquement après une preuve ciblée ;
4. probablement prématuré ou surdimensionné pour le premier produit.

Pour chaque élément, indique la reformulation ou la décision qui le rendrait actionnable.

### E. Modèle conceptuel proposé pour discussion

Sans rédiger encore la spécification finale, propose :

- les entités minimales ;
- les relations et invariants essentiels ;
- les états et transitions critiques ;
- les frontières entre proposition IA, décision humaine et fait publié ;
- les parties qui doivent rester distinctes pour éviter les confusions sémantiques.

Signale clairement ce qui est une recommandation de ta part et non une décision déjà prise.

### F. Décisions d'architecture à prendre avec moi

Ordonne les décisions par dépendance. Pour chacune, donne :

- la question exacte ;
- deux à quatre options réellement distinctes ;
- les avantages, coûts, risques et conséquences documentaires ;
- ta recommandation provisoire ;
- ce qui pourrait te faire changer d'avis.

### G. Plan de preuves avant développement principal

Propose les spikes, recherches ou tests de contrat strictement nécessaires. Pour chacun :

`Risque traité | Question | Méthode minimale | Preuve attendue | Critère de succès | Critère d'arrêt | Décision débloquée`

N'écris pas le code de ces spikes.

### H. Architecture documentaire cible

Propose l'arborescence canonique future avec, pour chaque document :

- son objectif ;
- son statut attendu ;
- sa source de vérité ;
- ses dépendances ;
- ce qu'il remplace ou rend obsolète dans le dépôt actuel.

Ajoute les documents manquants indispensables, mais évite une multiplication bureaucratique de fichiers.

### I. Plan de discussion

Termine par les 15 questions les plus importantes à me poser pour la prochaine étape, dans l'ordre où mes réponses débloquent les autres décisions. Regroupe seulement les questions indépendantes. N'entame pas encore une interview exhaustive au-delà de ces 15 questions.

### J. Limites de ton analyse

Liste les points qui ne peuvent honnêtement pas être validés sur dossier, les preuves réelles qui manqueront encore et les risques résiduels qui devront rester explicitement documentés.

L'objectif de ta réponse est de nous donner une base de travail sans complaisance pour rendre Parallax cohérent, techniquement défendable et vérifiable avant le développement principal — pas de confirmer la vision telle quelle.
