import type { DebateInsight } from "./index";

const insight: DebateInsight = {
  topic_id: "topic_nuclear_power",

  tradeoffs: [
    {
      id: "q1",
      prompt:
        "Grid planners model a still, overcast week in midwinter, with heating and transport fully electric. What keeps the lights on?",
      a: {
        text: "Firm plants that run regardless of weather, even at a price premium",
        value_ids: ["val_reliability"],
      },
      b: {
        text: "Storage, interconnection, and flexible demand — cheaper today and improving fast",
        value_ids: ["val_cost"],
      },
    },
    {
      id: "q2",
      prompt:
        "A 40-year-old reactor needs a billion-dollar refurbishment to run two more decades. The same money could build a large solar farm.",
      a: {
        text: "Refurbish — proven firm low-carbon output, with no new-build schedule risk",
        value_ids: ["val_climate", "val_reliability"],
      },
      b: {
        text: "Build the solar farm — put each dollar where it cuts the most carbon, soonest",
        value_ids: ["val_cost"],
      },
    },
    {
      id: "q3",
      prompt:
        "New reactors could displace coal this decade, but no country yet operates a permanent disposal site for their waste.",
      a: {
        text: "Build now — climate damage compounds daily; the waste is small, contained, and manageable",
        value_ids: ["val_climate"],
      },
      b: {
        text: "Not before disposal is solved — don't hand a 100,000-year burden to people who never voted on it",
        value_ids: ["val_stewardship"],
      },
    },
    {
      id: "q4",
      prompt:
        "A coal-dependent country wants to buy your reactor technology. The deal would cut emissions but spread fuel-cycle expertise.",
      a: {
        text: "Sell — every coal plant displaced saves lives and carbon, starting now",
        value_ids: ["val_climate"],
      },
      b: {
        text: "Decline — proliferation risk outlasts any emissions benefit the deal delivers",
        value_ids: ["val_stewardship"],
      },
    },
    {
      id: "q5",
      prompt:
        "A flagship new build is five years late and double its budget, at seventy percent complete. The next funding vote is yours.",
      a: {
        text: "Finish it — decades of firm low-carbon power still lie on the other side of the overrun",
        value_ids: ["val_reliability"],
      },
      b: {
        text: "Cut losses — redirect the remaining capital to wind, solar, and storage that deploy now",
        value_ids: ["val_cost"],
      },
    },
  ],

  voices: [
    {
      id: "v_a1",
      position_id: "pos_a",
      name: "Elena, 45",
      detail: "control-room operator at a nuclear plant, 19 years on shift",
      text: "I sat in the control room through a two-week January fog when the wind maps went flat and we carried the region. Nobody cheers for us, but the grid leaned on this plant every one of those nights. You don't decarbonize winters with hope.",
    },
    {
      id: "v_a2",
      position_id: "pos_a",
      name: "Ingrid, 57",
      detail: "lifelong environmental campaigner",
      text: "I marched against reactors in the eighties — I still have the banner. Then I did the arithmetic on what replaced the plants we closed, and for years the answer was coal. The climate doesn't grade us on intentions; it counts the tonnes.",
    },
    {
      id: "v_b1",
      position_id: "pos_b",
      name: "Dele, 36",
      detail: "solar farm developer",
      text: "Eight years ago every project I priced needed a subsidy; now we win auctions outright and connect in eighteen months. The reactor announced when I started my career still hasn't poured its last concrete. I build faster than they revise schedules.",
    },
    {
      id: "v_b2",
      position_id: "pos_b",
      name: "Carol, 62",
      detail: "retired schoolteacher, ratepayer near a delayed reactor build",
      text: "There's a line on my power bill for a plant that is seven years late and still not finished. I've paid it since before my grandson was born, and that same money could have put panels on half the town. Tell me again how this is the prudent choice.",
    },
    {
      id: "v_c1",
      position_id: "pos_c",
      name: "Janek, 49",
      detail: "maintenance engineer at a 40-year-old plant",
      text: "I inspect welds on a reactor older than I am, and it passes every test we throw at it. When a plant like ours two regions over closed early, a coal unit came out of retirement to cover the gap. Keep what is running and healthy — that part is simple.",
    },
    {
      id: "v_c2",
      position_id: "pos_c",
      name: "Fatima, 41",
      detail: "utility grid planner",
      text: "Extending our two existing units cost less than any new plant of any kind — I signed that filing gladly. The new build on my desk is triple the price with a decade of schedule risk, and I owe ratepayers the same scrutiny. Each project earns its own yes.",
    },
  ],

  steelman: [
    {
      id: "sm_a1",
      position_id: "pos_a",
      prompt: "Which sentence would a supporter of this position endorse?",
      options: [
        {
          text: "Deep decarbonization needs firm low-carbon power through still weeks and dark winters, and nuclear delivers it safely at scale — recent overruns are industrial problems, not physical limits.",
          correct: true,
        },
        {
          text: "Wind and solar are overhyped — nuclear should carry the grid on its own.",
        },
        {
          text: "Nuclear is safe enough that regulation should be loosened to speed up construction.",
        },
      ],
      explain:
        "Position A treats renewables as essential partners, not rivals — its claim is that grids also need firm power, and that nuclear's cost record reflects fixable supply-chain problems. It argues from the safety record, not against safety rules.",
    },
    {
      id: "sm_a2",
      position_id: "pos_a",
      prompt: "What does this position accept as a real cost of its own view?",
      options: [
        {
          text: "High upfront capital, long construction timelines, long-lived waste — and the risk that overruns absorb money faster options would have used better.",
          correct: true,
        },
        {
          text: "Nothing — once a plant is running, the climate benefits erase every cost.",
        },
        {
          text: "That nuclear power is, deep down, more dangerous than the fossil fuels it replaces.",
        },
      ],
      explain:
        "Position A's bet is expensive and slow by its own admission; its claim is that the firm-power payoff justifies that price. It concedes no safety deficit — the per-unit evidence points the other way.",
    },
    {
      id: "sm_b1",
      position_id: "pos_b",
      prompt: "Which sentence would a supporter of this position endorse?",
      options: [
        {
          text: "Climate policy is a race measured in dollars and years, and new nuclear loses on both — capital locked in slow builds is capital not cutting emissions sooner.",
          correct: true,
        },
        {
          text: "Reactors are simply too dangerous to operate, whatever they cost.",
        },
        {
          text: "Decarbonization can afford to wait until storage gets cheap enough.",
        },
      ],
      explain:
        "Position B is an argument about cost and speed, not reactor dread. It wants decarbonization to go faster, which is precisely why it objects to slow, over-budget builds.",
    },
    {
      id: "sm_b2",
      position_id: "pos_b",
      prompt: "What does this position accept as a real cost of its own view?",
      options: [
        {
          text: "Forgoing firm low-carbon capacity — and if storage and flexibility scale slower than hoped, decarbonization could stall at high renewable shares.",
          correct: true,
        },
        {
          text: "Nothing — cheap renewables have made energy trade-offs a thing of the past.",
        },
        {
          text: "That coal plants must stay open indefinitely to back up the grid.",
        },
      ],
      explain:
        "Betting on renewables plus storage means owning the hardest last miles of grid reliability. Position B accepts that wager — it does not accept permanent fossil backup, which would defeat its whole purpose.",
    },
    {
      id: "sm_c1",
      position_id: "pos_c",
      prompt: "Which sentence would a supporter of this position endorse?",
      options: [
        {
          text: "Defend the reactors we already have — the cheapest firm low-carbon power available — and judge each proposed new build on its own cost, timeline, and risk.",
          correct: true,
        },
        {
          text: "New reactors should never be approved under any circumstances.",
        },
        {
          text: "Old plants should keep running indefinitely, whatever their inspections find.",
        },
      ],
      explain:
        "Position C is asymmetric, not anti-nuclear: vigorous defense of existing plants, case-by-case scrutiny of new ones. It defends healthy reactors, not reactors unconditionally.",
    },
    {
      id: "sm_c2",
      position_id: "pos_c",
      prompt: "What does this position accept as a real cost of its own view?",
      options: [
        {
          text: "No clear industrial signal — the supply chain and workforce keep declining, and case-by-case ambivalence can become a phase-out by default.",
          correct: true,
        },
        {
          text: "Nothing — keeping options open is free by definition.",
        },
        {
          text: "That renewables deployment must slow down to protect the existing fleet.",
        },
      ],
      explain:
        "Waiting has its own price. Without a steady order book the industrial base erodes, so 'maybe later' can quietly harden into 'never' — Position C carries that risk knowingly.",
    },
  ],
};

export default insight;
