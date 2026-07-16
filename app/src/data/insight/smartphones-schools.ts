import type { DebateInsight } from "./index";

const insight: DebateInsight = {
  topic_id: "topic_smartphones_schools",

  tradeoffs: [
    {
      id: "q1",
      prompt:
        "Mid-lesson, a phone buzzes silently in a student's pocket. Nobody else notices. What is the real problem?",
      a: {
        text: "That the phone was in the room at all — even a silent device competes with the lesson",
        value_ids: ["val_attention"],
      },
      b: {
        text: "Nothing yet — learning to ignore it is exactly the skill school should build",
        value_ids: ["val_autonomy"],
      },
    },
    {
      id: "q2",
      prompt:
        "Practice moved and pickup changed — a parent needs to tell their kid before the last bell. How should that message travel?",
      a: {
        text: "Straight to the student's pocket — families should not need permission to reach their own child",
        value_ids: ["val_reachability"],
      },
      b: {
        text: "Through the front office, like before phones — class time stays sealed for everyone",
        value_ids: ["val_attention", "val_equity"],
      },
    },
    {
      id: "q3",
      prompt:
        "Research suggests phone bans lift test scores most for students who are already struggling. A school should…",
      a: {
        text: "Adopt one rule for everyone — the students with the least slack gain the most from it",
        value_ids: ["val_equity"],
      },
      b: {
        text: "Help those students directly — don't take a tool away from everyone to do it",
        value_ids: ["val_autonomy"],
      },
    },
    {
      id: "q4",
      prompt:
        "Your school gets one staff training day for its new phone policy. Spend it on…",
      a: {
        text: "One enforcement routine every teacher applies the same way, with no exceptions",
        value_ids: ["val_equity"],
      },
      b: {
        text: "Teaching students how notification design works on them — and how to push back",
        value_ids: ["val_autonomy"],
      },
    },
    {
      id: "q5",
      prompt: "A school day with no phones at all is, above all…",
      a: {
        text: "Six hours where nothing buzzes and lessons get students' whole minds",
        value_ids: ["val_attention"],
      },
      b: {
        text: "Six hours when families and their kids cannot reach each other directly",
        value_ids: ["val_reachability"],
      },
    },
  ],

  voices: [
    {
      id: "v_a1",
      position_id: "pos_a",
      name: "Margaret, 51",
      detail: "maths teacher, 23 years in",
      text: "I can tell the second a phone buzzes in a bag — one kid's eyes go somewhere else and take two neighbours with them. The year we went phone-free, I stopped re-teaching the same five minutes three times. I got my classroom back without raising my voice.",
    },
    {
      id: "v_a2",
      position_id: "pos_a",
      name: "Priya, 44",
      detail: "parent of two teens",
      text: "I signed the petition against the ban — I wanted a direct line to my kids. Then my son's school went phone-free, and dinner conversation came back, and he stopped sleeping with one eye on his notifications. I was wrong about which mattered more.",
    },
    {
      id: "v_b1",
      position_id: "pos_b",
      name: "Naomi, 39",
      detail: "single mother, hospital shift worker",
      text: "My roster changes the night before. When pickup moves, I text my daughter between patients — the front office takes an hour to pass a message, if anyone answers at all. A ban doesn't make her safer; it just cuts the thread between us.",
    },
    {
      id: "v_b2",
      position_id: "pos_b",
      name: "Mateo, 16",
      detail: "tenth grader, moved here two years ago",
      text: "My phone is the dictionary I read my chemistry homework with and the only place my grandmother's voice lives. Lock it in a pouch and you don't get more of my attention — you get me sitting there, lost. Teach me when to put it down instead.",
    },
    {
      id: "v_c1",
      position_id: "pos_c",
      name: "Aisha, 33",
      detail: "English teacher and form tutor",
      text: "In my lessons phones go in the box by the door, no debate, and the room is mine. But I've also broken up the confiscation fights a gate-to-gate ban creates. Guard the lesson hard and leave the corridor alone — that's the rule kids actually keep.",
    },
    {
      id: "v_c2",
      position_id: "pos_c",
      name: "Robert, 58",
      detail: "deputy head who wrote his school's phone policy",
      text: "We ran bell-to-bell for a year, and my staff spent break duty searching bags while the phones moved to the toilets. Now they're dead in lessons and alive at break, and the cat-and-mouse mostly stopped. Students keep a rule they believe is fair.",
    },
  ],

  steelman: [
    {
      id: "sm_a1",
      position_id: "pos_a",
      prompt: "Which sentence would a supporter of this position endorse?",
      options: [
        {
          text: "Phones are engineered to pull attention away from learning, and one clear bell-to-bell rule protects it better — and more evenly — than hundreds of small negotiations.",
          correct: true,
        },
        {
          text: "Smartphones are ruining a generation, so schools must shield children from them everywhere, including at home.",
        },
        {
          text: "Phones should be banned mainly because social media is proven to damage teenage mental health.",
        },
      ],
      explain:
        "Position A is an argument about scarce classroom attention and even enforcement, and it stops at the school gate. It explicitly treats the mental health evidence as contested, so the wellbeing claim is not its core case.",
    },
    {
      id: "sm_a2",
      position_id: "pos_a",
      prompt: "What does this position accept as a real cost of its own view?",
      options: [
        {
          text: "Families lose their direct line during the day, and staff inherit real gate-to-gate enforcement work.",
          correct: true,
        },
        { text: "Nothing — once the phones are gone, the problem is simply solved." },
        {
          text: "That test scores will probably dip while students adjust to the new rule.",
        },
      ],
      explain:
        "A serious ban supporter knows the price: cut family contact and a daily enforcement burden, with the risk that use just moves out of sight. The evidence it cites points to score gains, not a dip.",
    },
    {
      id: "sm_b1",
      position_id: "pos_b",
      prompt: "Which sentence would a supporter of this position endorse?",
      options: [
        {
          text: "School is where students should learn to use phones deliberately — and the most direct evidence shows bans neither improve wellbeing nor cut overall use, since most use happens outside school.",
          correct: true,
        },
        {
          text: "Students have a right to their phones, and adults should stop trying to limit screen time at all.",
        },
        {
          text: "Phones are not really a distraction in class, so there is nothing for a ban to fix.",
        },
      ],
      explain:
        "Position B does not deny the distraction — its own tradeoff admits keeping one within reach. Its claim is that bans fail to deliver the promised wellbeing gains and that self-regulation has to be taught somewhere.",
    },
    {
      id: "sm_b2",
      position_id: "pos_b",
      prompt: "What does this position accept as a real cost of its own view?",
      options: [
        {
          text: "A documented distraction stays within reach during lessons, and teachers must police nuance instead of a bright line.",
          correct: true,
        },
        { text: "Nothing — trusting students carries no downside." },
        {
          text: "That parents lose their direct line to their children during the school day.",
        },
      ],
      explain:
        "Keeping phones in school means living with the distraction evidence rather than disputing it — and if the teaching component is weak, managed use can collapse into no rules at all. Lost family contact is the ban's cost, not this position's.",
    },
    {
      id: "sm_c1",
      position_id: "pos_c",
      prompt: "Which sentence would a supporter of this position endorse?",
      options: [
        {
          text: "The evidence is strong exactly where it matters — lesson time — and much weaker for all-day bans, so put phones away during class and leave the breaks alone.",
          correct: true,
        },
        {
          text: "Splitting the difference between two camps is always the safest policy, whatever the evidence says.",
        },
        {
          text: "Each teacher should decide for their own classroom whether phones are allowed that day.",
        },
      ],
      explain:
        "Position C follows an asymmetry in the evidence, not a taste for compromise — and it insists on one bright-line, consistently enforced rule, the opposite of teacher-by-teacher discretion.",
    },
    {
      id: "sm_c2",
      position_id: "pos_c",
      prompt: "What does this position accept as a real cost of its own view?",
      options: [
        {
          text: "A conditional rule is harder to enforce than a blanket ban, and every bell becomes an invitation to test the boundary.",
          correct: true,
        },
        { text: "Nothing — a balanced rule, by definition, has no costs." },
        {
          text: "It concedes that lesson-time distraction will continue unchanged.",
        },
      ],
      explain:
        "The middle path buys reachability and habit-building at the price of a fuzzier boundary: between-lesson use can spill into class, delivering neither a ban's focus nor managed use's autonomy. Protecting lessons is the one thing it does claim to do.",
    },
  ],
};

export default insight;
