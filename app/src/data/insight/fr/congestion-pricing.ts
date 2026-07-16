import type { DebateInsight } from "../index";

/**
 * Traduction française du contenu insight "congestion pricing".
 * Les ids, position_ids, value_ids et drapeaux `correct` sont strictement
 * identiques à la version anglaise — seul le texte est localisé.
 */

const insight: DebateInsight = {
  topic_id: "topic_congestion_pricing",

  tradeoffs: [
    {
      id: "q1",
      prompt:
        "Une voie de circulation, saturée chaque matin. À qui doit-elle revenir ?",
      a: {
        text: "À qui accorde le plus de valeur au trajet — même s'il faut faire payer l'accès",
        value_ids: ["val_mobility"],
      },
      b: {
        text: "À tout le monde également, premier arrivé premier servi — la route est publique",
        value_ids: ["val_fairness"],
      },
    },
    {
      id: "q2",
      prompt:
        "Un péage finance de meilleurs transports en commun, mais pèse sur les travailleurs qui n'ont pas de véritable alternative à la voiture.",
      a: {
        text: "Compenser d'abord ces travailleurs, même si la mesure y perd en efficacité",
        value_ids: ["val_fairness"],
      },
      b: {
        text: "Maximiser d'abord le bénéfice collectif — les correctifs ciblés viendront ensuite",
        value_ids: ["val_mobility"],
      },
    },
    {
      id: "q3",
      prompt: "Pour réduire la pollution de l'air en centre-ville…",
      a: {
        text: "Agir maintenant avec des incitations fortes, même imparfaites",
        value_ids: ["val_environment"],
      },
      b: {
        text: "N'agir qu'une fois l'équité de la mesure démontrée",
        value_ids: ["val_fairness", "val_trust"],
      },
    },
    {
      id: "q4",
      prompt:
        "La mairie publie des résultats élogieux sur son propre programme de péage.",
      a: {
        text: "Tant mieux — la mesure fonctionne, continuons",
        value_ids: ["val_mobility", "val_environment"],
      },
      b: {
        text: "Audit indépendant avant toute extension",
        value_ids: ["val_trust"],
      },
    },
    {
      id: "q5",
      prompt: "Moins de voitures en centre-ville, c'est avant tout…",
      a: {
        text: "Un air respirable et des rues où l'on peut vivre",
        value_ids: ["val_environment"],
      },
      b: {
        text: "Le risque d'exclure par le prix ceux qui n'ont pas d'autre option",
        value_ids: ["val_fairness"],
      },
    },
    {
      id: "q6",
      prompt:
        "Une route publique que vous avez déjà payée par vos impôts fait désormais payer un droit d'entrée quotidien.",
      a: {
        text: "C'est légitime — un prix, c'est ainsi qu'on rationne un espace que tout le monde veut en même temps",
        value_ids: ["val_mobility"],
      },
      b: {
        text: "Ce n'est pas juste — l'accès libre aux routes publiques ne devrait pas se payer deux fois",
        value_ids: ["val_access"],
      },
    },
  ],

  voices: [
    {
      id: "v_a1",
      position_id: "pos_a",
      name: "Amara, 34 ans",
      detail: "infirmière, fait le trajet en bus",
      text: "Mon bus rampait pendant quarante minutes derrière des voitures avec une seule personne à bord. Depuis la zone, je récupère ce temps tous les jours. Aucun automobiliste n'a jamais compté mon temps comme un coût.",
    },
    {
      id: "v_a2",
      position_id: "pos_a",
      name: "Tomás, 41 ans",
      detail: "commerçant dans la zone",
      text: "J'étais contre — j'ai signé la pétition. Puis les livraisons se sont mises à arriver à l'heure. Je paie le péage deux jours par semaine, et ce que je récupère, c'est une ville prévisible.",
    },
    {
      id: "v_b1",
      position_id: "pos_b",
      name: "Karim, 52 ans",
      detail: "manutentionnaire de nuit en entrepôt",
      text: "Mon service finit à deux heures du matin. Il n'y a pas de bus à deux heures du matin. Le péage ne change pas mon comportement — il prend juste mon argent. Les gens comme moi sont l'erreur d'arrondi de ces plans.",
    },
    {
      id: "v_b2",
      position_id: "pos_b",
      name: "Denise, 47 ans",
      detail: "aide à domicile, roule d'un patient à l'autre",
      text: "Mes patients vivent dans trois banlieues différentes. Je ne peux pas « changer de mode de transport » entre deux visites. Chaque rapport qui affirme que « les automobilistes s'adapteront » a été écrit par quelqu'un qui n'a jamais fait ma tournée.",
    },
    {
      id: "v_c1",
      position_id: "pos_c",
      name: "Lucía, 29 ans",
      detail: "urbaniste",
      text: "Je crois au péage — techniquement, ça tient. J'ai aussi vu ma propre ville le rater, avec des recettes opaques et zéro contrôle. Concevez-le avec des remboursements et des audits indépendants, ou ne le faites pas du tout.",
    },
    {
      id: "v_c2",
      position_id: "pos_c",
      name: "Sam, 63 ans",
      detail: "conducteur de bus à la retraite",
      text: "Les bus avancent quand les voitures arrêtent de les bloquer — je l'ai vu depuis mon siège de conducteur pendant trente ans. Mais faites payer équitablement : exonérez les travailleurs qui n'ont vraiment pas encore d'alternative, et publiez où va chaque euro.",
    },
  ],

  steelman: [
    {
      id: "sm_a1",
      position_id: "pos_a",
      prompt: "Quelle phrase un soutien de cette position approuverait-il ?",
      options: [
        {
          text: "L'espace routier est rare et sous-tarifé ; le tarifer fait mieux fonctionner toute la ville — et les objections d'équité sont des problèmes de conception, pas des motifs de rejet.",
          correct: true,
        },
        { text: "Les automobilistes sont égoïstes et méritent de payer pour les dégâts qu'ils causent." },
        { text: "Les voitures devraient à terme être totalement bannies des centres-villes." },
      ],
      explain:
        "La position A est un argument d'efficacité sur un espace public rare, pas un jugement moral sur les automobilistes. Elle tient les enjeux d'équité pour réels, mais solubles par la conception.",
    },
    {
      id: "sm_a2",
      position_id: "pos_a",
      prompt: "Qu'est-ce que cette position accepte comme coût réel de son propre choix ?",
      options: [
        {
          text: "Certains automobilistes paient plus, l'administration se complexifie, et la bataille politique est rude.",
          correct: true,
        },
        { text: "Rien — un péage bien conçu n'a aucun inconvénient." },
        { text: "Que la congestion va probablement empirer avant de s'améliorer." },
      ],
      explain:
        "Une position sérieuse connaît son propre prix. La position A assume ouvertement les frais directs, la complexité et la résistance politique comme prix des gains.",
    },
    {
      id: "sm_b1",
      position_id: "pos_b",
      prompt: "Quelle phrase un soutien de cette position approuverait-il ?",
      options: [
        {
          text: "La question n'est pas de savoir si le péage réduit le trafic — la question est de savoir qui porte la charge, et elle retombe sur ceux qui peuvent le moins s'adapter.",
          correct: true,
        },
        { text: "La congestion routière n'est pas vraiment un problème." },
        { text: "Les transports en commun ne servent à rien, les financer est donc inutile." },
      ],
      explain:
        "La position B concède généralement que le péage peut réduire la congestion. Son affirmation centrale est distributive : l'efficacité ne prouve pas que les charges sont équitablement réparties.",
    },
    {
      id: "sm_b2",
      position_id: "pos_b",
      prompt: "Qu'est-ce que cette position accepte comme coût réel de son propre choix ?",
      options: [
        {
          text: "La congestion demeure, et les transports en commun risquent de rester sous-financés.",
          correct: true,
        },
        { text: "Elle accepte à la place des impôts plus élevés pour tout le monde." },
        { text: "Rien — rejeter le péage n'a aucun inconvénient." },
      ],
      explain:
        "Rejeter l'outil, c'est garder le problème. La position B accepte la congestion persistante et un financement des transports affaibli comme prix de la protection des conducteurs contraints.",
    },
    {
      id: "sm_c1",
      position_id: "pos_c",
      prompt: "Quelle phrase un soutien de cette position approuverait-il ?",
      options: [
        {
          text: "Le péage peut se justifier — mais seulement si remboursements, usage transparent des recettes et contrôle indépendant sont intégrés dès le premier jour.",
          correct: true,
        },
        { text: "N'importe quel péage de congestion est acceptable du moment qu'il réduit le trafic." },
        { text: "Le discours sur l'équité n'est qu'un prétexte pour bloquer une bonne politique." },
      ],
      explain:
        "La position C est un soutien conditionnel : la légitimité de la mesure dépend de protections d'équité et d'une obligation de rendre des comptes intégrées à la conception, pas ajoutées après coup.",
    },
    {
      id: "sm_c2",
      position_id: "pos_c",
      prompt: "Qu'est-ce que cette position accepte comme coût réel de son propre choix ?",
      options: [
        {
          text: "Un déploiement plus lent, plus de complexité, moins de recettes nettes — et des exemptions qui pourraient affaiblir l'effet.",
          correct: true,
        },
        { text: "Que la mesure ne sera en réalité jamais lancée." },
        { text: "Rien — ajouter des protections ne coûte rien." },
      ],
      explain:
        "Les conditions ont un prix : exemptions et contrôles ralentissent, coûtent de l'argent, et trop de dérogations peuvent saper le bénéfice anti-congestion lui-même.",
    },
  ],
};

export default insight;
