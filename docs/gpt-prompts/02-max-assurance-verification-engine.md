# Prompt — Concevoir un moteur de vérification à assurance maximale

Copie-colle le prompt ci-dessous dans une nouvelle conversation avec GPT-5.6 Pro.

---

Tu es chargé de concevoir la meilleure stratégie techniquement et épistémiquement défendable pour un moteur autonome de vérification d'informations. Cette mission précède toute implémentation : je veux d'abord comprendre ce qu'il est réellement possible de garantir, choisir le bon périmètre et produire une architecture conceptuelle que nous pourrons ensuite transformer en documentation canonique.

Je veux que tu consacres cette première réponse à une analyse de fond complète. Ne commence pas par m'interviewer. Inspecte les éléments accessibles, mène les recherches nécessaires, avance avec des hypothèses provisoires clairement signalées, puis termine par les décisions que nous devons prendre ensemble.

## Origine et contexte

L'idée vient de Parallax, un projet open source qui structure les grands débats en positions, arguments, claims, sources, valeurs et compromis :

- dépôt canonique : [blancmathis/parallax](https://github.com/blancmathis/parallax) ;
- commit de référence au moment de ce prompt : `df6f316e989d5d420003c47b39035a084c6a1c0a`.

Commence par indiquer le commit, la date et les fichiers que tu as réellement consultés. Si tu ne peux pas lire le dépôt complet, dis-le sans simuler l'accès et demande-moi ensuite une archive ou les fichiers manquants. Ton analyse générale du moteur doit néanmoins avancer autant que possible.

Lis particulièrement :

- `docs/02-product.md`, notamment la décision distinguant véracité et alignement claim-source ;
- `docs/03-data-model.md`, notamment le graphe global de claims ;
- `docs/06-vision.md`, notamment la « Library of Truths » ;
- `docs/07-engine.md`, notamment le cycle de vie des claims et la membrane IA/humains ;
- `docs/08-sources.md`, notamment l'authenticité des artefacts, la fidélité des citations, la validité des inférences, le poids du corpus et la gouvernance des sources ;
- les autres documents utiles du dépôt.

Ne considère aucune architecture décrite dans Parallax comme automatiquement correcte. Utilise-la comme matière de départ à critiquer. Le nouveau moteur pourrait devenir un projet indépendant, avec Parallax comme premier consommateur. Évalue cette séparation au lieu de la présupposer.

Hypothèse de frontière à mettre à l'épreuve :

- le moteur autonome posséderait les claims, leur portée, les sources, les extraits, les relations de preuve, les évaluations, la provenance, les objections et les changements d'état ;
- Parallax posséderait les débats, positions, arguments, steelmans, valeurs, compromis et parcours de délibération ;
- le moteur devrait aussi pouvoir servir d'autres consommateurs : journalistes, chercheurs, agents IA, institutions ou applications tierces.

## Ambition réelle

Mon intuition initiale est : « vérifier les informations à 100 % et vérifier les vérifications elles-mêmes ». Ne valide pas cette formulation par complaisance, mais ne t'arrête pas non plus à « la certitude absolue est impossible ».

Je veux que tu détermines précisément :

1. ce qui peut être garanti à 100 % dans un système fermé ou à partir d'un contrat contrôlé ;
2. ce qui peut atteindre un très haut niveau d'assurance sans être certain ;
3. ce qui reste fondamentalement probabiliste, interprétatif, incomplet ou temporaire ;
4. ce qui ne doit jamais recevoir un label binaire « vrai » ou « vérifié » ;
5. comment garantir que le système s'abstient honnêtement quand il ne peut pas conclure ;
6. comment chaque vérification peut elle-même être auditée, reproduite, contestée, corrigée et révoquée.

Cherche donc l'assurance maximale atteignable, pas un slogan de certitude. L'objectif peut être de garantir à 100 % l'intégrité du **processus de vérification** tout en exprimant honnêtement l'incertitude sur le monde.

Exemples de propriétés potentiellement garantissables, à confirmer, corriger ou compléter :

- aucune conclusion publique sans claim atomique et portée explicite ;
- aucune citation sans localisateur exact, copie ou empreinte de l'artefact consulté et date de récupération ;
- aucune confusion entre authenticité de la source, fidélité de la citation, validité de l'inférence et vérité du claim ;
- aucune conclusion sans recherche enregistrée de contre-preuves adaptée à son niveau de risque ;
- aucune source secondaire comptée comme corroboration indépendante si elle remonte à la même origine ;
- aucune conclusion sans statut temporel, limites, objections ouvertes et règle d'expiration ;
- aucune décision IA transformée silencieusement en vérité publiée ;
- chaque état public est dérivé d'un dossier de preuves versionné et rejouable ;
- chaque changement est attribué, justifié et réversible sans effacer l'historique ;
- le système sait rendre les verdicts « inconnu », « non vérifiable », « preuves insuffisantes », « contesté » et « obsolète ».

## Distinctions épistémiques obligatoires

Ne traite jamais « avoir des sources » comme équivalent à « être vrai ». Sépare au minimum :

1. **identité et portée du claim** — proposition exacte, sujet, population, lieu, période, mesure, seuil, conditions et définition des termes ;
2. **existence de l'artefact** — le document ou enregistrement est-il accessible ?
3. **authenticité et chaîne de conservation** — est-il bien ce qu'il prétend être, intact et attribuable ?
4. **fidélité de la citation** — dit-il réellement ce qu'on lui attribue dans le contexte complet ?
5. **pertinence** — l'artefact porte-t-il sur le claim et sa portée exacte ?
6. **validité de l'inférence** — la méthode permet-elle cette conclusion précise ?
7. **qualité et limites de la preuve** — biais, mesure, échantillon, données, protocole, conflits et réplicabilité ;
8. **indépendance des preuves** — combien de chaînes d'observation réellement indépendantes existent ?
9. **complétude de la recherche** — quelles contre-preuves, rétractations ou sources manquent potentiellement ?
10. **synthèse du corpus** — que montre l'ensemble des éléments disponibles, avec quelle hétérogénéité ?
11. **actualité** — le claim est-il encore vrai à une date donnée ?
12. **statut épistémique** — que pouvons-nous honnêtement affirmer compte tenu de tout ce qui précède ?
13. **statut normatif** — le claim décrit-il un fait, une prévision, une définition, une interprétation ou un choix de valeur ?

Détermine quelles couches sont vérifiables mécaniquement, lesquelles exigent des modèles, lesquelles exigent des spécialistes et lesquelles ne peuvent être résolues que par une formulation plus étroite.

## Typologie des claims et plafonds de certitude

Une méthode universelle risque d'être fausse. Construis une typologie opérationnelle et attribue à chaque famille son plafond d'assurance, son standard de preuve, ses vérifications minimales et ses raisons d'abstention.

Examine au minimum :

- logique formelle et mathématiques ;
- résultats d'un calcul déterministe reproductible ;
- données issues d'un registre ou d'une API faisant autorité ;
- identité, propriété ou contenu d'un document ;
- événement présent ou historique ;
- mesure quantitative observable ;
- statistique descriptive ;
- relation causale ;
- résultat scientifique ou médical ;
- claim juridique ou réglementaire ;
- état actuel susceptible de changer rapidement ;
- prévision ;
- interprétation historique, politique ou sociale ;
- claim sur les intentions d'une personne ;
- allégation privée ou sensible ;
- définition contestée ;
- claim normatif ou préférence de valeur ;
- affirmation négative ou universelle, où l'absence de preuve pose un problème particulier.

Explique la différence entre monde fermé et monde ouvert. Dis dans quels cas une preuve formelle, un calcul, un enregistrement signé ou une observation contrôlée permettent une conclusion forte, et dans quels cas l'exhaustivité des preuves ne peut jamais être démontrée.

## Questions d'architecture à résoudre

### 1. Contrat de vérification

Propose un contrat public qui remplace le vague bouton « vérifier ». Il doit permettre de comprendre exactement ce qui a été vérifié, par quelle méthode, avec quel standard, à quelle date et dans quelles limites.

Conçois le contenu minimal d'un **certificat de vérification** lisible par une machine et par un humain. Évalue notamment :

- formulation canonique et portée du claim ;
- type de claim et standard de preuve ;
- statut et niveau d'assurance ;
- preuves favorables, contradictoires et manquantes ;
- extraits exacts et contexte ;
- authenticité, provenance et chaîne de conservation ;
- graphe d'indépendance des sources ;
- méthode de recherche et critères d'inclusion/exclusion ;
- rubriques d'évaluation adaptées au domaine ;
- acteurs, experts, modèles, versions, prompts ou outils impliqués ;
- conflits d'intérêts ;
- objections et opinions minoritaires ;
- horodatage, fenêtre de validité, date de prochaine révision ;
- journal des changements et motif de chaque transition ;
- données ou étapes permettant de rejouer la vérification ;
- limites légales empêchant éventuellement la redistribution d'une preuve.

Détermine si le statut doit être une échelle, un vecteur, plusieurs badges indépendants ou une combinaison. Évite un pourcentage pseudo-scientifique qui mélangerait des incertitudes de nature différente.

### 2. Cycle de vie

Définis les états et transitions du claim, du dossier de preuves et du certificat. Traite : nouvelle preuve, correction, rétractation, disparition ou modification d'une page, changement réglementaire, nouvelle mesure, expiration, contestation, duplication, changement de portée, fusion et scission d'un claim.

Explique ce qui se propage automatiquement aux claims dépendants et ce qui doit seulement déclencher une nouvelle revue. Empêche qu'une conclusion soit automatiquement déclarée fausse parce qu'une de ses preuves devient invalide.

### 3. Acquisition et conservation des preuves

Conçois une stratégie réaliste pour :

- recherche primaire et secondaire ;
- API, bases officielles, publications et documents ;
- pages web changeantes, PDF, tableaux, images, audio et vidéo ;
- données structurées et datasets ;
- archivage, empreintes, signatures, horodatage et versions ;
- liens morts, paywalls, retraits et rétractations ;
- licences, droit de citation, redistribution, robots et conditions d'utilisation ;
- preuves qui ne peuvent légalement être conservées que sous forme de métadonnées et de localisateur.

Évalue les standards existants pertinents plutôt que de réinventer inutilement : provenance, annotations, fact-checking, identité des chercheurs et publications, intégrité de contenus, rétractations et chaînes de confiance. Ne recommande un standard qu'après avoir vérifié sa portée réelle : une signature peut prouver l'origine d'un fichier sans prouver la vérité de son contenu.

### 4. Recherche de contre-preuves et synthèse

Définis une procédure qui évite le cherry-picking : requêtes enregistrées, sources consultées, critères d'arrêt, langues, synonymes, période, bases couvertes, littérature grise, résultats négatifs et mises à jour.

Traite la dépendance cachée entre sources : articles qui recopient une dépêche, médias citant la même étude, bases dérivées d'un registre unique, modèles ayant appris les mêmes textes. Conçois un graphe d'origine permettant de compter des chaînes de preuve indépendantes plutôt que des URLs.

Pour les domaines scientifiques, compare les approches de revue systématique, évaluation du risque de biais, qualité globale du corpus et méta-analyse. Explique pourquoi le même pipeline ne convient pas nécessairement au journalisme, au droit, à l'histoire ou aux données administratives.

### 5. Rôle de l'IA

Définis précisément ce que l'IA peut proposer, calculer, prioriser ou surveiller, et ce qu'elle ne peut jamais certifier seule.

Traite au minimum :

- extraction et atomisation des claims ;
- recherche et diversification des requêtes ;
- classement des sources ;
- extraction d'extraits avec localisateurs exacts ;
- entailment, contradiction et portée ;
- identification des méthodes et limites ;
- synthèse structurée ;
- recherche contradictoire par un second parcours ;
- détection de sources circulaires ;
- mise à jour et surveillance des rétractations ;
- traduction sans modification sémantique ;
- sorties structurées validées par schéma ;
- calibration, abstention et seuils par niveau de risque ;
- reproductibilité malgré les changements de modèle ;
- prompt injection, documents adversariaux, empoisonnement SEO, faux PDF, deepfakes, jeux de données fabriqués et paper mills ;
- erreurs corrélées entre modèles entraînés sur des corpus proches ;
- risque qu'un modèle « vérifie » simplement la réponse d'un autre modèle.

Compare une seule passe, plusieurs rôles IA, plusieurs fournisseurs, vérifications déterministes et revue humaine. La multiplicité des agents ou modèles ne compte pas comme indépendance sans preuve mesurée.

### 6. Humains, experts et gouvernance

Conçois les interventions humaines réellement nécessaires : qualification du claim, revue de l'extrait, expertise méthodologique, arbitrage, contestation, recours et audit.

Sépare strictement :

- la vérité ou force probante d'un claim ;
- la légitimité de la procédure ;
- l'accord social ou cross-camp ;
- la popularité ;
- la décision éditoriale de publier.

Un consensus entre personnes ou camps ne doit jamais devenir une preuve de vérité. Dis néanmoins où un consensus contradictoire peut être utile : représentativité, formulation équitable, détection d'objections, acceptabilité ou gouvernance.

Traite la compétence vérifiable, les conflits d'intérêts, le désaccord entre experts, la collusion, les attaques Sybil, le brigading, la capture institutionnelle, les appels, les audits aléatoires et les incitations à chercher une réfutation plutôt qu'à confirmer.

### 7. Méta-vérification

La vérification elle-même doit être un objet vérifiable. Conçois les contrôles qui permettent de répondre à :

- le système a-t-il exécuté toutes les étapes exigées ?
- a-t-il utilisé les bons artefacts et leurs bonnes versions ?
- les extraits et calculs sont-ils reproductibles ?
- les critères ont-ils été appliqués symétriquement ?
- le modèle ou le reviewer est-il calibré sur ce type de claim ?
- une équipe indépendante obtient-elle la même conclusion ?
- les erreurs détectées entraînent-elles une correction et une propagation correctes ?
- les journaux sont-ils intègres sans devenir une preuve trompeuse de vérité ?

Compare : double revue indépendante, adjudication, échantillonnage de contrôle, red team, challenges publics, primes à la réfutation, tests de cohérence, replay déterministe, signatures ou attestations, journaux append-only et transparence des métriques.

### 8. Sécurité, confidentialité et risques de dommage

Produis un threat model couvrant les attaquants techniques, économiques, politiques et internes. Inclus la manipulation des preuves, l'usurpation de source, la diffamation, les données personnelles, les opinions sensibles, les allégations privées, le harcèlement, les erreurs médicales ou juridiques, les campagnes coordonnées et les demandes de suppression.

Définis les domaines à exclure du premier produit, les niveaux de risque, les contrôles renforcés et les cas où le moteur doit refuser de publier une conclusion même si un dossier existe.

### 9. Architecture technique

Compare au moins trois architectures réalistes avant d'en recommander une. Couvre :

- stockage relationnel, graphe ou hybride ;
- objets versionnés et content-addressed ;
- provenance et event sourcing ;
- moteur de workflow et tâches asynchrones ;
- recherche lexicale, sémantique et structurée ;
- index d'origine et d'indépendance des sources ;
- sandbox d'ingestion ;
- politiques d'accès et séparation public/privé ;
- files de revue ;
- observabilité, coût, latence, disponibilité et restauration ;
- portabilité entre fournisseurs de modèles ;
- API consommable par Parallax et d'autres produits ;
- export ouvert du dossier de preuves et du certificat.

Précise les frontières de confiance, les états d'échec, les invariants transactionnels, l'idempotence et ce qui doit être recalculé lors d'une mise à jour.

Ne choisis pas une architecture mondiale surdimensionnée pour le premier vertical slice. Indique les seuils mesurables qui justifieraient plus tard un graphe spécialisé, du calcul distribué ou une infrastructure plus complexe.

### 10. Mesure de la qualité réelle

Définis les métriques et évaluations permettant de savoir si le moteur est meilleur qu'une recherche humaine sérieuse, un fact-check classique ou un LLM avec navigation.

Inclue au minimum :

- précision des conclusions publiées, avec priorité absolue aux faux « vérifiés » ;
- rappel et couverture, sans récompenser les conclusions forcées ;
- calibration et taux d'abstention ;
- fidélité des citations et détection des citations hors contexte ;
- récupération des contre-preuves ;
- détection des dépendances entre sources ;
- reproductibilité inter-équipe et inter-modèle ;
- accord entre spécialistes et résolution des désaccords ;
- délai de détection des corrections ou rétractations ;
- fraîcheur des certificats ;
- taux de décisions renversées après audit ;
- coût et temps par classe de claim ;
- dommage potentiel évité ou causé.

Propose un benchmark représentatif avec jeux de vérité adaptés à chaque classe, cas volontairement ambigus, sources malveillantes, changements temporels et exemples où la bonne réponse est de ne pas conclure. Explique comment éviter la contamination des modèles par le benchmark.

## Recherche externe obligatoire

Fais une recherche actuelle et contradictoire à partir de sources primaires : standards officiels, documentation des projets, textes réglementaires, articles de recherche originaux et méthodes reconnues par domaine.

Analyse de manière comparative ce qui existe déjà dans les familles suivantes, sans te limiter à cette liste :

- schémas de claims, annotations et provenance ;
- standards de transparence et de fact-checking ;
- authenticité et provenance des contenus ;
- revues systématiques et qualité des preuves scientifiques ;
- registres, identifiants, corrections et rétractations ;
- systèmes communautaires de vérification et leurs limites ;
- knowledge graphs et bases de faits sourcées ;
- systèmes de recherche et vérification assistés par IA ;
- méthodes de calibration, selective prediction et abstention ;
- sécurité des pipelines RAG et ingestion de documents non fiables.

Pour chaque mécanisme réutilisable, indique : problème résolu, garantie réelle, ce qu'il ne garantit pas, maturité, licence ou accessibilité, risque d'intégration et source primaire. Cherche aussi des échecs documentés et des résultats négatifs.

Les affirmations susceptibles d'avoir changé doivent être citées par un lien direct. Distingue faits établis, interprétations et recommandations de ta part. Ne transforme pas ton analyse en avis juridique, médical ou scientifique définitif.

## Résultat attendu de cette première réponse

Réponds en français, avec un niveau de détail élevé. Évite les généralités et les slogans. Lorsque tu recommandes quelque chose, explique le mécanisme, le scénario de défaillance évité, le coût et la preuve qui permettrait de valider la recommandation.

Structure ta réponse ainsi :

### A. Périmètre analysé et limites d'accès

- commit et fichiers Parallax consultés ;
- recherches externes menées ;
- informations inaccessibles ;
- hypothèses provisoires.

### B. Verdict épistémique

- pourquoi « vérité garantie à 100 % » est ou n'est pas possible selon les classes de claims ;
- ce qui peut réellement être garanti à 100 % ;
- définition proposée de l'assurance maximale ;
- phrase publique honnête que le produit pourrait employer à la place de « vérifié vrai ».

### C. Typologie et plafonds d'assurance

Tableau :

`Classe de claim | Exemple | Monde fermé/ouvert | Standard de preuve | Automatisable | Intervention humaine | Statut maximal permis | Causes d'abstention | Fréquence de révision`

### D. Décomposition de la vérification

Pour chaque couche allant de l'identité du claim à la synthèse du corpus : entrée, contrôle, sortie, erreur possible, méthode de détection, responsable et preuve conservée.

### E. Contrat et certificat de vérification

- statuts publics recommandés et définitions exactes ;
- schéma conceptuel du certificat ;
- invariants absolus ;
- exemple complet sur un claim simple ;
- exemple complet sur un claim scientifique ou causal ;
- exemple où le bon résultat est « impossible à conclure ».

### F. Architecture recommandée

- comparaison de trois options ;
- recommandation et raisons ;
- diagramme Mermaid des frontières et du flux de confiance ;
- composants, contrats, données et responsabilités ;
- frontière exacte avec Parallax ;
- dépendances externes et stratégies de sortie.

### G. Pipeline de bout en bout

Décris chaque étape de la soumission à la publication puis à la surveillance continue, avec états de succès, échec, abstention, reprise et escalade.

### H. Méta-vérification

- comment une vérification est auditée et reproduite ;
- indépendance minimale requise selon le risque ;
- contrôles automatiques, humains et externes ;
- mécanisme de contestation et de correction ;
- garanties cryptographiques utiles et leurs limites.

### I. Registre des menaces et échecs

Tableau trié par criticité :

`Menace | Acteur | Mécanisme | Impact | Détection | Prévention | Réponse | Risque résiduel | Preuve du contrôle`

### J. Stratégie produit

- produit autonome ou composant de Parallax ;
- utilisateurs initiaux ;
- premier domaine où l'assurance peut être crédible ;
- domaines explicitement exclus ;
- proposition de valeur sans surpromesse ;
- modèle open source, gouvernance et soutenabilité ;
- ce qu'il faut faire manuellement avant de l'automatiser.

### K. Programme de preuves avant implémentation principale

Pour chaque risque critique :

`Question | Expérience minimale | Corpus nécessaire | Métrique | Seuil de succès | Critère d'arrêt | Décision débloquée`

Inclue les tests qui pourraient invalider le projet ou forcer une réduction de périmètre. Ne produis pas de code à cette étape.

### L. Roadmap conditionnée par les preuves

Propose des phases avec objectifs, livrables documentaires, preuves d'acceptation, coûts relatifs, compétences nécessaires, dépendances et conditions de passage. Commence par le plus petit vertical slice qui démontre une vérification réellement supérieure et auditable.

### M. Architecture documentaire à créer ensuite

Propose l'arborescence minimale de la documentation du nouveau projet : stratégie, contrat produit, modèle de domaine, architecture, menaces, exigences d'assurance, méthodes par type de claim, évaluations, gouvernance, opérations et décisions. Pour chaque document, précise son propriétaire de vérité et ce qu'il ne doit pas dupliquer.

### N. Décisions et questions pour notre prochaine discussion

Termine par :

1. les dix décisions les plus structurantes, dans leur ordre de dépendance ;
2. ta recommandation provisoire pour chacune ;
3. les quinze questions les plus importantes à me poser ensuite ;
4. les cinq plus grands motifs légitimes d'abandonner, réduire ou transformer le projet.

## Règles finales

- Ne rédige pas encore la documentation canonique finale.
- Ne produis pas de code ou de plan de classes détaillé.
- Ne modifie aucun dépôt, fichier, issue ou pull request.
- Ne présente jamais le nombre de sources, le consensus ou le nombre de modèles comme une preuve suffisante.
- Ne confonds jamais authenticité d'un document et vérité de son contenu.
- Ne masque pas les coûts humains nécessaires à une assurance élevée.
- Ne remplace pas une incertitude multidimensionnelle par un score arbitraire.
- Ne protège pas l'ambition du projet contre les conclusions négatives : si une partie est irréaliste, dis exactement laquelle et propose la meilleure version réalisable.
- N'attends pas mes réponses pour effectuer cette première analyse complète.

Ton objectif est de concevoir un système qui ne prétend jamais savoir plus qu'il ne sait, qui rend chaque conclusion inspectable jusqu'à sa preuve d'origine, et qui maximise la probabilité d'être correct tout en rendant ses erreurs détectables, réparables et visibles.
