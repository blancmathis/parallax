import type { Messages } from "./en";

export const fr = {
  common: {
    localeName: "Français",
    nav: {
      debates: "Débats",
      method: "Méthode",
      review: "File de revue",
      readDebate: "Lire un débat",
      you: "Vous",
    },
    actions: {
      allDebates: "Tous les débats",
      browseDebates: "Parcourir les débats",
      read: "Lire",
      close: "Fermer",
      approve: "Approuver",
      reject: "Rejeter",
      resetDemo: "Réinitialiser les données de démo (efface contributions, revues et événements d'audit locaux)",
    },
    counts: {
      claims: (n: number) => `${n} affirmation${n > 1 ? "s" : ""}`,
      sources: (n: number) => `${n} source${n > 1 ? "s" : ""}`,
      publicSources: (n: number) => `${n} source${n > 1 ? "s" : ""} publique${n > 1 ? "s" : ""}`,
      evidenceLinks: (n: number) => `${n} lien${n > 1 ? "s" : ""} de preuve`,
      draftContributions: (n: number) =>
        `${n} contribution${n > 1 ? "s" : ""} en attente de revue — ouvrir la file ->`,
      seriousAnswers: (n: number) => `${n} réponse${n > 1 ? "s" : ""} sérieuse${n > 1 ? "s" : ""}.`,
      previewStats: (claims: number, sources: number, links: number) =>
        `${claims} affirmations · ${sources} sources publiques · ${links} liens de preuve.`,
      cardStats: (claims: number, sources: number, links: number) =>
        `${claims} affirmations · ${sources} sources · ${links} liens de preuve`,
      pendingPrefix: (n: number) => (n > 0 ? `${n} en attente · ` : ""),
      sourceCount: (n: number) => `${n} source${n > 1 ? "s" : ""}`,
    },
    labels: {
      revision: "Révision",
      revisionShort: "rév.",
      publicPolicy: "Politique publique",
      step: "Étape",
      confidence: "confiance",
      retrieved: "récupérée le",
      utc: "UTC",
      community: "Communauté",
      submitted: "Soumis",
      pending: "En attente",
      decided: "Traitées",
      reviewer: "Relecteur",
      on: "sur",
      proposedLabel: "libellé proposé",
      evidence: "Preuve",
      source: "source",
      noSourceYet: "aucune source pour l'instant",
      unreviewedStamp: "Non relu",
      openSource: "Open source",
      nonProfit: "Sans but lucratif",
      auditable: "Auditable",
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
    contributionStatusLabels: {
      submitted: "soumis",
      accepted: "accepté",
      rejected: "rejeté",
    },
    contributionLabels: {
      new_claim: "nouvelle affirmation",
      new_source: "nouvelle source",
      new_position: "nouvelle position",
      challenge_evidence_label: "contestation de libellé de preuve",
      challenge_steelman: "contestation du steelman",
      value_tradeoff_correction: "correction de valeur/arbitrage",
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
      partial: "partielle",
    },
    actorTypes: {
      user: "utilisateur",
      admin: "admin",
      ai: "IA",
      system: "système",
    },
    auditEventTypes: {
      topic_created: "sujet créé",
      source_added: "source ajoutée",
      source_retrieved: "source récupérée",
      claim_extracted: "affirmation extraite",
      evidence_labeled: "preuves libellées",
      position_generated: "position générée",
      revision_published: "révision publiée",
      contribution_submitted: "contribution soumise",
      review_completed: "revue terminée",
    },
  },
  meta: {
    titleHome: "Parallax — L'atlas du désaccord",
    titleDebates: "Débats — Parallax",
    titleMethod: "Méthode — Parallax",
    titleReview: "File de revue — Parallax",
    titleYou: "Votre carte — Parallax",
    description:
      "Parallax cartographie les désaccords sérieux : chaque point de vue dans sa version la plus forte, chaque affirmation reliée à ses sources, chaque valeur nommée. De quoi vous faire un avis fondé — et comprendre pourquoi des gens raisonnables divergent : parfois les mêmes valeurs pesées autrement, parfois des valeurs différentes. Aucun vainqueur désigné.",
    ogTitle: "Parallax — Comprendre chaque point de vue. Y compris le vôtre.",
    ogDescription:
      "Un atlas du désaccord, sans but lucratif et open source. Les faits, puis le cas le plus solide, puis les valeurs en dessous. Aucun vainqueur déclaré. Jamais.",
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
    reviewQueue: "File de revue",
    principleItems: [
      "Aucun gagnant déclaré",
      "Chaque camp steelmanné",
      "Chaque libellé auditable",
    ],
    projectItems: ["Open source", "Sans but lucratif", "Prototype jalons 1-3"],
    legal: {
      instrument: "parallax — un instrument de raisonnement public",
      seed: "débats de départ fondés sur des sources publiques · structure non relue",
    },
    languageLabel: "Langue",
    skipToContent: "Aller au contenu",
    primaryNavLabel: "Principale",
    commandPaletteLabel: "Rechercher et accéder à une page",
    ctaTakeQuiz: "Faire le quiz",
    menuOpen: "Ouvrir le menu",
    menuClose: "Fermer le menu",
    pendingCount: (n: number) =>
      `${n} contribution${n > 1 ? "s" : ""} en attente de revue`,
  },
  landing: {
    hero: {
      kicker: "L'atlas du désaccord",
      titleLine: "La bibliothèque vivante des",
      titleEm: "grands débats.",
      lede:
        "On y fait avancer chaque grande question vers des réponses claires, structurées et sourcées. Tous les points de vue, à leur meilleur.",
      primaryCta: "Explorer les débats",
      secondaryCta: "Lire la méthode",
      tertiaryCta: "Mesurer votre propre regard",
      tertiaryCtaTime: "test d'une minute",
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
    interactive: {
      eyebrow: "Lisez, puis mettez-vous à l'épreuve",
      titleLine: "Ne faites pas que lire —",
      titleEm: "prouvez que vous savez défendre l'autre camp.",
      lede:
        "Parallax n'est pas un mur de texte à survoler. Prenez une position, puis prouvez que vous savez défendre l'autre camp — et observez votre regard sur « eux » se déplacer.",
      quizStep: "Une minute",
      quizTitle: "Situez-vous",
      quizBody:
        "Cinq compromis relient vos priorités à la position la plus proche — et aux valeurs que vous partagez avec ceux qui ne sont pas d'accord.",
      steelStep: "Le vrai test",
      steelTitle: "Défendez l'autre camp",
      steelBody:
        "Réussissez le test du steelman sur une position que vous rejetez. Formulez-la comme le ferait un soutien, et gagnez un badge qui prouve que vous l'avez comprise.",
      deltaStep: "Mesuré sur vous, pas sur eux",
      deltaMetric: "avant → après",
      deltaBody:
        "Notez l'autre camp avant de lire, puis après. L'écart est calculé sur vos propres réponses, reste dans votre navigateur, et ne nous est jamais envoyé — un miroir, pas une métrique que l'on collecte. Savoir si la lecture déplace les lecteurs en général est une étude que nous voulons mener, pas un résultat que nous revendiquons.",
      refrain: "C'est là que l'ennemi redevient une personne.",
      cta: "Commencer par le débat sur les smartphones",
      profileLink: "ou voir votre profil",
    },
    ai: {
      eyebrow: "Humains et IA",
      titleLine: "Une boussole pour les humains.",
      titleEm: "Un corpus pour les IA.",
      lede:
        "Le même moteur sert les deux : une base vivante de réflexion vérifiée et sourcée, où humains et IA apprennent à mieux penser, ensemble.",
      buildStep: "L'IA aide à le construire",
      buildTitle: "L'IA propose. Les humains tranchent.",
      buildBody:
        "L'IA peut extraire des affirmations, formuler une position à son meilleur, ou qualifier l'alignement d'une source. Mais chaque contribution de l'IA est signalée, doit porter une source, et est confirmée par un humain avant d'entrer au dossier. L'IA propose la structure ; elle ne publie jamais de verdict.",
      alignStep: "Elle aide à aligner l'IA",
      alignTitle: "Un corpus pour aligner les IA.",
      alignBody:
        "Des positions formulées à leur meilleur, des valeurs cartographiées et les arbitrages humains : exactement la donnée plurielle dont l'alignement a besoin — avec des benchmarks qui testent si un modèle représente chaque camp équitablement, et un savoir sourcé et contestable pour continuer d'apprendre.",
    },
    preview: {
      eyebrow: "Les dossiers",
      title: "Trois dossiers de départ, ouverts dès le premier jour.",
      note: "Assemblés à la main depuis des sources publiques et marqués non relus jusqu'à vérification indépendante. Ce statut fait partie du produit, ce n'est pas une clause de style.",
      allDebates: "Tous les débats ->",
    },
    loop: {
      eyebrow: "La boucle",
      titleLine: "Contribution ouverte,",
      titleEm: "encadrée par la relecture.",
      steps: [
        {
          verb: "Lire",
          text: "un débat — positions, affirmations, preuves, valeurs, compromis.",
        },
        {
          verb: "Contribuer",
          text: "un brouillon — affirmation, source, contestation ou position manquante.",
        },
        {
          verb: "Relire",
          text: "les brouillons restent en attente jusqu'à acceptation ou rejet par un relecteur, avec une justification écrite.",
        },
        {
          verb: "Auditer",
          text: "chaque transformation entre au registre. Rien ne change en silence.",
        },
      ],
      noteStart: "Essayez : ouvrez un débat et cliquez sur",
      noteButton: "Améliorer ce débat",
      noteMiddle: "puis jouez le rôle de relecteur dans la",
      noteLink: "file de revue",
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
          title: "Sans but lucratif",
          body: "Conçu sans but lucratif : aucune métrique d'engagement à gonfler, aucun camp à favoriser.",
        },
        {
          title: "Auditable",
          body: "Chaque décision de relecture est au registre ; quand le pipeline IA arrivera, chaque étape IA sera journalisée de la même façon. La neutralité s'audite, elle ne se proclame pas — un auditeur externe est un livrable, pas un badge.",
        },
      ],
    },
    invite: {
      eyebrow: "Une invitation",
      headline: "Un libellé vous semble faux ?",
      headlineEm: "Touchez-y.",
      body:
        "Parallax n'est pas en lecture seule. Contestez un libellé, ajoutez une meilleure source, écrivez la position manquante — sans compte. Votre brouillon ne modifie jamais la page directement : il attend une relecture, avec une justification écrite, au registre.",
      cta: "Ouvrir un débat réel →",
    },
    whyNow: {
      eyebrow: "Pourquoi maintenant",
      headline: "Une idée intemporelle,",
      headlineEm: "enfin réalisable.",
      items: [
        {
          title: "La méthode de validation est prouvée.",
          body: "Des jugements confirmés seulement lorsqu'ils obtiennent l'accord entre camps — pas à la majorité — fonctionnent désormais à grande échelle. Community Notes l'a démontré.",
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
          body: "Parallax est en cours de constitution en association loi 1901, destinée à détenir la mission, le corpus et la gouvernance, toute activité commerciale logée dans une filiale juridiquement séparée — pour que les lignes rouges ne puissent pas être bradées en silence.",
        },
        {
          title: "Corpus ouvert",
          body: "Le code et le corpus porteront des licences ouvertes explicites, irrévocables une fois attachées ; les clients payants achètent du confort, jamais de l'influence sur le contenu.",
        },
        {
          title: "Pas d'économie de l'attention",
          body: "Aucune métrique d'engagement à optimiser, aucun camp à favoriser. Les données individuelles — votre quiz, votre profil, votre déplacement de perception — ne sont jamais vendues ; aujourd'hui elles ne quittent jamais votre navigateur.",
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
    next: "suivant",
    proposeTitle: "Proposer un sujet",
    proposeSummary:
      "La création générale de sujets arrive au jalon 6 — après preuve de solidité de la boucle contribution-revue. Bons candidats : des questions de politique publique appuyées sur des sources inspectables publiquement.",
    notOpen: "pas encore ouvert",
    proposeHint: "votre idée",
    proposeAction: "La proposer →",
    emptyTitle: "Aucun débat ne correspond à cette recherche.",
    emptyBody: "Essayez un terme plus large, ou effacez les filtres pour voir tous les dossiers.",
    emptyClear: "Effacer les filtres",
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
    shapeValues: (n: number) =>
      `${n} affirmation${n > 1 ? "s" : ""} ramenée${n > 1 ? "s" : ""} aux valeurs`,
  },
  atlas: {
    spineAria: "Forme épistémique de ce débat",
    spineSummary: (established: number, contested: number, values: number) =>
      `${established} établie${established > 1 ? "s" : ""}, ${contested} contestée${contested > 1 ? "s" : ""}, ${values} ramenée${values > 1 ? "s" : ""} aux valeurs`,
    revisedPrefix: "Révisé",
    claimsCounted: (n: number) =>
      `${n} affirmation${n > 1 ? "s" : ""} au registre`,
    viewAria: "Trier la bibliothèque",
    temperaments: {
      settled: "Plutôt établi",
      contested: "Contesté",
      values: "Affaire de valeurs",
    } as Record<"settled" | "contested" | "values", string>,
    legend: {
      established: (n: number) => `${n} établie${n > 1 ? "s" : ""}`,
      contested: (n: number) => `${n} contestée${n > 1 ? "s" : ""}`,
      values: (n: number) => `${n} aux valeurs`,
    },
    views: {
      all: "Tous les dossiers",
      contested: "Les plus contestés",
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
        "« Établie » signifie appuyée sur des preuves, pas un verdict — les positions divergent encore sur ce qu'il faut FAIRE de ces faits.",
    },
  },
  debatePage: {
    notFound: "Dossier introuvable.",
    communityPosition: "Position de la communauté",
    sharedClaim: (positions: string) => `partagée avec ${positions}`,
    evidenceEmpty: "Aucune source n'est encore rattachée à cette affirmation.",
    communityUnmapped: "Pas encore placée sur la matrice des valeurs.",
    legendCaption:
      "Un libellé décrit comment une source se rapporte à une affirmation — jamais si l'affirmation est « vraie ».",
    argMeta: (claims: number, contested: number, dominant: string) =>
      `${claims} affirmation${claims > 1 ? "s" : ""} · ${
        contested > 0 ? `${contested} contestée${contested > 1 ? "s" : ""} · ` : ""
      }surtout : ${dominant}`,
    switcherPassed: "Test du steelman réussi",
    switcherMatch: "Votre position la plus proche",
    switcherTakeTest: "Test du steelman disponible",
    openReviewQueue: "Ouvrir la file de revue",
    continueEyebrow: "Continuer",
    continueTitle: "Comprendre le suivant.",
    continueDelta: (delta: number) =>
      `Après lecture, vous avez jugé l'autre camp +${delta} plus raisonnable.`,
    continueProfileLink: "Voir sur votre profil",
    continueYouLink: "votre carte",
    back: "<- Tous les débats",
    heroStatus: (revision: number, sources: number) =>
      `Révision ${revision} · ${sources} sources publiques · structure pas encore relue indépendamment`,
    improve: "Améliorer ce débat",
    step1: "Étape 1",
    chooserEm: "Choisissez une position et lisez-la dans sa version la plus solide.",
    communityAccepted: "Communauté · accepté",
    readingBelow: "Lecture ci-dessous ↓",
    readThisView: "Lire cette vue ->",
    chooserNote: "Parallax organise le désaccord — il ne choisit jamais de gagnant.",
    positionAria: "Position",
    readingEyebrow: (letter: string) => `Position ${letter} — lire en entier`,
    communityReadingEyebrow: "Position de la communauté — acceptée en revue",
    steelmanLabel: "Le cas le plus solide, tel qu'un soutien le formulerait",
    contested: "contesté",
    communityChallenge: "Contestation communautaire :",
    restsOn: "Ce sur quoi repose cette position",
    restsHint:
      "Chaque argument s'appuie sur des affirmations. Ouvrez une affirmation pour voir ses sources et leur alignement.",
    communityAdditions: "Ajouts de la communauté",
    communityAdditionsHint: "Acceptés en revue. Les sources attendent encore leur libellé d'alignement.",
    communityNote:
      "Cette position a été proposée par un visiteur et acceptée par un relecteur. Elle n'a pas encore d'arguments structurés — contestations et sources bienvenues.",
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
    communitySubmittedSource: "source proposée par la communauté · acceptée en revue · en attente de libellé d'alignement",
    auditTrail: "Piste d'audit",
    howToRead: "Comment lire cette page",
    howToReadP1:
      "Chaque position est écrite comme un steelman : la version la plus solide de cette position, telle qu'un soutien réfléchi la formulerait.",
    howToReadP2Start: "Les affirmations sont reliées aux sources par des libellés d'alignement :",
    howToReadP2End:
      "Un libellé concerne une source et une affirmation. Ce n'est jamais un verdict sur le débat.",
    howToReadP3:
      "Tout ce contenu est actuellement non relu : la structure a été assemblée à la main à partir du dossier de départ et n'a pas encore été vérifiée par des relecteurs indépendants.",
    evidenceNote:
      "Les libellés décrivent comment chaque source se rapporte à cette affirmation précise — jamais si l'affirmation est « vraie ».",
    communityChallengeProposes: (label: string) =>
      `Contestation communautaire — propose « ${label} »`,
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
    faultWeightLead: "Classé selon ce que vous valorisez le plus",
    faultWeightNote:
      "Vos priorités du quiz, mesurées face aux valeurs de chaque position. Un prisme, pas un verdict.",
    faultWeightEmpty:
      "Faites le quiz des valeurs pour voir quelles positions vous correspondent.",
    faultWeightEmptyCta: "Situez-vous ↑",
  },
  contribute: {
    types: [
      {
        id: "new_claim",
        label: "Nouvelle affirmation",
        hint: "Ajouter une assertion sur laquelle repose une position (avec une source si vous en avez une).",
      },
      {
        id: "new_source",
        label: "Nouvelle source",
        hint: "Rattacher une source publique à une affirmation existante.",
      },
      {
        id: "challenge_evidence_label",
        label: "Contester un libellé",
        hint: "Expliquer pourquoi le libellé d'alignement entre affirmation et source est faux.",
      },
      {
        id: "challenge_steelman",
        label: "Contester un steelman",
        hint: "Un soutien de cette position ne s'y reconnaîtrait pas ? Expliquez pourquoi.",
      },
      {
        id: "new_position",
        label: "Position manquante",
        hint: "Une réponse sérieuse à la question n'est pas encore représentée.",
      },
    ],
    improve: "Améliorer ce débat",
    title: "Rédiger une contribution",
    submitted: "Soumis",
    pendingTitle: "Votre brouillon attend une revue.",
    pendingBody:
      "Il ne modifiera pas le débat publié tant qu'un relecteur ne l'aura pas accepté — avec une justification écrite, au registre.",
    openReview: "Ouvrir la file de revue",
    draftAnother: "Rédiger autre chose",
    whatAdding: "Qu'ajoutez-vous ?",
    whichPosition: "Quelle position ?",
    choosePosition: "Choisir une position...",
    whichClaim: "Quelle affirmation ?",
    chooseClaim: "Choisir une affirmation...",
    whichEvidenceLink: "Quel lien de preuve ?",
    chooseLink: "Choisir le lien...",
    currently: "actuellement",
    shouldBeLabeled: "Il devrait être libellé...",
    positionTitle: "Titre de la position",
    positionTitlePlaceholder: "ex. « Oui, mais seulement par référendum ville par ville »",
    sourceUrl: "URL de la source",
    optional: "(facultatif)",
    textareaPlaceholder: "Écrivez-le comme un relecteur attentif voudrait le lire...",
    submit: "Soumettre à revue",
    hint: "Les brouillons ne modifient jamais directement le débat publié.",
    bodyLabels: {
      new_claim: "L'affirmation, formulée atomiquement",
      new_source: "Que dit cette source sur l'affirmation ?",
      challenge_evidence_label: "Pourquoi le libellé actuel est-il faux ?",
      challenge_steelman: "Dans quoi un soutien ne se reconnaîtrait-il pas ?",
      new_position: "La position, dans sa version la plus solide",
      value_tradeoff_correction: "Quelle valeur ou quel arbitrage est mal formulé, et comment ?",
    },
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
        "Une question arrive, se démonte, et ne cesse jamais d'être inspectable — la même mécanique tourne à toutes les échelles.",
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
            "Chaque position s'appuie sur des affirmations ; chaque affirmation est reliée à ses sources avec un libellé d'alignement précis. Les sources sont vérifiées — l'IA d'abord, puis les gens — et rejoignent une bibliothèque réutilisable.",
        },
        {
          n: "4",
          key: "recurse",
          title: "Les points contestés se détachent",
          body:
            "Une affirmation assez contestée devient sa propre question, avec son périmètre — un sous-débat — et le cycle recommence. Un gros sujet est un atlas de sous-débats, pas une page.",
        },
        {
          n: "5",
          key: "state",
          title: "Tout se range en trois",
          body:
            "À chaque niveau : établi (a tenu l'épreuve), contesté (et où précisément ça bloque), ou dépendant des valeurs (un choix de priorités légitime).",
        },
        {
          n: "6",
          key: "review",
          title: "Rien ne change en silence",
          body:
            "Les jugements sensibles ne passent que si des relecteurs de camps opposés convergent. Chaque étape est au registre, et tout reste contestable.",
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
      {
        title: "4 — Les changements passent par revue, au registre",
        body:
          "N'importe qui peut rédiger une contribution : nouvelle affirmation, nouvelle source, contestation d'un libellé ou d'un steelman, position manquante. Les brouillons ne touchent jamais le débat publié. Un relecteur accepte ou rejette chacun d'eux avec une justification écrite, et chaque étape — soumission, décision, publication — entre dans la piste d'audit. Rien ne change en silence.",
      },
    ],
    noVerified:
      "Il n'y a volontairement pas de « vérifié vrai ». La vérité exige souvent une synthèse de nombreuses sources et une expertise de domaine. L'alignement affirmation-source est plus étroit — et auditable. Le libellé indique ce que la source dit de l'affirmation ; le verdict reste le vôtre.",
    sources: {
      eyebrow: "La confiance dans les sources",
      title: "Vérifiées sans arbitre.",
      lede:
        "La question la plus dure d'un débat, c'est : à quelles sources se fier. Parallax n'y répond jamais à votre place en estampillant une source « fiable » — dès qu'une plateforme se fait juge, la moitié de ses lecteurs s'en va. Alors on déplace la question, et on montre notre travail.",
      points: [
        {
          title: "Faire confiance au fait, pas à la marque.",
          body:
            "Une source n'est jamais « fiable » dans l'absolu — seulement utilisable, ou non, pour un fait précis, dans un domaine précis, sur une période précise. On remonte chaque citation à sa source primaire et on vérifie qu'elle dit vraiment ce qu'on lui fait dire.",
        },
        {
          title: "Deux questions, jamais confondues.",
          body:
            "L'intégrité — est-ce fabriqué, mal cité, rétracté, financé par une partie intéressée ? — est jugée séparément de la pertinence — est-ce que ça soutient mon camp ? Être en désaccord avec la conclusion d'une source ne compte jamais contre son intégrité.",
        },
        {
          title: "L'accord entre camps, pas la majorité.",
          body:
            "Un jugement sur une source ne tient que si des relecteurs qui d'habitude s'opposent l'acceptent tous les deux. Une meute ne peut pas l'imposer ; un seul camp ne peut pas le bloquer — le mécanisme derrière les Community Notes de X.",
        },
        {
          title: "Rien n'est supprimé.",
          body:
            "Une source faible est signalée avec son défaut exact et reléguée — jamais effacée. Elle reste au registre, avec sa raison, ouverte à la contestation.",
        },
      ],
      flowTitle: "Comment une source est vérifiée",
      flow: [
        {
          step: "01",
          title: "Une IA vérifie d'abord",
          body:
            "Quand une source arrive, l'assistant la remonte à sa source primaire, vérifie que la citation dit vraiment ce qu'on lui attribue, et signale rétractations ou conflits d'intérêts — puis rédige une fiche neutre.",
        },
        {
          step: "02",
          title: "Puis les gens l'analysent",
          body:
            "Des lecteurs de différents camps pèsent son intégrité et laissent des notes structurées. C'est l'accord entre camps — pas un vote à main levée — qui fait tenir un verdict.",
        },
        {
          step: "03",
          title: "Et elle rejoint la bibliothèque",
          body:
            "Une source vérifiée par beaucoup devient une entrée réutilisable. Les débats suivants la citent sans tout recommencer, et l'assistant peut proposer des sources déjà vérifiées pendant que vous construisez votre argument.",
        },
      ],
      libraryLine:
        "Vérifier une source une fois ; la réutiliser partout. Plus Parallax avance, plus ce commun de preuves vérifiées se renforce — analysé par des milliers de personnes, propriété de personne.",
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
      "L'IA peut participer aussi — mais tout ce qu'elle ajoute est signalé « proposé par IA », vérifié avant de compter, et doit citer une source. En réalité aucun argument n'entre sans source, qu'il vienne d'une personne ou d'une machine.",
    note:
      "Dans ce prototype, la structure de départ a été assemblée à la main ; le pipeline IA arrive au jalon 4 et sera tenu au même contrat.",
    cta: "Lire un débat avec cette grille",
  },
  review: {
    targetPosition: (letter: string, title: string) => `Position ${letter} — ${title}`,
    targetClaim: (id: string, text: string) => `${id.toUpperCase()} — ${text}`,
    targetEvidence: (publisher: string, claim: string) => `Preuve : ${publisher} sur ${claim}`,
    eyebrow: "Mode relecteur",
    title: "La file de revue.",
    titleEm: "Rien ne change en silence.",
    lede:
      "Les contributions brouillon attendent ici. Les approuver les intègre à la vue publiée du débat et publie une nouvelle révision locale ; les rejeter les garde au registre avec votre justification. Dans ce prototype, vous êtes le relecteur — les décisions persistent dans votre navigateur.",
    clear: "La file est vide.",
    emptyHintStart: "Ouvrez un débat et cliquez sur",
    emptyHintButton: "Améliorer ce débat",
    emptyHintEnd: "pour rédiger une contribution, puis revenez ici pour la relire.",
    rationalePlaceholder: "Justification écrite — elle entre au registre...",
    mergeAction: "Fusionner au registre",
    mergeHint:
      "Clone la révision publiée, applique cette contribution, publie une nouvelle révision datée.",
    mergeAdminOnly:
      "Rôle admin requis pour fusionner — un relecteur accepte, un admin publie.",
    mergeDeferred:
      "Pas encore fusionnable automatiquement — ce type de contribution nécessite d'abord une structuration humaine.",
    mergeDone: (slug: string) =>
      `Fusionnée dans une nouvelle révision publiée — ouvrez /debates/${slug}.`,
    mergeFailed: "La fusion a échoué ; le registre canonique est inchangé.",
    mergedInto: (rev: string) => `Fusionnée au registre canonique · ${rev}.`,
    sampleType: "nouvelle source",
    sampleTopic: "Les écoles devraient-elles interdire les smartphones en cours ?",
    sampleTag: "exemple",
    sampleTarget:
      "Affirmation : « Interdire le téléphone pendant la journée d'école améliore le bien-être des adolescents. »",
    sampleBody:
      "Une étude longitudinale concentre les gains de bien-être chez les gros utilisateurs — à rattacher, mais elle soutient une affirmation plus étroite que celle énoncée.",
    sampleHint:
      "Un exemple, pour voir à quoi ressemble la relecture. Les commandes sont inertes — rédigez une vraie contribution pour les utiliser.",
  },
  features: {
    voicesEyebrow: "D'où vient cette conviction",
    voicesHint: "Les valeurs sont souvent la trace d'une histoire. Les voix d'amorçage sont des portraits composites réalistes, relus comme toute contribution.",
    voicesSample: "voix composite · contenu d'amorçage",
    statsDebates: "débats ouverts à la lecture",
    statsClaims: "affirmations, chacune reliée à ses sources",
    statsSources: "sources publiques, étiquetées à la main",
    statsDeltas: "Un processus, pas des verdicts.",
    classroomsEyebrow: "Pour les classes",
    classroomsTitle: "Une leçon toute prête pour apprendre à bien être en désaccord.",
    classroomsBody: "Un débat, le quiz des valeurs, le test du steelman : une séance d'éducation civique complète où le devoir consiste à formuler loyalement le camp adverse. Les kits enseignants arrivent avec le programme pilote.",
    classroomsCta: "En savoir plus sur le pilote",
    proposeTitle: "Proposer un sujet",
    proposeLede: "Les bons candidats sont des questions de politique publique dont les preuves sont publiquement vérifiables. Les brouillons restent sur votre appareil jusqu'à l'ouverture de la création de sujets (jalon 6).",
    proposeQuestion: "La question du débat",
    proposeQuestionPh: "Faut-il… ?",
    proposeWhy: "Pourquoi c'est important maintenant",
    proposeWhyPh: "Ce qui rend ce débat digne d'être cartographié…",
    proposeSources: "Deux sources publiques pour commencer",
    proposeEmail: "E-mail",
    proposeEmailPh: "vous@exemple.org",
    proposeEmailHint: "Facultatif — sert uniquement à vous prévenir quand votre sujet sera publié.",
    proposeSubmit: "Enregistrer ma proposition",
    proposeSavedToast: "Proposition enregistrée sur cet appareil — la création de sujets ouvre au jalon 6",
    proposeSavedTitle: "Enregistré, sur votre appareil.",
    proposeSavedBody: "Quand la création de sujets ouvrira, votre brouillon sera là, prêt à passer par la même chaîne de relecture que tout le reste.",
    nameOrigin: "La parallaxe, c'est ainsi que les astronomes mesurent la distance des étoiles : le même objet, visé depuis deux points de vue, révèle une vérité qu'aucun point de vue seul ne peut atteindre.",
    libraryEyebrow: "La bibliothèque",
    libraryTitle: "Ce que le débat établit,",
    libraryTitleEm: "la bibliothèque le garde.",
    libThesis: "Le désaccord n'est pas l'obstacle à la vérité — c'est ainsi qu'elle se fabrique. Une affirmation qui survit à la plus forte objection de ses adversaires vaut plus qu'une affirmation tamponnée par un vérificateur neutre.",
    libraryLede: "Chaque affirmation est conçue pour aboutir à l'un de trois états — et les trois sont un progrès.",
    libEstablished: "Établie",
    libEstablishedDesc: "L'état qu'une affirmation gagne lorsqu'elle survit à la relecture inter-camps face aux meilleures contre-preuves apportées. Datée, révisable — jamais \"définitive\". (Aujourd'hui, chaque affirmation de départ est encore non relue — c'est tout l'enjeu.)",
    libContested: "Contestée",
    libContestedDesc: "Là où les preuves s'opposent encore. La page du débat montre exactement où une affirmation bloque, et quelle preuve la débloquerait.",
    libValues: "Un choix de valeurs",
    libValuesDesc: "Faits partagés, positions comprises — ce qui reste est une différence légitime de priorités. La nommer, c'est la résolution.",
    libProtoNote: "La relecture inter-camps, c'est ainsi que c'est conçu, et ce que nous construisons. Le prototype d'aujourd'hui tourne en mode relecteur unique — et le dit sur chaque débat.",
    stateEyebrow: "État du débat",
    stateEstablished: (n: number) => `${n} qui tiennent`,
    stateContested: (n: number) => `${n} contestée${n > 1 ? "s" : ""}`,
    stateValues: (n: number) => `${n} liée${n > 1 ? "s" : ""} aux valeurs`,
    stateNote: "Dérivé de l'alignement affirmations-sources. La relecture inter-camps affinera ces états.",
    dedupTitle: "Affirmations similaires déjà sur la carte",
    dedupHint: "Parallax fusionne les doublons au lieu de les multiplier. Si votre point figure ci-dessous, ajoutez-y plutôt une source ou une distinction.",
    dedupUseIt: "C'est mon point",
    bridgeNote: "Règle de production : une décision n'est publiée que si des relecteurs de camps opposés convergent (consensus par pont). Ce prototype fonctionne en mode relecteur unique.",
    stewardTitle: "Éligibilité gardien",
    stewardHint: (done: number, total: number) => `Réussissez le test du steelman sur chaque position pour obtenir les droits de modération. ${done}/${total} obtenus.`,
    stewardEligible: "Éligible — vous avez prouvé que vous savez formuler loyalement chaque camp.",
    engineTitle: "Comment un sujet avance",
    engineLede: "Le moteur derrière chaque page — conçu pour l'objectivité à grande échelle, contre le spam, et pour l'exhaustivité.",
    engineItems: [
      { title: "Une contribution est un diff, pas un post", body: "Chaque soumission est d'abord confrontée à la carte existante. Les doublons sont fusionnés, jamais multipliés — la répétition et le spam meurent à la porte, sans censure." },
      { title: "Consensus par pont, pas par majorité", body: "Labels et steelmans sont validés quand des relecteurs de camps opposés convergent — le mécanisme des Community Notes. Une majorité peut brigader ; un pont, non." },
      { title: "La modération se gagne par la compréhension", body: "Pour devenir gardien d'un débat, il faut réussir le test du steelman sur chacune de ses positions. On ne modère que ce qu'on sait formuler loyalement." },
      { title: "Les grands sujets se fractalisent", body: "Une question immense devient un atlas de sous-questions partageant une bibliothèque d'affirmations globale — vérifiée une fois, citée partout." },
      { title: "L'IA fait le travail de masse, les humains jugent", body: "Dédoublonnage, extraction, récupération, premiers labels : l'IA, entièrement auditée. Validation, équité, arbitrage : les humains, par pont." },
    ],
    searchPh: "Rechercher dans les débats…",
    allThemes: "Tous",
    revHistory: "historique",
    revSeed: "structure d'amorçage publiée depuis le dossier de recherche",
    revLocal: "contribution communautaire intégrée (locale à ce navigateur)",
    notFoundTitle: "Cette page n'existe pas.",
    notFoundBody: "Les débats, si.",
    notFoundCta: "Parcourir les débats",
    skipToContent: "Aller au contenu",
    errorTitle: "Quelque chose s'est rompu.",
    errorBody: "La page a rencontré une erreur — les débats sont toujours là.",
    errorCta: "Recharger la page",
  },
  interactive: {
    scale: {
      min: "pas du tout",
      max: "tout à fait",
    },
    quiz: {
      introEyebrow: "Avant de lire",
      introTitle: "Où vous situez-vous ?",
      introLede:
        "Cinq compromis, une minute. Pas de bonnes réponses — seulement vos priorités. Voyez ensuite quelle position leur correspond, et quelles valeurs vous partagez avec l'autre camp.",
      start: "Commencer",
      privacy: "reste dans votre navigateur",
      sightedAt: (n: number) => `Visé à ${n} · avant lecture`,
      baselineEyebrow: "Calibrage rapide",
      baselineQuestion:
        "Les personnes en désaccord avec vous sur ce sujet — à quel point sont-elles raisonnables ?",
      back: "← Retour",
      resultEyebrow: "Vos valeurs, cartographiées",
      matchLead: "Votre position la plus proche",
      readFirst: "La lire d'abord",
      bridgesLead: "Et voici ce qui compte vraiment :",
      bridge: (value: string, letter: string) =>
        `Vous partagez « ${value.toLowerCase()} » avec les personnes qui répondent ${letter}.`,
      lensNote:
        "Les valeurs sont une grille de lecture, pas un verdict — on arrive aussi à une position par son histoire, ses peurs, ce qu'on a vécu. La carte montre la grille. La personne est toujours plus grande qu'elle.",
      savedToast: "Enregistré sur votre profil local — voir /you",
      savedLink: "Enregistré sur votre profil →",
      compactLeadStart: "Votre position la plus proche est",
      compactLeadEnd: (values: string[]) =>
        ` — vos priorités : ${values.join(" et ").toLowerCase()}.`,
      reRead: "La relire →",
      retake: "Refaire le quiz",
    },
    steelman: {
      eyebrow: "Test du steelman",
      title: "Comprenez-vous vraiment cette position ?",
      counter: (n: number, total: number, position: string) =>
        `Question ${n} sur ${total} · ${position}`,
      exactly: "Exactement.",
      notQuite: "Pas tout à fait.",
      next: "Question suivante",
      seeResult: "Voir le résultat",
      passStamp: "Steelman ✓",
      passTitle: "Vous savez formuler cette position comme le ferait un soutien.",
      passBody:
        "C'est la compétence la plus rare dans un débat — et le badge figure désormais sur votre profil local. Essayez le test sur la position avec laquelle vous êtes le plus en désaccord.",
      failTitle: "Presque — mais un soutien objecterait.",
      failBody:
        "Relisez le steelman et le registre des compromis, puis réessayez. Comprendre l'autre camp, c'est tout l'enjeu.",
      backToReading: "Revenir à la lecture",
      tryAgain: "Réessayer",
      badgeToast: "Badge steelman obtenu — enregistré sur votre profil",
    },
    perception: {
      eyebrow: "Avant de partir",
      beforeLabel: "Avant",
      afterLabel: "Après",
      movedDownStart: "Votre réponse a bougé de",
      movedDownEnd:
        "après lecture. Cela arrive aussi — au moins, le désaccord est désormais précis au lieu de rester vague.",
      measuredLine: "Nous l'avons mesuré sur vous — jamais sur eux.",
      question:
        "La même question qu'à votre arrivée : les personnes en désaccord avec vous sur ce sujet — à quel point sont-elles raisonnables ?",
      noBaseline:
        "C'est noté. La prochaine fois, faites le quiz des valeurs avant de lire — nous pourrons alors vous montrer si la lecture vous a fait bouger.",
      movedUpStart: "Votre réponse a bougé de",
      movedUpEnd:
        "après lecture. Non parce que quelqu'un a gagné — parce que vous avez vu ce que l'autre camp valorise réellement.",
      held:
        "Votre réponse n'a pas bougé. Comprendre ne signifie pas toujours changer d'avis — c'est savoir précisément où et pourquoi vous divergez.",
      movedDown: (delta: number) =>
        `Votre réponse a bougé de ${delta}. Cela arrive aussi — au moins, le désaccord est désormais précis au lieu de rester vague.`,
      note: "Ce chiffre reste dans votre navigateur. Il existe pour vous, pas pour nous.",
    },
    you: {
      eyebrow: "Votre carte",
      titleLine: "Ce que vous valorisez.",
      titleEm: "Qui vous comprenez.",
      lede:
        "Vos résultats de quiz, vos badges steelman et vos évolutions de perception — le tout stocké uniquement dans ce navigateur. Pas de compte, pas de traçage, pas de serveur. Effacer vos données de navigation efface cette page.",
      emptyTitle: "Rien ici pour l'instant.",
      emptyBody:
        "Ouvrez un débat, faites le quiz des valeurs d'une minute, tentez un test du steelman. Votre carte se construit d'elle-même.",
      emptyCta: "Commencer par un débat",
      previewLabel: "Ce que votre carte gardera",
      previewValues: "Les valeurs sur lesquelles vous vous appuyez, agrégées sur tous les débats que vous lisez.",
      previewBadges: "Un badge pour chaque camp que vous savez défendre aussi bien que ses propres soutiens.",
      previewDelta: "Si la lecture a déplacé votre regard sur les gens qui ne sont pas d'accord.",
      valuesTitle: "Votre profil de valeurs",
      valuesHint: "Agrégé à partir de tous les quiz que vous avez faits. Pas un verdict — un miroir.",
      debatesTitle: "Vos débats",
      closestPosition: "Votre position la plus proche :",
      quizNotTaken: "Quiz des valeurs pas encore fait",
      badgePassed: "Test du steelman réussi",
      badgeAttempt: (correct: number, total: number) =>
        `Meilleur essai : ${correct}/${total}`,
      badgeNotAttempted: "Test du steelman pas encore tenté",
      badgeLabel: "badges steelman",
      deltaUp: (delta: number) =>
        `Votre regard sur l'autre camp s'est adouci de +${delta} après lecture.`,
      deltaHeld: "Votre regard sur l'autre camp n'a pas bougé.",
      deltaDown: (delta: number) =>
        `Votre regard sur l'autre camp s'est durci de ${delta}.`,
      contributionsTitle: "Vos contributions",
      contributionsSummary: (drafted: number, accepted: number, rejected: number, pending: number) =>
        `${drafted} rédigée${drafted > 1 ? "s" : ""} · ${accepted} acceptée${accepted > 1 ? "s" : ""} · ${rejected} rejetée${rejected > 1 ? "s" : ""} · ${pending} en attente — `,
      reviewQueueLink: "voir la file de revue",
      reset: "Réinitialiser mon profil",
      resetConfirm: "Effacer votre profil local (résultats de quiz, badges, données de perception) ?",
    },
    palette: {
      home: "Accueil",
      allDebates: "Tous les débats",
      method: "Méthode — comment lire Parallax",
      review: "File de revue",
      you: "Votre profil — valeurs, badges",
      hintPage: "page",
      hintDebate: "débat",
      placeholder: "Aller à une page ou à un débat…",
      empty: "Aucun résultat.",
    },
    debate: {
      share: "Partager ⧉",
      debateLinkCopied: "Lien du débat copié — envoyez-le au cœur de la discussion",
      claimLinkCopied: "Lien vers cette affirmation copié",
      claimCopyTitle: "Copier le lien vers cette affirmation",
      smctaText: "Vous pensez comprendre cette position ? Prouvez-le — à vous-même.",
      smctaEarned: "Steelman ✓ obtenu",
      smctaButton: "Passer le test du steelman",
    },
  },
  positionSignal: {
    eyebrow: "Où se situent les lecteurs",
    beforeTitle: "Avant lecture — où vous situez-vous ?",
    afterTitle: "Maintenant que vous avez tout lu — où vous situez-vous ?",
    pickFirst:
      "Positionnez-vous d'abord. Ensuite on vous montre où chacun s'est situé — pas d'effet de foule.",
    undecided: "Ça dépend / indécis",
    cast: "Enregistrer ma position",
    casting: "Enregistrement…",
    revealTitle: "Où se sont situés les lecteurs",
    notLeaderboard:
      "Un paysage, pas un classement — ni gagnant, ni rang. Juste où se situent les gens.",
    priorityNote:
      "C'est une priorité, pas un fait. Vous indiquez la position que vous soutiendriez — pas si les preuves sont vraies.",
    youMark: "vous",
    pctBand: (lo: number, hi: number) => `~${lo}–${hi} %`,
    withheld: "Trop peu pour afficher",
    confidenceEmerging:
      "Émergent — trop peu de signaux pour en tirer quoi que ce soit.",
    confidenceForming: "En formation — une forme se dessine.",
    confidenceSettled:
      "Stabilisé — une répartition stable sur de nombreux lecteurs.",
    shiftTitle: "Ce qui a bougé",
    shiftLede:
      "Parmi les lecteurs ayant parcouru tout le débat, voici comment la répartition a évolué.",
    shiftDelta: (pts: number, letter: string) =>
      `${pts > 0 ? "+" : ""}${pts} pts vers ${letter}`,
    shiftYouMoved: "Vous vous êtes rapproché d'une autre position après lecture.",
    shiftYouHeld: "Vous avez maintenu votre position après lecture.",
    shiftDignity:
      "Se rapprocher, maintenir ou se conforter comptent à égalité. Bouger n'est pas gagner.",
    shiftEmpty:
      "Pas encore assez de lecteurs entrés-et-sortis pour montrer le mouvement.",
    change: "Changer ma réponse",
    privacy:
      "Seul le total anonyme est conservé. Votre choix reste dans ce navigateur et n'est jamais vendu.",
    demoNote:
      "Répartition de démonstration — données non réelles. Les vrais agrégats apparaissent dès que le signal a des lecteurs.",
    signedOutNote:
      "Connectez-vous pour enregistrer votre position (garde le décompte honnête, jamais lié à vous).",
  },
  claimEval: {
    stateLabel: {
      established: "Établie",
      contested: "Contestée",
      values: "Un choix de valeurs",
    },
    byReview: (date: string) => `relue le ${date}`,
    setState: "Consigner l'état :",
    savedToast: "Évaluation enregistrée — au registre de la bibliothèque",
    failedToast: "Impossible d'enregistrer — rôle relecteur requis",
    bridge: {
      status: {
        bridged_established: (n: number) =>
          `Établie — confirmée par recoupement entre ${n} camp${n === 1 ? "" : "s"} opposé${n === 1 ? "" : "s"}`,
        bridged_contested: (n: number) =>
          `Contestée — confirmée par recoupement entre ${n} camp${n === 1 ? "" : "s"} opposé${n === 1 ? "" : "s"}`,
        bridged_established_nocount: "Établie — confirmée par recoupement inter-camps",
        bridged_contested_nocount: "Contestée — confirmée par recoupement inter-camps",
        bridged_conflicting:
          "Les camps sont arrivés à des conclusions inter-camps différentes — non résolu",
        pending_single_camp:
          "En attente — un seul camp l'a approuvée pour l'instant",
        insufficient: "Pas encore de verdict inter-camps",
      },
      explainer:
        "Confirmée seulement quand des relecteurs de positions opposées s'accordent — pas à la majorité, pas par un seul relecteur. Un seul camp, quelle que soit sa taille, ne peut pas confirmer.",
      scopeNote:
        "Ceci mesure l'accord inter-camps sur l'état de l'affirmation uniquement — pas un verdict de fiabilité complet (la distinction intégrité/pertinence et les jurys tournants ne sont pas encore en vigueur).",
      demo: "démo",
      endorse: "Approuver cet état :",
      endorsed: (state: string) => `Vous avez approuvé : ${state}`,
      endorseSaved: "Approbation enregistrée — ne compte qu'entre camps distincts",
      endorseFailed: "Enregistrement impossible — rôle relecteur requis",
      yourCamp: (camp: string) => `Votre position : ${camp}`,
      yourCampHint:
        "Vous seul voyez votre position. Elle n'est jamais rendue publique ni montrée aux autres relecteurs.",
      camp: {
        prompt: "Avant d'approuver, déclarez votre position sur ce débat.",
        why: "Votre position est enregistrée une fois pour ce débat et n'est jamais affichée publiquement. Elle permet de mesurer l'accord entre camps — pour qu'un seul camp ne puisse pas confirmer seul.",
        pick: (letter: string, title: string) => `Position ${letter} — ${title}`,
        undecided: "Indécis·e / ça dépend",
        confirm: "Définir ma position",
        saved: "Position enregistrée pour ce débat",
        failed: "Enregistrement impossible — rôle relecteur requis",
        lockHint:
          "Enregistrée une fois pour ce débat. La modifier recompte vos approbations sous le nouveau camp.",
      },
    },
  },
  sourceFloor: {
    legendEyebrow: "Intégrité de la source",
    verdicts: {
      meets_floor: "passe le seuil pour cet usage",
      attribution_required: "à attribuer pour cet usage",
      context_required: "demande du contexte pour cet usage",
      below_floor: "sous le seuil pour cet usage",
    } as Record<string, string>,
    verdictHint: {
      meets_floor:
        "Aucune règle de seuil ne s’est déclenchée pour cette source sur cette affirmation. Pas une caution, pas « fiable », pas « vrai ».",
      attribution_required:
        "Utilisable ici uniquement comme point de vue attribué, pas comme autorité factuelle autonome.",
      context_required:
        "Un attribut matériel (sponsorisé / IA / conflit non divulgué / domaine à seuil élevé) doit être divulgué avant de s’y fier ici.",
      below_floor:
        "Une règle l’a jugée structurellement inadéquate pour CET usage. Rétrogradée et étiquetée — conservée au dossier, jamais supprimée. Pas « faux », pas « mauvais dans l’abstrait ».",
    } as Record<string, string>,
    rules: {
      ugc_controversial_factual:
        "Un contenu non vérifié d’utilisateur n’est pas une source valable pour une affirmation factuelle contestée.",
      no_editorial_accountability:
        "Aucune responsabilité éditoriale identifiable ni politique de correction — présomption négative.",
      opinion_attribution:
        "Opinion ou analyse — utilisable comme point de vue attribué, pas comme autorité factuelle.",
      conflict_context:
        "Un conflit, un financement, un contenu sponsorisé ou généré par IA doit être divulgué avant de s’y fier ici.",
      high_bar_domain:
        "Les affirmations de santé, droit, finance ou sur des personnes vivantes exigent un seuil de source plus élevé.",
      documented_fabrication:
        "Fabrication documentée au dossier (preuve externe) — visibilité restreinte, conservée au dossier.",
      no_floor_rule:
        "Aucune règle de seuil ne s’est déclenchée pour cette source sur cette affirmation.",
    } as Record<string, string>,
    attrValues: {
      content_genre: {
        primary: "primaire / données",
        reporting: "reportage",
        analysis: "analyse",
        opinion: "opinion",
        sponsored: "sponsorisé",
        ugc: "contenu d’utilisateur",
        ai_generated: "généré par IA",
        unknown: "inconnu",
      },
      editorial_accountability: {
        named_masthead: "ours nommé",
        named_author: "auteur nommé",
        org_only: "organisation seule",
        anonymous: "anonyme",
        none: "aucune",
        unknown: "inconnue",
      },
      correction_policy: {
        documented: "documentée",
        informal: "informelle",
        none: "aucune",
        unknown: "inconnue",
      },
      independence: {
        independent: "indépendant",
        funded_disclosed: "financé (divulgué)",
        funded_undisclosed: "financé (non divulgué)",
        self_interested: "intéressé",
        unknown: "inconnue",
      },
      fabrication_record: {
        none_known: "aucun connu",
        corrected_history: "corrections au dossier",
        retraction_history: "rétractations au dossier",
        documented_fabrication: "fabrication documentée",
      },
      expertise_basis: {
        peer_reviewed: "évalué par les pairs",
        domain_expert: "expert du domaine",
        journalistic: "journalistique",
        lay: "profane",
        none: "aucune",
        unknown: "inconnue",
      },
      identity_basis: {
        verified: "vérifiée",
        pseudonymous: "pseudonyme",
        unverified: "non vérifiée",
        unknown: "inconnue",
      },
      sensitive_domain: {
        none: "—",
        health: "santé",
        law: "droit",
        finance: "finance",
        living_persons: "personnes vivantes",
      },
    } as Record<string, Record<string, string>>,
    drivenBy: (drivers: string) => `déterminé par ${drivers}`,
    demo: "démo",
    vsRelevance:
      "Deux questions distinctes. Le label de preuve demande : cette source appuie-t-elle CETTE affirmation ? L’intégrité demande : est-ce une source crédible en soi, selon des règles fixes ? On ne les confond jamais.",
    notTruth:
      "C’est un contrôle de règles sur l’intégrité, pas un verdict de vérité. La v1 garantit des règles mécaniques identiques pour chaque source — la controverse et le domaine à seuil élevé proviennent de signaux inter-camps, pas du seul avis d’un relecteur. Une source n’est jamais « fiable » dans l’abstrait ; le seuil est toujours rapporté à un usage.",
    libraryReuse:
      "Une évaluation suit la source, pas le débat — évaluez une source une fois, et le seuil se re-rapporte à chaque usage où elle est citée.",
    assess: {
      title: "Évaluer cette source (seuil d’intégrité)",
      hint: "Déclarez les attributs mécaniques de la source et toute preuve externe. Le verdict est calculé par les règles, par affirmation — vous ne le fixez pas.",
      proofLabel:
        "Preuve externe (pour le sous-seuil fabrication / sans responsabilité)",
      save: "Enregistrer les attributs",
      saved:
        "Source évaluée — les règles calculent le verdict par affirmation, au dossier de la bibliothèque",
      failed: "Enregistrement impossible — rôle de relecteur requis",
      verdictReadonly: "Verdict (calculé par les règles) :",
    },
  },
} satisfies Messages;
