import type { DebateInsight } from "../index";

/**
 * Traduction française du contenu insight "énergie nucléaire".
 * Les ids, position_ids, value_ids et drapeaux `correct` sont strictement
 * identiques à la version anglaise — seul le texte est localisé.
 */

const insight: DebateInsight = {
  topic_id: "topic_nuclear_power",

  tradeoffs: [
    {
      id: "q1",
      prompt:
        "Les planificateurs du réseau modélisent une semaine d'hiver sans vent et couverte, avec chauffage et transports entièrement électriques. Qu'est-ce qui maintient la lumière allumée ?",
      a: {
        text: "Des centrales pilotables qui tournent quelle que soit la météo, même au prix d'un surcoût",
        value_ids: ["val_reliability"],
      },
      b: {
        text: "Stockage, interconnexions et demande flexible — moins chers aujourd'hui et en progrès rapide",
        value_ids: ["val_cost"],
      },
    },
    {
      id: "q2",
      prompt:
        "Un réacteur de 40 ans a besoin d'une rénovation à un milliard pour fonctionner vingt ans de plus. La même somme pourrait construire une grande ferme solaire.",
      a: {
        text: "Rénover — une production pilotable bas-carbone éprouvée, sans le risque de calendrier d'une construction neuve",
        value_ids: ["val_climate", "val_reliability"],
      },
      b: {
        text: "Construire la ferme solaire — mettre chaque euro là où il réduit le plus de carbone, le plus tôt",
        value_ids: ["val_cost"],
      },
    },
    {
      id: "q3",
      prompt:
        "De nouveaux réacteurs pourraient remplacer le charbon dès cette décennie, mais aucun pays n'exploite encore de site de stockage définitif pour leurs déchets.",
      a: {
        text: "Construire maintenant — les dégâts climatiques s'accumulent chaque jour ; les déchets sont peu volumineux, confinés et gérables",
        value_ids: ["val_climate"],
      },
      b: {
        text: "Pas avant d'avoir résolu le stockage — on ne lègue pas un fardeau de 100 000 ans à des gens qui n'ont jamais voté pour",
        value_ids: ["val_stewardship"],
      },
    },
    {
      id: "q4",
      prompt:
        "Un pays dépendant du charbon veut acheter votre technologie de réacteur. L'accord réduirait les émissions mais diffuserait l'expertise du cycle du combustible.",
      a: {
        text: "Vendre — chaque centrale à charbon remplacée épargne des vies et du carbone, dès maintenant",
        value_ids: ["val_climate"],
      },
      b: {
        text: "Refuser — le risque de prolifération survivra à tout bénéfice d'émissions que l'accord peut apporter",
        value_ids: ["val_stewardship"],
      },
    },
    {
      id: "q5",
      prompt:
        "Un chantier phare a cinq ans de retard et un budget doublé, à soixante-dix pour cent d'avancement. Le prochain vote de financement vous revient.",
      a: {
        text: "Le terminer — des décennies d'électricité pilotable bas-carbone attendent encore de l'autre côté du dérapage",
        value_ids: ["val_reliability"],
      },
      b: {
        text: "Arrêter les frais — rediriger le capital restant vers l'éolien, le solaire et le stockage qui se déploient dès maintenant",
        value_ids: ["val_cost"],
      },
    },
  ],

  voices: [
    {
      id: "v_a1",
      position_id: "pos_a",
      name: "Elena, 45 ans",
      detail: "opératrice en salle de commande d'une centrale nucléaire, 19 ans de quarts",
      text: "J'étais en salle de commande pendant deux semaines de brouillard en janvier, quand les cartes de vent sont tombées à plat et qu'on a porté la région. Personne ne nous applaudit, mais le réseau s'est appuyé sur cette centrale chacune de ces nuits-là. On ne décarbone pas les hivers avec de l'espoir.",
    },
    {
      id: "v_a2",
      position_id: "pos_a",
      name: "Ingrid, 57 ans",
      detail: "militante écologiste de toujours",
      text: "J'ai défilé contre les réacteurs dans les années quatre-vingt — j'ai encore la banderole. Puis j'ai fait le calcul de ce qui a remplacé les centrales qu'on a fermées, et pendant des années la réponse a été le charbon. Le climat ne nous note pas sur les intentions ; il compte les tonnes.",
    },
    {
      id: "v_b1",
      position_id: "pos_b",
      name: "Dele, 36 ans",
      detail: "développeur de fermes solaires",
      text: "Il y a huit ans, chaque projet que je chiffrais avait besoin d'une subvention ; aujourd'hui on gagne les enchères sans aide et on raccorde en dix-huit mois. Le réacteur annoncé quand j'ai commencé ma carrière n'a toujours pas coulé son dernier béton. Je construis plus vite qu'ils ne révisent leurs calendriers.",
    },
    {
      id: "v_b2",
      position_id: "pos_b",
      name: "Carol, 62 ans",
      detail: "institutrice à la retraite, sa facture finance un réacteur en retard",
      text: "Il y a une ligne sur ma facture d'électricité pour une centrale qui a sept ans de retard et n'est toujours pas finie. Je la paie depuis avant la naissance de mon petit-fils, et ce même argent aurait pu mettre des panneaux sur la moitié de la ville. Redites-moi en quoi c'est le choix prudent.",
    },
    {
      id: "v_c1",
      position_id: "pos_c",
      name: "Janek, 49 ans",
      detail: "ingénieur de maintenance dans une centrale de 40 ans",
      text: "J'inspecte les soudures d'un réacteur plus vieux que moi, et il passe tous les tests qu'on lui impose. Quand une centrale comme la nôtre, deux régions plus loin, a fermé prématurément, une unité au charbon est sortie de sa retraite pour combler le trou. Gardons ce qui tourne et qui est sain — cette partie-là est simple.",
    },
    {
      id: "v_c2",
      position_id: "pos_c",
      name: "Fatima, 41 ans",
      detail: "planificatrice de réseau chez un énergéticien",
      text: "Prolonger nos deux unités existantes a coûté moins cher que n'importe quelle centrale neuve, de n'importe quel type — j'ai signé ce dossier avec plaisir. Le projet neuf sur mon bureau est au triple du prix, avec une décennie de risque de calendrier, et je dois aux usagers la même rigueur. Chaque projet doit mériter son propre oui.",
    },
  ],

  steelman: [
    {
      id: "sm_a1",
      position_id: "pos_a",
      prompt: "Quelle phrase un soutien de cette position approuverait-il ?",
      options: [
        {
          text: "La décarbonation profonde exige une électricité pilotable bas-carbone pendant les semaines sans vent et les hivers sombres, et le nucléaire la fournit sûrement et à grande échelle — les dérapages récents sont des problèmes industriels, pas des limites physiques.",
          correct: true,
        },
        {
          text: "L'éolien et le solaire sont surestimés — le nucléaire devrait porter le réseau à lui seul.",
        },
        {
          text: "Le nucléaire est assez sûr pour qu'on assouplisse la réglementation afin d'accélérer la construction.",
        },
      ],
      explain:
        "La position A tient les renouvelables pour des partenaires essentiels, pas des rivaux — elle affirme que les réseaux ont aussi besoin de puissance pilotable, et que le bilan de coûts du nucléaire reflète des problèmes de filière corrigeables. Elle s'appuie sur le bilan de sûreté, elle ne s'attaque pas aux règles de sûreté.",
    },
    {
      id: "sm_a2",
      position_id: "pos_a",
      prompt: "Qu'est-ce que cette position accepte comme coût réel de son propre choix ?",
      options: [
        {
          text: "Un capital initial élevé, des délais de construction longs, des déchets à vie longue — et le risque que les dérapages absorbent un argent que des options plus rapides auraient mieux employé.",
          correct: true,
        },
        {
          text: "Rien — une fois la centrale en service, les bénéfices climatiques effacent tous les coûts.",
        },
        {
          text: "Que le nucléaire est, au fond, plus dangereux que les énergies fossiles qu'il remplace.",
        },
      ],
      explain:
        "Le pari de la position A est cher et lent, de son propre aveu ; elle affirme que le gain en puissance pilotable justifie ce prix. Elle ne concède aucun déficit de sûreté — les données par unité d'énergie pointent dans l'autre sens.",
    },
    {
      id: "sm_b1",
      position_id: "pos_b",
      prompt: "Quelle phrase un soutien de cette position approuverait-il ?",
      options: [
        {
          text: "La politique climatique est une course qui se mesure en euros et en années, et le nucléaire neuf perd sur les deux tableaux — un capital immobilisé dans des chantiers lents est un capital qui ne réduit pas les émissions plus tôt.",
          correct: true,
        },
        {
          text: "Les réacteurs sont tout simplement trop dangereux à exploiter, quel que soit leur coût.",
        },
        {
          text: "La décarbonation peut se permettre d'attendre que le stockage devienne assez bon marché.",
        },
      ],
      explain:
        "La position B est un argument de coût et de vitesse, pas une peur des réacteurs. Elle veut une décarbonation plus rapide — c'est précisément pourquoi elle s'oppose aux chantiers lents et hors budget.",
    },
    {
      id: "sm_b2",
      position_id: "pos_b",
      prompt: "Qu'est-ce que cette position accepte comme coût réel de son propre choix ?",
      options: [
        {
          text: "Renoncer à une capacité pilotable bas-carbone — et si le stockage et la flexibilité passent à l'échelle moins vite qu'espéré, la décarbonation pourrait caler à de hautes parts de renouvelables.",
          correct: true,
        },
        {
          text: "Rien — les renouvelables bon marché ont relégué les compromis énergétiques au passé.",
        },
        {
          text: "Que les centrales à charbon doivent rester ouvertes indéfiniment pour secourir le réseau.",
        },
      ],
      explain:
        "Parier sur les renouvelables plus le stockage, c'est assumer les derniers kilomètres, les plus durs, de la fiabilité du réseau. La position B accepte ce pari — elle n'accepte pas un secours fossile permanent, qui ruinerait tout son propos.",
    },
    {
      id: "sm_c1",
      position_id: "pos_c",
      prompt: "Quelle phrase un soutien de cette position approuverait-il ?",
      options: [
        {
          text: "Défendre les réacteurs que nous avons déjà — l'électricité pilotable bas-carbone la moins chère disponible — et juger chaque projet neuf sur ses propres coûts, son calendrier et ses risques.",
          correct: true,
        },
        {
          text: "Aucun réacteur neuf ne devrait jamais être approuvé, en aucune circonstance.",
        },
        {
          text: "Les vieilles centrales devraient tourner indéfiniment, quoi que trouvent leurs inspections.",
        },
      ],
      explain:
        "La position C est asymétrique, pas antinucléaire : défense vigoureuse des centrales existantes, examen au cas par cas des nouvelles. Elle défend les réacteurs sains, pas les réacteurs sans condition.",
    },
    {
      id: "sm_c2",
      position_id: "pos_c",
      prompt: "Qu'est-ce que cette position accepte comme coût réel de son propre choix ?",
      options: [
        {
          text: "Aucun signal industriel clair — la filière et les compétences continuent de décliner, et l'ambivalence au cas par cas peut devenir une sortie du nucléaire par défaut.",
          correct: true,
        },
        {
          text: "Rien — garder ses options ouvertes est gratuit par définition.",
        },
        {
          text: "Que le déploiement des renouvelables doive ralentir pour protéger le parc existant.",
        },
      ],
      explain:
        "Attendre a son propre prix. Sans carnet de commandes régulier, la base industrielle s'érode, et le « peut-être plus tard » peut durcir en silence jusqu'au « jamais » — la position C porte ce risque en connaissance de cause.",
    },
  ],
};

export default insight;
