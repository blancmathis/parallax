import type { DebateInsight } from "./index";

const insight: DebateInsight = {
  topic_id: "topic_congestion_pricing",

  tradeoffs: [
    {
      id: "q1",
      prompt:
        "One lane of road space, saturated every morning. Who should get it?",
      a: {
        text: "Whoever values the trip most — even if that means charging for access",
        value_ids: ["val_mobility"],
      },
      b: {
        text: "Everyone equally, first come first served — roads are public",
        value_ids: ["val_fairness"],
      },
    },
    {
      id: "q2",
      prompt:
        "A toll funds better public transit, but weighs on workers who have no real alternative to driving.",
      a: {
        text: "Compensate those workers first, even if it makes the policy less effective",
        value_ids: ["val_fairness"],
      },
      b: {
        text: "Maximize the overall benefit first — targeted fixes can come after",
        value_ids: ["val_mobility"],
      },
    },
    {
      id: "q3",
      prompt: "To cut air pollution in the city center…",
      a: {
        text: "Act now with strong incentives, even imperfect ones",
        value_ids: ["val_environment"],
      },
      b: {
        text: "Only act once the fairness of the measure is demonstrated",
        value_ids: ["val_fairness", "val_trust"],
      },
    },
    {
      id: "q4",
      prompt:
        "City hall publishes glowing results about its own pricing program.",
      a: {
        text: "Good — the policy works, keep going",
        value_ids: ["val_mobility", "val_environment"],
      },
      b: {
        text: "Independent audit before anything is extended",
        value_ids: ["val_trust"],
      },
    },
    {
      id: "q5",
      prompt: "Fewer cars downtown is, above all…",
      a: {
        text: "Breathable air and streets where people can live",
        value_ids: ["val_environment"],
      },
      b: {
        text: "A risk of pricing out those who have no other option",
        value_ids: ["val_fairness"],
      },
    },
    {
      id: "q6",
      prompt:
        "A public road you have already paid for through taxes now charges a daily fee to enter.",
      a: {
        text: "Fair enough — a price is how you ration space everyone wants at once",
        value_ids: ["val_mobility"],
      },
      b: {
        text: "Not fair — open access to public roads is something you shouldn't have to pay twice for",
        value_ids: ["val_access"],
      },
    },
  ],

  voices: [
    {
      id: "v_a1",
      position_id: "pos_a",
      name: "Amara, 34",
      detail: "nurse, commutes by bus",
      text: "My bus used to crawl behind single-driver cars for forty minutes. Since the zone, I get that time back every single day. Nobody who drives ever counted my time as a cost.",
    },
    {
      id: "v_a2",
      position_id: "pos_a",
      name: "Tomás, 41",
      detail: "shop owner inside the zone",
      text: "I was against it — I signed the petition. Then deliveries started arriving on schedule. I pay the toll two days a week, and what I get back is a predictable city.",
    },
    {
      id: "v_b1",
      position_id: "pos_b",
      name: "Karim, 52",
      detail: "night-shift warehouse worker",
      text: "My shift ends at two in the morning. There is no bus at two in the morning. The toll doesn't change my behavior — it just takes my money. People like me are the rounding error in these plans.",
    },
    {
      id: "v_b2",
      position_id: "pos_b",
      name: "Denise, 47",
      detail: "home-care aide, drives between clients",
      text: "My patients live in three different suburbs. I cannot 'switch modes' between two house calls. Every report that says 'drivers will adapt' was written by someone who has never done my route.",
    },
    {
      id: "v_c1",
      position_id: "pos_c",
      name: "Lucía, 29",
      detail: "urban planner",
      text: "I believe in pricing — the engineering is sound. I also watched my own city botch it with opaque revenue and zero review. Design it with rebates and independent audits, or don't do it at all.",
    },
    {
      id: "v_c2",
      position_id: "pos_c",
      name: "Sam, 63",
      detail: "retired bus driver",
      text: "Buses move when cars stop blocking them — I saw it from the driver's seat for thirty years. But charge fairly: exempt the workers who genuinely have no alternative yet, and publish where every euro goes.",
    },
  ],

  steelman: [
    {
      id: "sm_a1",
      position_id: "pos_a",
      prompt: "Which sentence would a supporter of this position endorse?",
      options: [
        {
          text: "Road space is scarce and underpriced; pricing it makes the whole city work better — and fairness objections are design problems, not dealbreakers.",
          correct: true,
        },
        { text: "Drivers are selfish and deserve to pay for the harm they cause." },
        { text: "Cars should eventually be banned from city centers altogether." },
      ],
      explain:
        "Position A is an efficiency argument about scarce public space, not a moral judgment of drivers. It treats equity concerns as real but solvable through design.",
    },
    {
      id: "sm_a2",
      position_id: "pos_a",
      prompt: "What does this position accept as a real cost of its own view?",
      options: [
        {
          text: "Some drivers pay more, the administration gets more complex, and the politics are hard.",
          correct: true,
        },
        { text: "Nothing — well-designed pricing has no downside." },
        { text: "That congestion will probably get worse before it gets better." },
      ],
      explain:
        "A serious position knows its own price. Position A openly accepts direct fees, complexity, and political resistance as the cost of the gains.",
    },
    {
      id: "sm_b1",
      position_id: "pos_b",
      prompt: "Which sentence would a supporter of this position endorse?",
      options: [
        {
          text: "Whether pricing reduces traffic isn't the question — the question is who carries the burden, and it lands on those least able to adapt.",
          correct: true,
        },
        { text: "Traffic congestion is not actually a real problem." },
        { text: "Public transit is useless, so funding it is pointless." },
      ],
      explain:
        "Position B usually concedes that pricing can reduce congestion. Its core claim is distributive: effectiveness does not prove the burdens are fairly shared.",
    },
    {
      id: "sm_b2",
      position_id: "pos_b",
      prompt: "What does this position accept as a real cost of its own view?",
      options: [
        {
          text: "Congestion stays, and transit may remain underfunded.",
          correct: true,
        },
        { text: "It accepts higher taxes on everyone instead." },
        { text: "Nothing — rejecting the toll has no downside." },
      ],
      explain:
        "Rejecting the tool means keeping the problem. Position B accepts continued congestion and weaker transit funding as the price of protecting constrained drivers.",
    },
    {
      id: "sm_c1",
      position_id: "pos_c",
      prompt: "Which sentence would a supporter of this position endorse?",
      options: [
        {
          text: "Pricing can be justified — but only if rebates, transparent revenue use, and independent review are built in from day one.",
          correct: true,
        },
        { text: "Any congestion charge is acceptable as long as it reduces traffic." },
        { text: "Equity talk is just an excuse to block good policy." },
      ],
      explain:
        "Position C is conditional support: the policy's legitimacy depends on equity protections and accountability being part of the design, not an afterthought.",
    },
    {
      id: "sm_c2",
      position_id: "pos_c",
      prompt: "What does this position accept as a real cost of its own view?",
      options: [
        {
          text: "A slower rollout, more complexity, less net revenue — and carve-outs that could weaken the effect.",
          correct: true,
        },
        { text: "That the policy will never actually launch." },
        { text: "Nothing — adding protections is free." },
      ],
      explain:
        "Conditions have a price: exemptions and reviews slow things down, cost money, and too many carve-outs can undermine the congestion benefit itself.",
    },
  ],
};

export default insight;
