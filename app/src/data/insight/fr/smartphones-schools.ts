import type { DebateInsight } from "../index";

/**
 * Traduction française du contenu insight "smartphones à l'école".
 * Les ids, position_ids, value_ids et drapeaux `correct` sont strictement
 * identiques à la version anglaise — seul le texte est localisé.
 */

const insight: DebateInsight = {
  topic_id: "topic_smartphones_schools",

  tradeoffs: [
    {
      id: "q1",
      prompt:
        "En plein cours, un téléphone vibre en silence dans la poche d'un élève. Personne d'autre ne le remarque. Quel est le vrai problème ?",
      a: {
        text: "Que le téléphone ait été dans la salle tout court — même silencieux, un appareil fait concurrence au cours",
        value_ids: ["val_attention"],
      },
      b: {
        text: "Rien pour l'instant — apprendre à l'ignorer est précisément la compétence que l'école doit construire",
        value_ids: ["val_autonomy"],
      },
    },
    {
      id: "q2",
      prompt:
        "L'entraînement a été déplacé et l'heure de sortie a changé — un parent doit prévenir son enfant avant la dernière sonnerie. Par où ce message doit-il passer ?",
      a: {
        text: "Directement dans la poche de l'élève — une famille ne devrait pas avoir besoin de permission pour joindre son propre enfant",
        value_ids: ["val_reachability"],
      },
      b: {
        text: "Par le secrétariat, comme avant les téléphones — le temps de classe reste sanctuarisé pour tout le monde",
        value_ids: ["val_attention", "val_equity"],
      },
    },
    {
      id: "q3",
      prompt:
        "La recherche suggère que les interdictions de téléphone améliorent surtout les résultats des élèves déjà en difficulté. Une école devrait…",
      a: {
        text: "Adopter une règle unique pour tous — les élèves qui ont le moins de marge en profitent le plus",
        value_ids: ["val_equity"],
      },
      b: {
        text: "Aider ces élèves directement — sans retirer un outil à tout le monde pour y parvenir",
        value_ids: ["val_autonomy"],
      },
    },
    {
      id: "q4",
      prompt:
        "Votre école dispose d'une seule journée de formation pour sa nouvelle politique sur les téléphones. La consacrer à…",
      a: {
        text: "Une routine d'application unique, que chaque enseignant applique de la même façon, sans exception",
        value_ids: ["val_equity"],
      },
      b: {
        text: "Apprendre aux élèves comment le design des notifications agit sur eux — et comment y résister",
        value_ids: ["val_autonomy"],
      },
    },
    {
      id: "q5",
      prompt: "Une journée d'école sans aucun téléphone, c'est avant tout…",
      a: {
        text: "Six heures où rien ne vibre et où les cours ont l'esprit des élèves en entier",
        value_ids: ["val_attention"],
      },
      b: {
        text: "Six heures pendant lesquelles les familles et leurs enfants ne peuvent pas se joindre directement",
        value_ids: ["val_reachability"],
      },
    },
  ],

  voices: [
    {
      id: "v_a1",
      position_id: "pos_a",
      name: "Margaret, 51 ans",
      detail: "professeure de maths, 23 ans de métier",
      text: "Je sais à la seconde près quand un téléphone vibre dans un sac — le regard d'un élève part ailleurs et embarque deux voisins avec lui. L'année où on est passés sans téléphone, j'ai arrêté de réexpliquer trois fois les mêmes cinq minutes. J'ai récupéré ma classe sans élever la voix.",
    },
    {
      id: "v_a2",
      position_id: "pos_a",
      name: "Priya, 44 ans",
      detail: "mère de deux ados",
      text: "J'ai signé la pétition contre l'interdiction — je voulais une ligne directe avec mes enfants. Puis l'école de mon fils est passée sans téléphone, la conversation est revenue à table, et il a arrêté de dormir un œil sur ses notifications. Je m'étais trompée sur ce qui comptait le plus.",
    },
    {
      id: "v_b1",
      position_id: "pos_b",
      name: "Naomi, 39 ans",
      detail: "mère célibataire, travaille en horaires postés à l'hôpital",
      text: "Mon planning change la veille au soir. Quand l'heure de sortie bouge, j'écris à ma fille entre deux patients — le secrétariat met une heure à transmettre un message, quand quelqu'un répond. Une interdiction ne la protège pas davantage ; elle coupe juste le fil entre nous.",
    },
    {
      id: "v_b2",
      position_id: "pos_b",
      name: "Mateo, 16 ans",
      detail: "élève de seconde, arrivé ici il y a deux ans",
      text: "Mon téléphone, c'est le dictionnaire avec lequel je lis mes devoirs de chimie et le seul endroit où vit la voix de ma grand-mère. Enfermez-le dans une pochette et vous n'aurez pas plus de mon attention — vous m'aurez assis là, perdu. Apprenez-moi plutôt quand le poser.",
    },
    {
      id: "v_c1",
      position_id: "pos_c",
      name: "Aisha, 33 ans",
      detail: "professeure d'anglais et professeure principale",
      text: "Dans mes cours, les téléphones vont dans la boîte près de la porte, sans débat, et la salle est à moi. Mais j'ai aussi séparé les bagarres de confiscation que provoque une interdiction du portail au portail. Protégez le cours fermement et laissez le couloir tranquille — c'est la règle que les élèves respectent vraiment.",
    },
    {
      id: "v_c2",
      position_id: "pos_c",
      name: "Robert, 58 ans",
      detail: "principal adjoint, auteur de la politique téléphone de son établissement",
      text: "On a tenu l'interdiction de la première à la dernière sonnerie pendant un an, et mon équipe passait les récréations à fouiller des sacs pendant que les téléphones migraient vers les toilettes. Maintenant ils sont éteints en cours et vivants à la récré, et le jeu du chat et de la souris a presque cessé. Les élèves tiennent une règle qu'ils jugent juste.",
    },
  ],

  steelman: [
    {
      id: "sm_a1",
      position_id: "pos_a",
      prompt: "Quelle phrase un soutien de cette position approuverait-il ?",
      options: [
        {
          text: "Les téléphones sont conçus pour détourner l'attention de l'apprentissage, et une règle claire, de la première à la dernière sonnerie, la protège mieux — et plus équitablement — que des centaines de petites négociations.",
          correct: true,
        },
        {
          text: "Les smartphones détruisent une génération, l'école doit donc en protéger les enfants partout, y compris à la maison.",
        },
        {
          text: "Il faut interdire les téléphones surtout parce qu'il est prouvé que les réseaux sociaux nuisent à la santé mentale des adolescents.",
        },
      ],
      explain:
        "La position A est un argument sur l'attention rare en classe et une application égale pour tous, et elle s'arrête au portail de l'école. Elle tient explicitement les preuves sur la santé mentale pour contestées : le bien-être n'est pas le cœur de son dossier.",
    },
    {
      id: "sm_a2",
      position_id: "pos_a",
      prompt: "Qu'est-ce que cette position accepte comme coût réel de son propre choix ?",
      options: [
        {
          text: "Les familles perdent leur ligne directe pendant la journée, et le personnel hérite d'un vrai travail de surveillance du portail au portail.",
          correct: true,
        },
        { text: "Rien — une fois les téléphones partis, le problème est tout simplement réglé." },
        {
          text: "Que les résultats vont probablement baisser le temps que les élèves s'adaptent à la nouvelle règle.",
        },
      ],
      explain:
        "Un partisan sérieux de l'interdiction en connaît le prix : un contact familial coupé et une charge de surveillance quotidienne, avec le risque que l'usage passe simplement hors de vue. Les preuves qu'il cite indiquent des gains de résultats, pas une baisse.",
    },
    {
      id: "sm_b1",
      position_id: "pos_b",
      prompt: "Quelle phrase un soutien de cette position approuverait-il ?",
      options: [
        {
          text: "L'école est l'endroit où les élèves doivent apprendre un usage délibéré du téléphone — et les preuves les plus directes montrent que les interdictions n'améliorent pas le bien-être et ne réduisent pas l'usage global, puisque l'essentiel se passe hors de l'école.",
          correct: true,
        },
        {
          text: "Les élèves ont droit à leur téléphone, et les adultes devraient cesser toute tentative de limiter le temps d'écran.",
        },
        {
          text: "Les téléphones ne distraient pas vraiment en classe, une interdiction n'a donc rien à corriger.",
        },
      ],
      explain:
        "La position B ne nie pas la distraction — son propre compromis admet qu'un téléphone reste à portée de main. Elle affirme que les interdictions ne tiennent pas leurs promesses de bien-être et que l'autorégulation doit bien s'apprendre quelque part.",
    },
    {
      id: "sm_b2",
      position_id: "pos_b",
      prompt: "Qu'est-ce que cette position accepte comme coût réel de son propre choix ?",
      options: [
        {
          text: "Une distraction documentée reste à portée de main pendant les cours, et les enseignants doivent faire respecter de la nuance plutôt qu'une ligne nette.",
          correct: true,
        },
        { text: "Rien — faire confiance aux élèves n'a aucun inconvénient." },
        {
          text: "Que les parents perdent leur ligne directe avec leurs enfants pendant la journée d'école.",
        },
      ],
      explain:
        "Garder les téléphones à l'école, c'est vivre avec les preuves de distraction plutôt que les contester — et si le volet pédagogique est faible, l'usage encadré peut s'effondrer en absence totale de règles. La ligne familiale coupée est le coût de l'interdiction, pas celui de cette position.",
    },
    {
      id: "sm_c1",
      position_id: "pos_c",
      prompt: "Quelle phrase un soutien de cette position approuverait-il ?",
      options: [
        {
          text: "Les preuves sont solides exactement là où ça compte — le temps de cours — et bien plus faibles pour les interdictions toute la journée : rangez donc les téléphones pendant les cours et laissez les pauses tranquilles.",
          correct: true,
        },
        {
          text: "Couper la poire en deux entre deux camps est toujours la politique la plus sûre, quoi que disent les preuves.",
        },
        {
          text: "Chaque enseignant devrait décider pour sa propre classe si les téléphones sont autorisés ce jour-là.",
        },
      ],
      explain:
        "La position C suit une asymétrie dans les preuves, pas un goût du compromis — et elle exige une règle nette, appliquée de façon constante, à l'opposé de la libre appréciation enseignant par enseignant.",
    },
    {
      id: "sm_c2",
      position_id: "pos_c",
      prompt: "Qu'est-ce que cette position accepte comme coût réel de son propre choix ?",
      options: [
        {
          text: "Une règle conditionnelle est plus difficile à faire respecter qu'une interdiction générale, et chaque sonnerie devient une invitation à tester la limite.",
          correct: true,
        },
        { text: "Rien — une règle équilibrée n'a, par définition, aucun coût." },
        {
          text: "Elle concède que la distraction pendant les cours continuera, inchangée.",
        },
      ],
      explain:
        "La voie médiane achète la joignabilité et l'apprentissage des habitudes au prix d'une frontière plus floue : l'usage entre les cours peut déborder en classe, sans offrir ni la concentration d'une interdiction ni l'autonomie de l'usage encadré. Protéger les cours est précisément la seule chose qu'elle prétend faire.",
    },
  ],
};

export default insight;
