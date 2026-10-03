import type { Messages } from "./en";

export const fr = {
  common: {
    localeName: "Français",
    nav: {
      debates: "Débats",
      method: "Méthode",
    },
    actions: {
      allDebates: "Tous les débats",
    },
    counts: {
      seriousAnswers: (n: number) => `${n} réponse${n > 1 ? "s" : ""} sérieuse${n > 1 ? "s" : ""}.`,
      previewStats: (claims: number, sources: number, links: number) =>
        `${claims} affirmations · ${sources} sources publiques · ${links} liens de preuve.`,
      cardStats: (claims: number, sources: number, links: number) =>
        `${claims} affirmations · ${sources} sources · ${links} liens de preuve`,
      sourceCount: (n: number) => `${n} source${n > 1 ? "s" : ""}`,
    },
    labels: {
      revision: "Révision",
      revisionShort: "rév.",
      publicPolicy: "Politique publique",
      confidence: "confiance",
      retrieved: "récupérée le",
      evidence: "Preuve",
      noSourceYet: "aucune source pour l'instant",
      unreviewedStamp: "Non relu",
      nonProfit: "Projet d'intérêt public",
    },
    claimTypes: {
      factual: "factuelle",
      causal: "causale",
      predictive: "prédictive",
      normative: "normative",
      definitional: "définitionnelle",
    },
    confidenceBuckets: {
      low: "faible",
      med: "modérée",
      high: "élevée",
    },
    evidenceLabels: {
      supports_claim: "corrobore",
      partially_supports_claim: "corrobore partiellement",
      contradicts_claim: "contredit",
      does_not_support_claim: "ne soutient pas",
      unclear: "à clarifier",
    },
    directionLabels: {
      supports: "soutient",
      opposes: "s'oppose",
      qualifies: "nuance",
    },
    reviewStatusLabels: {
      unreviewed: "non relu",
      approved: "approuvé",
      contested: "contesté",
      rejected: "rejeté",
    },
    sourceTypes: {
      article: "article",
      paper: "article scientifique",
      report: "rapport",
      law: "loi",
      dataset: "jeu de données",
      video: "vidéo",
      other: "autre",
    },
    retrievalStatuses: {
      found: "trouvée",
      missing: "manquante",
      blocked: "bloquée",
      failed: "échec de récupération",
      partial: "partielle",
    },
  },
  meta: {
    titleHome: "Parallax — L'atlas du désaccord",
    titleDebates: "Débats — Parallax",
    titleMethod: "Méthode — Parallax",
    description:
      "Parallax cartographie les désaccords sérieux : chaque point de vue dans sa version la plus forte, chaque affirmation reliée à ses sources, chaque valeur nommée. De quoi vous faire un avis fondé — et comprendre pourquoi des gens raisonnables divergent : parfois les mêmes valeurs pesées autrement, parfois des valeurs différentes. Aucun vainqueur désigné.",
    ogTitle: "Parallax — Comprendre chaque point de vue. Y compris le vôtre.",
    ogDescription:
      "Un atlas open source du désaccord, conçu avec une vocation d'intérêt public. Les faits, puis le cas le plus solide, puis les valeurs en dessous. Aucun vainqueur déclaré.",
    descriptionDebates:
      "Parcourez tous les débats sur Parallax — chacun posé à plat : les positions dans leur version la plus forte, les preuves, et les valeurs en dessous.",
    descriptionMethod:
      "Comment Parallax cartographie le désaccord : positions à leur meilleur, affirmations sourcées, valeurs nommées, consensus inter-camps. Aucun vainqueur désigné.",
    descriptionShort:
      "Le désaccord, rendu inspectable. Chaque point de vue à son meilleur, chaque affirmation sourcée, chaque valeur nommée.",
    titleNotFound: "Page introuvable — Parallax",
    descriptionNotFound: "Cette page n'existe pas — mais les débats, si.",
    debateTail: "— un débat sur Parallax, posé à plat : positions, preuves, valeurs.",
  },
  chrome: {
    footerMotto:
      "La plupart des désaccords portent sur des valeurs, pas sur des faits. Quand les valeurs de chacun deviennent lisibles, l'adversaire cesse d'être un ennemi.",
    explore: "Explorer",
    principles: "Principes",
    project: "Projet",
    allDebates: "Tous les débats",
    howItWorks: "Fonctionnement",
    principleItems: [
      "Aucun gagnant déclaré",
      "Chaque camp steelmanné",
      "Chaque libellé auditable",
    ],
    projectItems: [
      "Open source",
      "Vocation d'intérêt public",
      "Brouillons en lecture seule",
    ],
    legal: {
      instrument: "parallax — un instrument de raisonnement public",
      seed: "débats de départ fondés sur des sources publiques · structure non relue",
    },
    languageLabel: "Langue",
    primaryNavLabel: "Principale",
    ctaReadDebate: "Lire un débat",
    commandPaletteLabel: "Rechercher et accéder à une page",
    menuOpen: "Ouvrir le menu",
    menuClose: "Fermer le menu",
  },
  landing: {
    draftNote: "Méthode visée : ces brouillons préparés avec des outils d’IA attendent une relecture humaine et une signature.",
    projectMission: "Un socle de réflexion sourcée et auditable : une boussole pour les humains, un corpus pour aligner les IA.",
    methodSummary: "Présenter chaque position dans sa version la plus forte, relier les affirmations aux extraits de leurs sources, puis nommer les valeurs et les incertitudes qui expliquent le désaccord. La relecture doit rendre chaque étape vérifiable.",
    reviewers: {
      eyebrow: "Appel aux relecteurs",
      headline: "Vous défendez une position ?",
      headlineEm: "Aidez-nous à la rendre juste.",
      body: "Nous cherchons des partisans de chaque position et des relecteurs des sources. Les dossiers attendent encore cette relecture : découvrez le protocole et les modalités de signature.",
      cta: "Participer à la relecture",
    },
    hero: {
      kicker: "L'atlas du désaccord",
      titleLine: "Le dossier de chaque grand débat,",
      titleEm: "relu par ceux qui ne sont pas d’accord.",
      lede:
        "Chaque position à son meilleur, signée par ses partisans. Chaque fait relié à l'extrait exact de sa source. Ce qui reste — valeurs, paris sur l'avenir, confiance — dit sans désigner de vainqueur.",
      primaryCta: "Explorer les débats",
      secondaryCta: "Lire la méthode",
    },
    schematic: {
      topicLabel: "sujet",
      topic: "Les écoles devraient-elles interdire les smartphones en cours ?",
      positionALabel: "position a",
      positionA: "Oui — du matin au soir",
      positionBLabel: "position b",
      positionB: "Non — enseigner l'usage maîtrisé",
      positionCLabel: "position c",
      positionC: "Restreindre en cours, autoriser entre",
      claim: "affirmation",
      evidenceLabel: "comment les sources s'alignent",
      evidence: "corrobore · partiellement · contredit · à clarifier",
      valuesLabel: "valeurs en tension",
      values: "apprentissage concentré · autonomie · classe égale · joignabilité familiale",
      ariaLabel:
        "Schéma d'un débat : un sujet se divise en trois positions ; les affirmations de chaque position portent des pastilles de preuve colorées — vert corrobore, ambre partiellement, rouge contredit, ardoise à clarifier — et les valeurs en tension sont nommées en dessous.",
      legendSupports: "corrobore",
      legendPartial: "partiellement",
      legendContradicts: "contredit",
      legendUnclear: "à clarifier",
      legendGloss: "les faits sont libellés, pas bénis — le verdict reste le vôtre",
    },
    ticker: [
      "aucun gagnant déclaré",
      "chaque camp steelmanné",
      "chaque affirmation sourcée, sinon elle ne tient pas",
      "des affirmations, pas des commentaires",
      "sources libellées, jamais crues aveuglément",
      "valeurs rendues visibles",
      "compromis explicités",
      "chaque changement au registre",
    ],
    problem: {
      eyebrow: "Pourquoi Parallax existe",
      titleLine1: "L'autre camp est rarement aussi bête ou malveillant",
      titleEm1: "qu'on le croit",
      titleLine2: "Étalez le désaccord, et l'ennemi",
      titleEm2: "redevient une personne",
      lede:
        "On ne s'est jamais autant parlé, ni jamais aussi mal compris. Le débat en ligne est conçu pour récompenser la colère. Comprendre demande l'inverse.",
      p1:
        "Les fils de commentaires dispersent les arguments, les répètent et enterrent les meilleurs. Les adversaires sont caricaturés au lieu d'être écoutés. Les sources restent non vérifiées — et le vrai désaccord n'apparaît jamais.",
      p2Prefix: "Parallax part d'une conviction :",
      p2Lead: "l'autre est rarement aussi bête ou malveillant qu'on le croit.",
      p2:
        "Le plus souvent, la colère cache de vraies raisons : des faits que vous n'avez pas vus, une position que vous avez caricaturée, des valeurs qu'il pèse autrement. Parfois elle ne cache que de l'émotion — et confrontée aux faits, celle-là ne tient pas. Posez le désaccord à plat, et l'ennemi redevient une personne.",
      pullLine: "L'ennemi redevient une personne.",
    },
    pillars: {
      eyebrow: "Ce que fait Parallax",
      titleLine: "Trois filtres :",
      titleEm: "les faits, la version la plus forte, les valeurs en dessous.",
      lede:
        "Chaque débat passe par trois filtres — les trois raisons mêmes pour lesquelles deux personnes raisonnables divergent.",
      filtersLink: "Voyez les trois filtres sur un vrai débat →",
      items: [
        {
          no: "02",
          title: "Ensuite, le cas le plus solide",
          cause: "La position que vous avez caricaturée.",
          body:
            "Ce qui passe l'épreuve des faits est écrit dans la version équitable la plus solide de chaque camp — celle qu'un soutien réfléchi reconnaîtrait. Chacun peut contester un steelman ; les versions contestées restent visibles, signalées.",
        },
        {
          no: "01",
          title: "D'abord, les faits",
          cause: "Les faits que vous n'avez pas vus.",
          body:
            "Les affirmations sont reliées aux sources par des libellés d'alignement précis : corrobore, corrobore partiellement, contredit, à clarifier. Jamais « vérifié vrai ». Le libellé est auditable ; le verdict vous appartient.",
        },
        {
          no: "03",
          title: "Restent les valeurs",
          cause: "Les valeurs qu'ils pèsent autrement.",
          body:
            "Une fois les faits partagés et chaque position comprise, restent les valeurs — parfois les mêmes pesées autrement, parfois vraiment différentes, et les deux sont légitimes. La matrice des valeurs et le registre des compromis nomment ce choix au lieu de l'enfouir sous les « faits ».",
        },
      ],
    },
    stats: {
      creed: "Aucun vainqueur déclaré. Jamais.",
      creedSub: "Chaque point de vue reste — mais chaque affirmation doit être sourcée, et une affirmation fausse est réfutée au grand jour.",
      chip: "Trois débats de départ · structure non relue, volontairement",
    },
    ai: {
      eyebrow: "Humains et IA",
      titleLine: "Une boussole pour les humains.",
      titleEm: "Un corpus pour les IA.",
      lede:
        "Aujourd'hui, Parallax est une collection vivante de cartes de débats sourcées et non relues. La cible est un corpus contestable et révisable, utile aux personnes comme aux systèmes d'IA.",
      buildStep: "Le contrat IA prévu",
      buildTitle: "L'IA propose. Les humains tranchent.",
      buildBody:
        "Des outils d’IA ont aidé à préparer ces dossiers. Les affirmations, steelmans et libellés d’alignement restent non relus jusqu’à une décision humaine nommée.",
      alignStep: "Elle aide à aligner l'IA",
      alignTitle: "Un corpus pour aligner les IA.",
      alignBody:
        "Des positions formulées à leur meilleur, des valeurs cartographiées et les arbitrages humains : exactement la donnée plurielle dont l'alignement a besoin — avec des benchmarks qui testent si un modèle représente chaque camp équitablement, et un savoir sourcé et contestable pour continuer d'apprendre.",
    },
    preview: {
      eyebrow: "Les dossiers",
      title: "Les dossiers à relire.",
      note: "Assemblés à la main depuis des sources publiques et marqués non relus jusqu'à vérification indépendante. Ce statut fait partie du produit, ce n'est pas une clause de style.",
      allDebates: "Tous les débats ->",
    },
    trust: {
      titleStart: "« Si vous ne nous faites pas confiance,",
      titleEm: "vérifiez. »",
      cols: [
        {
          title: "Open source",
          body: "Tous les prompts, algorithmes et règles de modération sont conçus pour être publics et inspectables.",
        },
        {
          title: "Vocation d'intérêt public",
          body: "Parallax est aujourd'hui un projet open source, pas une association reconnue sans but lucratif. Sa cible est une gouvernance indépendante d'intérêt public, sans incitation à gonfler l'engagement ni camp favorisé.",
        },
        {
          title: "Auditable",
          body: "Le contenu vit dans des fichiers versionnés. Leur historique Git conserve les changements réels ; chaque brouillon indique qu’il n’a pas de relecture humaine nommée.",
        },
      ],
    },
    invite: {
      eyebrow: "Une invitation",
      headline: "Voir les sources d’une affirmation ?",
      headlineEm: "Ouvrez-la.",
      body:
        "Lisez chaque position et ouvrez une affirmation pour examiner ses sources et les extraits disponibles. Ces brouillons sont en lecture seule et n’ont pas de relecture humaine nommée.",
      cta: "Ouvrir un débat de démonstration →",
    },
    whyNow: {
      eyebrow: "Pourquoi maintenant",
      headline: "Une idée intemporelle,",
      headlineEm: "enfin réalisable.",
      items: [
        {
          title: "L'accord inter-groupes est une référence prometteuse.",
          body: "La relecture inter-groupes est une référence de conception. Parallax n’a pas de seuil de revue actif ; signatures, couverture et résistance à la coordination restent à valider.",
        },
        {
          title: "Le coût de construction s'est effondré.",
          body: "Une seule personne a produit un prototype bilingue fonctionnel et un corpus de conception approfondi pour une dépense quasi nulle — efficient en capital par construction.",
        },
        {
          title: "Deux besoins convergent.",
          body: "Les financeurs civiques veulent dépolariser ; les financeurs IA veulent des données de valeurs plurielles et des benchmarks d'équité. Un même commun répond aux deux — et il n'existe pas encore.",
        },
      ],
    },
    founder: {
      eyebrow: "Pourquoi cette structure",
      headline: "Bâti pour",
      headlineEm: "survivre à son fondateur.",
      founderLine:
        "Parallax a été bâti en grande partie en solo, avec l'IA, par un ingénieur passé par l'École 42 — tout-IA depuis 2023, venu ici par l'alignement, pas par la politique. Aucun parti pris à défendre : pour un produit de neutralité, c'est une qualité, pas une ligne de bio. Le prototype bilingue fonctionnel prouve qu'on sait livrer — vite, et à bas coût.",
      insight:
        "Le plus dur, pour aligner une IA, c'est de savoir de qui suivre l'éthique, quand les humains ne s'accordent pas. C'est le même fossé qui transforme des voisins en ennemis. Parallax est le socle des deux.",
      cards: [
        {
          title: "Mission verrouillée",
          body: "Aucune entité juridique ni association n'existe aujourd'hui. La cible est une structure indépendante d'intérêt public qui détienne la mission, le corpus et la gouvernance, avec toute activité commerciale juridiquement séparée.",
        },
        {
          title: "Corpus ouvert",
          body: "Le code et le corpus porteront des licences ouvertes explicites, irrévocables une fois attachées ; les clients payants achètent du confort, jamais de l'influence sur le contenu.",
        },
        {
          title: "Pas d'économie de l'attention",
          body: "Le site de lecture ne comporte ni compte, ni profil d’opinion, ni bulletin. Seule la préférence de langue est enregistrée dans ce navigateur.",
        },
      ],
      fundingLine:
        "Un commun ouvert, financé par des services autour de lui — flux structurés et benchmarks d'équité pour les labos d'IA et les institutions, destinés à être juridiquement séparés de la mission.",
      cta: "Soutenir, devenir partenaire, ou lire le plan →",
    },
    close: {
      eyebrow: "Apportez votre pierre",
      headline: "Ici, personne ne gagne un débat.",
      headlineEm: "Tout le monde y gagne une chose.",
      body:
        "On ne s'est jamais autant parlé, et jamais aussi mal compris. Le désaccord, bien mené, est la chose la plus rare en ligne : une compréhension qui tient. On cesse de prendre pour un ennemi quelqu'un qui priorise autrement — l'ennemi redevient une personne.",
      callToBelong:
        "Lisez. Contestez. Apportez votre pierre — elle sera relue, et elle restera.",
      cta: "Ouvrir le débat sur les smartphones →",
    },
  },
  debatesIndex: {
    eyebrow: "Les dossiers",
    titleLine: "Chaque débat,",
    titleEm: "organisé.",
    lede:
      "Chaque dossier décompose une question de politique publique en positions, affirmations, preuves libellées par source, valeurs et compromis — à partir de sources publiques, ouvert aux contributions, relu avant toute intégration.",
    emptyTitle: "Aucun débat ne correspond à cette recherche.",
    emptyBody: "Essayez un terme plus large, ou effacez les filtres pour voir tous les dossiers.",
    emptyClear: "Effacer les filtres",
    resultsCount: (n: number) => `${n} dossier${n > 1 ? "s" : ""} de débat trouvé${n > 1 ? "s" : ""}.`,
    dataDemo: "Les dossiers de démonstration intégrés sont actifs ; aucune bibliothèque en direct n'est configurée.",
    noteStart: "Les dossiers de départ ont été assemblés à la main depuis des sources publiques et sont marqués",
    noteStrong: "non relus",
    noteEnd: "jusqu'à vérification indépendante. Ce statut fait partie du produit, ce n'est pas une clause de style.",
  },
  debateCard: {
    read: "Lire ->",
    shapeAria: "État des affirmations de ce débat dans la bibliothèque",
    shapeEstablished: (n: number) =>
      `${n} affirmation${n > 1 ? "s" : ""} qui tien${n > 1 ? "nent" : "t"}`,
    shapeContested: (n: number) =>
      `${n} affirmation${n > 1 ? "s" : ""} contestée${n > 1 ? "s" : ""}`,
    shapeProvisional: (n: number) =>
      `${n} affirmation${n > 1 ? "s" : ""} provisoire${n > 1 ? "s" : ""} en attente de relecture`,
    shapeValues: (n: number) =>
      `${n} affirmation${n > 1 ? "s" : ""} ramenée${n > 1 ? "s" : ""} aux valeurs`,
  },
  atlas: {
    spineAria: "Forme épistémique de ce débat",
    spineSummary: (
      established: number,
      contested: number,
      provisional: number,
      values: number,
    ) =>
      `${established} établie${established > 1 ? "s" : ""}, ${contested} contestée${contested > 1 ? "s" : ""}, ${provisional} provisoire${provisional > 1 ? "s" : ""}, ${values} liée${values > 1 ? "s" : ""} aux valeurs`,
    revisedPrefix: "Révisé",
    claimsCounted: (n: number) =>
      `${n} affirmation${n > 1 ? "s" : ""} au registre`,
    viewAria: "Trier la bibliothèque",
    temperaments: {
      settled: "Plutôt établi",
      contested: "Contesté",
      provisional: "À relire",
      values: "Affaire de valeurs",
    } as Record<"settled" | "contested" | "provisional" | "values", string>,
    legend: {
      established: (n: number) => `${n} établie${n > 1 ? "s" : ""}`,
      contested: (n: number) => `${n} contestée${n > 1 ? "s" : ""}`,
      provisional: (n: number) => `${n} provisoire${n > 1 ? "s" : ""}`,
      values: (n: number) => `${n} aux valeurs`,
    },
    views: {
      all: "Tous les dossiers",
      contested: "Les plus contestés",
      provisional: "Les plus à relire",
      values: "Affaire de valeurs",
      recent: "Révisés récemment",
    },
    ledger: {
      aria: "Ce que contient la bibliothèque",
      creed:
        "Une jeune bibliothèque qui grandit au grand jour — et tient ses comptes sous vos yeux.",
      claims: (_n: number) => "affirmations au registre",
      sources: (_n: number) => "sources publiques citées",
      links: (_n: number) => "libellés source-affirmation",
      questions: (_n: number) => "questions ouvertes",
      settledNote:
        "Ce sont des états de relecture, pas des scores de vérité : « établie » exige une évaluation approuvée ; « provisoire » signifie que la relecture indépendante reste à faire.",
    },
  },
  draft: {
    title: "Brouillon non relu",
    provenance: "Préparé avec des outils d’IA ; aucune relecture humaine nommée à ce jour.",
    coverage: (positions: string, excerpts: number, links: number, percent: number | null) =>
      `Sources par position — ${positions} · liens avec un extrait exact enregistré : ${excerpts}/${links}${percent === null ? "" : ` (${percent} %)`}.`,
    reviewers: "Relecteurs : aucun pour l’instant.",
    excerptNote: "La présence d’un extrait ne certifie pas sa fidélité à la source : la relecture reste à faire.",
    unverifiedExcerpt: "extrait non vérifié",
  },
  debatePage: {
    notFound: "Dossier introuvable.",
    sharedClaim: (positions: string) => `partagée avec ${positions}`,
    evidenceEmpty: "Aucune source n'est encore rattachée à cette affirmation.",
    legendCaption:
      "Un libellé décrit comment une source se rapporte à une affirmation — jamais si l'affirmation est « vraie ».",
    argMeta: (claims: number, contested: number, dominant: string) =>
      `${claims} affirmation${claims > 1 ? "s" : ""} · ${
        contested > 0 ? `${contested} contestée${contested > 1 ? "s" : ""} · ` : ""
      }surtout : ${dominant}`,
    continueEyebrow: "Continuer",
    continueTitle: "Comprendre le suivant.",
    back: "<- Tous les débats",
    heroStatus: (revision: number, sources: number) =>
      `Révision ${revision} · ${sources} sources publiques · structure pas encore relue indépendamment`,
    step1: "Étape 1",
    chooserEm: "Choisissez une position et lisez-la dans sa version la plus solide.",
    readingBelow: "Lecture ci-dessous ↓",
    readThisView: "Lire cette vue ->",
    chooserNote: "Parallax organise le désaccord — il ne choisit jamais de gagnant.",
    positionAria: "Position",
    readingEyebrow: (letter: string) => `Position ${letter} — lire en entier`,
    steelmanLabel: "Le cas le plus solide, tel qu'un soutien le formulerait",
    restsOn: "Ce sur quoi repose cette position",
    restsHint:
      "Chaque argument s'appuie sur des affirmations. Ouvrez une affirmation pour voir ses sources et leur alignement.",
    asksAccept: "Ce que cette position demande d'accepter",
    youGain: "Vous gagnez",
    youPay: "Vous payez",
    youRisk: "Vous risquez",
    inTensionWith: "en tension avec",
    step2: "Étape 2",
    disagreeTitle: "Pourquoi les gens divergent.",
    disagreeEm: "Mêmes faits, priorités différentes.",
    disagreeLede:
      "La majeure partie de ce débat ne porte pas sur la validité des faits, mais sur les valeurs à prioriser. Chaque colonne est une position ; chaque point rempli est une valeur qu'elle met en avant.",
    workEyebrow: "Pour les sceptiques",
    workTitle: "Montrer le travail.",
    workEm: "Chaque source, chaque changement, au registre.",
    allSources: "Toutes les sources",
    fileHistory: "Historique du fichier",
    fileHistoryNote: "Les changements réels de ce dossier sont consignés dans Git. Les dates du contenu décrivent la version de travail, pas une relecture humaine.",
    fileHistoryLink: "Voir les changements sur GitHub",
    howToRead: "Comment lire cette page",
    howToReadP1:
      "Chaque position est écrite comme un steelman : la version la plus solide de cette position, telle qu'un soutien réfléchi la formulerait.",
    howToReadP2Start: "Les affirmations sont reliées aux sources par des libellés d'alignement :",
    howToReadP2End:
      "Un libellé concerne une source et une affirmation. Ce n'est jamais un verdict sur le débat.",
    howToReadP3:
      "Ces brouillons ont été préparés avec des outils d’IA et ne sont pas encore vérifiés par des relecteurs humains nommés. L’historique des fichiers conserve les changements réels.",
    evidenceNote:
      "Les libellés décrivent comment chaque source se rapporte à cette affirmation précise — jamais si l'affirmation est « vraie ».",
    faultEyebrow: "La carte des lignes de fracture",
    faultTitle: "Là où le débat se divise vraiment.",
    faultEm: "Lire l'accord avant le conflit.",
    faultLede:
      "Chaque affirmation triée selon l'alignement de ses sources — établie, contestée, ou affaire de valeurs. Les mêmes faits peuvent mener à des priorités différentes ; cette carte montre exactement où se loge le désaccord.",
    faultCommonGround: (n: number) =>
      `${n} fait${n === 1 ? "" : "s"} sur ${n === 1 ? "lequel" : "lesquels"} les deux camps s'accordent déjà.`,
    faultCommonGroundFallback: (n: number) =>
      `${n} fait${n === 1 ? "" : "s"} tien${n === 1 ? "t" : "nent"} face aux preuves.`,
    faultLaneSettled: "Établi",
    faultLaneSettledCaption: "Étayé par les preuves — pas un verdict.",
    faultLaneContested: "Contesté",
    faultLaneContestedCaption: "Un litige empirique vivant dans les sources.",
    faultLaneValues: "Valeurs",
    faultLaneValuesCaption:
      "Aucune source ne peut trancher — c'est une priorité.",
    faultBothSides: (positions: string) =>
      `cité par les deux camps · ${positions}`,
    faultSettledNote:
      "Établi = étayé par les preuves, pas un verdict ; les positions divergent encore sur ce qu'il FAUT en faire.",
    faultEmptySettled: "Aucun fait établi sur la carte pour l'instant.",
    faultEmptyContested: "Rien n'est contesté par les preuves actuellement.",
    faultEmptyValues:
      "Aucune affirmation purement liée aux valeurs n'a émergé.",
  },
  method: {
    labels: [
      {
        cls: "supports_claim",
        name: "corrobore",
        desc: "La source soutient directement l'affirmation telle qu'elle est formulée.",
      },
      {
        cls: "partially_supports_claim",
        name: "corrobore partiellement",
        desc: "La source soutient une version plus étroite ou plus faible de l'affirmation.",
      },
      {
        cls: "contradicts_claim",
        name: "contredit",
        desc: "La source entre en conflit avec l'affirmation.",
      },
      {
        cls: "does_not_support_claim",
        name: "ne soutient pas",
        desc: "La source est réelle et pertinente, mais elle n'étaye pas cette affirmation.",
      },
      {
        cls: "unclear",
        name: "à clarifier",
        desc: "La relation doit être davantage relue avant d'être libellée.",
      },
    ],
    eyebrow: "La méthode",
    titleStart: "Comment lire",
    mission:
      "La plupart des désaccords sérieux portent sur des valeurs, pas sur des faits. Quand on voit clairement les valeurs de chacun — ce que chaque camp protège, et le prix qu'il est prêt à payer — on cesse de traiter l'autre en ennemi et on le voit comme quelqu'un qui pèse le monde autrement.",
    lede:
      "Le produit ne vous dit pas quoi penser. Il organise un débat pour vous permettre de penser clairement — et montre son travail à chaque étape.",
    filtersEyebrow: "Les trois filtres",
    filtersLede:
      "Chaque débat passe par la même séquence : d'abord les faits, puis le cas le plus solide de chaque camp, puis les valeurs qui restent. Lu dans cet ordre, un désaccord cesse d'être un combat et devient une carte.",
    lifecycle: {
      eyebrow: "Du début à la fin",
      title: "La vie d'un sujet.",
      intro:
        "Voici le cycle cible : une question se décompose sans perdre ses sources, son périmètre, son état de relecture ni sa piste d'audit. Le prototype actuel n'en démontre qu'une partie.",
      steps: [
        {
          n: "1",
          key: "ask",
          title: "Une question est posée",
          body:
            "N'importe qui ouvre un sujet — un titre lisible et un périmètre explicite. Avant de le créer, le système trouve le débat le plus proche et demande : la même question, une sous-question, plus large, ou vraiment nouveau ?",
        },
        {
          n: "2",
          key: "positions",
          title: "Les positions sont steelmannées",
          body:
            "Chaque réponse sérieuse est écrite dans sa version la plus forte — celle qu'un partisan reconnaîtrait. Autant qu'il en existe vraiment, jamais réduites à deux camps.",
        },
        {
          n: "3",
          key: "evidence",
          title: "Les affirmations rencontrent leurs sources",
          body:
            "Chaque position s'appuie sur des affirmations. Dans le prototype actuel, une affirmation vérifiable peut pointer vers des fiches sources libellées à la main et non relues ; la revue assistée par IA et la bibliothèque versionnée restent des cibles.",
        },
        {
          n: "4",
          key: "recurse",
          title: "Les points contestés se détachent",
          body:
            "Dans le système cible, une affirmation suffisamment contestée pourra devenir sa propre question tout en gardant ses liens avec le débat parent. Le prototype actuel ne crée pas encore de sous-débats.",
        },
        {
          n: "5",
          key: "state",
          title: "Chaque affirmation montre son état de relecture",
          body:
            "« Établie » exige une évaluation approuvée ; « contestée » signale une objection relue ; « provisoire » attend encore une relecture indépendante ; « liée aux valeurs » nomme un choix légitime de priorités.",
        },
        {
          n: "6",
          key: "review",
          title: "Rien ne change en silence",
          body:
            "La cible exige une relecture entre camps opposés pour les jugements sensibles. Les dossiers actuels sont non relus ; les changements sont consignés dans l’historique Git des fichiers.",
        },
      ],
      recursionNote:
        "Un sous-débat est un débat à part entière — titre, positions, sources, sous-débats. La même mécanique, à toutes les échelles.",
    },
    sections: [
      {
        title: "1 — Les positions sont steelmannées",
        body:
          "Chaque réponse sérieuse à la question est écrite dans sa version équitable la plus solide — comme un soutien réfléchi la formulerait. Une position est traitée équitablement quand un soutien raisonnable peut y reconnaître une version solide de son point de vue. Les relecteurs peuvent signaler un steelman comme contesté ; il reste visible, signalé — jamais supprimé en silence.",
      },
      {
        title: "2 — Les affirmations sont atomiques et libellées face aux sources",
        body:
          "Les arguments s'appuient sur des affirmations ; les affirmations renvoient à des sources. Chaque lien porte l'un de cinq libellés d'alignement :",
      },
      {
        title: "3 — Les valeurs et compromis sont explicites",
        body:
          "La plupart d'un débat difficile ne porte pas sur la validité des faits, mais sur les valeurs à prioriser : équité, efficacité, liberté, sécurité, confiance. Chaque position déclare les valeurs qu'elle privilégie et le prix qu'elle accepte : ce que vous gagnez, ce que vous payez, ce que vous risquez. C'est souvent là que vit le vrai désaccord.",
      },
    ],
    noVerified:
      "Il n'y a volontairement pas de « vérifié vrai ». La vérité exige souvent une synthèse de nombreuses sources et une expertise de domaine. L'alignement affirmation-source est plus étroit — et auditable. Le libellé indique ce que la source dit de l'affirmation ; le verdict reste le vôtre.",
    sources: {
      eyebrow: "La confiance dans les sources",
      title: "Évaluer un usage sans estampiller toute une source.",
      lede:
        "La question la plus dure d'un débat, c'est : à quelles sources se fier. Parallax n'y répond jamais à votre place en estampillant une source « fiable » — dès qu'une plateforme se fait juge, la moitié de ses lecteurs s'en va. Alors on déplace la question, et on montre notre travail.",
      points: [
        {
          title: "Faire confiance au fait, pas à la marque.",
          body:
            "Une source n'est jamais « fiable » dans l'absolu — seulement utilisable, ou non, pour une affirmation délimitée. La cible est de relier chaque citation à une version précise et d'en montrer la relation ; les fixtures actuelles restent partielles et non relues.",
        },
        {
          title: "Deux questions, jamais confondues.",
          body:
            "L'intégrité — est-ce fabriqué, mal cité, rétracté, financé par une partie intéressée ? — est jugée séparément de la pertinence — est-ce que ça soutient mon camp ? Être en désaccord avec la conclusion d'une source ne compte jamais contre son intégrité.",
        },
        {
          title: "L'accord entre camps, pas la majorité.",
          body:
            "La cible est une relecture par des personnes aux positions différentes. Les brouillons actuels n’ont pas de relecture humaine nommée ; aucun vivier de production ni échantillonnage n’est implémenté.",
        },
        {
          title: "Rien n'est supprimé.",
          body:
            "La cible garde une source contestée visible avec son défaut exact et sa justification, au lieu d'effacer le registre. Cet historique versionné complet n'est pas encore implémenté.",
        },
      ],
      flowTitle: "Parcours cible de relecture d'une source",
      flow: [
        {
          step: "01",
          title: "Un assistant prépare les contrôles",
          body:
            "Des outils d’IA ont aidé à préparer les sources et libellés du brouillon. Leurs extraits et alignements proposés doivent être relus ; les lecteurs ne peuvent pas déclencher d’analyse.",
        },
        {
          step: "02",
          title: "Les personnes prennent la décision",
          body:
            "La cible est une relecture structurée par des personnes aux positions différentes. Aucun vivier de relecteurs, échantillonnage ni seuil de couverture de production n'est encore implémenté.",
        },
        {
          step: "03",
          title: "Une version relue peut rejoindre la bibliothèque",
          body:
            "Après une revue suffisante et délimitée, la cible est une entrée versionnée et réutilisable dont les preuves, limites et fraîcheur restent visibles. Aucune bibliothèque de sources relues n'existe dans le prototype actuel.",
        },
      ],
      libraryLine:
        "Relire une version de source pour un usage délimité ; la cible est de la réutiliser sans perdre son périmètre, sa fraîcheur ni ses limites. Cette bibliothèque n'est pas encore implémentée.",
      keyline:
        "On peut promettre un processus équitable — jamais une conclusion confortable. C'est vous qui accordez votre confiance ; Parallax se charge de la transparence.",
    },
    aiTitle: "Ce que l'IA est autorisée à faire",
    proposes: "Elle propose",
    neverSilently: "Elle ne fait jamais en silence",
    proposesItems: [
      "extraire des affirmations et classifier leur type",
      "résumer et steelmanner des positions",
      "libeller l'alignement affirmation-source",
      "cartographier valeurs et compromis",
      "signaler les faiblesses et positions manquantes",
    ],
    neverItems: [
      "supprimer une position sérieuse",
      "déclarer un débat résolu",
      "décider qu'une valeur est invalide",
      "cacher l'incertitude",
      "publier des changements sensibles sans revue",
    ],
    aiSourceRule:
      "Contrat cible : toute sortie IA reste signalée « proposée par IA, non relue » jusqu'à une revue humaine, avec une provenance de source pour chaque affirmation vérifiable.",
    note:
      "Ces dossiers ont été préparés avec des outils d’IA et n’ont pas encore de relecture humaine nommée. Les lecteurs ne peuvent pas déclencher d’analyse.",
    cta: "Lire un débat avec cette grille",
  },
  features: {
    statsDebates: "débats ouverts à la lecture",
    statsClaims: "affirmations, chacune reliée à ses sources",
    statsSources: "sources publiques, étiquetées à la main",
    classroomsEyebrow: "Pour les classes",
    classroomsTitle: "Une leçon toute prête pour apprendre à bien être en désaccord.",
    classroomsBody: "Un débat, ses sources et la meilleure version de chaque position : une séance de lecture où l’exercice consiste à formuler loyalement le camp adverse. Les kits enseignants sont prévus pour un pilote.",
    classroomsCta: "En savoir plus sur le pilote",
    nameOrigin: "La parallaxe, c'est ainsi que les astronomes mesurent la distance des étoiles : le même objet, visé depuis deux points de vue, révèle une vérité qu'aucun point de vue seul ne peut atteindre.",
    libraryEyebrow: "La bibliothèque",
    libraryTitle: "Ce que le débat établit,",
    libraryTitleEm: "la bibliothèque le garde.",
    libThesis: "Le désaccord n'est pas l'obstacle à la vérité — c'est ainsi qu'elle se fabrique. Une affirmation qui survit à la plus forte objection de ses adversaires vaut plus qu'une affirmation tamponnée par un vérificateur neutre.",
    libraryLede: "Chaque affirmation commence provisoire et vise l'un de trois résultats relus — les trois constituent un progrès.",
    libEstablished: "Établie",
    libEstablishedDesc: "L'état qu'une affirmation gagne lorsqu'elle survit à la relecture inter-camps face aux meilleures contre-preuves apportées. Datée, révisable — jamais \"définitive\". (Aujourd'hui, chaque affirmation de départ est encore non relue — c'est tout l'enjeu.)",
    libContested: "Contestée",
    libContestedDesc: "Là où les preuves s'opposent encore. La page du débat montre exactement où une affirmation bloque, et quelle preuve la débloquerait.",
    libValues: "Un choix de valeurs",
    libValuesDesc: "Faits partagés, positions comprises — ce qui reste est une différence légitime de priorités. La nommer, c'est la résolution.",
    libProtoNote: "La relecture inter-camps est la méthode visée. Chaque dossier actuel est un brouillon non relu ; aucun relecteur humain nommé ne l’a encore signé.",
    stateEyebrow: "État du débat",
    stateEstablished: (n: number) => `${n} qui tiennent`,
    stateContested: (n: number) => `${n} contestée${n > 1 ? "s" : ""}`,
    stateValues: (n: number) => `${n} liée${n > 1 ? "s" : ""} aux valeurs`,
    stateNote: "Dérivé du statut de relecture et d'évaluations auditables de l'affirmation. Un simple libellé source-affirmation ne suffit jamais à l'établir.",
    searchPh: "Rechercher questions, arguments, affirmations ou sources…",
    allThemes: "Tous",
    notFoundTitle: "Cette page n'existe pas.",
    notFoundBody: "Les débats, si.",
    notFoundCta: "Parcourir les débats",
    skipToContent: "Aller au contenu",
    errorTitle: "Quelque chose s'est rompu.",
    errorBody: "La page a rencontré une erreur — les débats sont toujours là.",
    errorCta: "Recharger la page",
  },
  interactive: {
    palette: {
      home: "Accueil",
      allDebates: "Tous les débats",
      method: "Méthode — comment lire Parallax",
      hintPage: "page",
      hintDebate: "débat",
      placeholder: "Rechercher pages, débats, affirmations ou sources…",
      empty: "Aucun résultat.",
    },
    debate: {
      share: "Partager ⧉",
      debateLinkCopied: "Lien du débat copié — envoyez-le au cœur de la discussion",
      claimLinkCopied: "Lien vers cette affirmation copié",
      claimCopyTitle: "Copier le lien vers cette affirmation",
    },
  },
} satisfies Messages;
