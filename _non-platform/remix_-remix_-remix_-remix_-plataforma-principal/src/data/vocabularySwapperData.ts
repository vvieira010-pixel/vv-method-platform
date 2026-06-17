export interface SwapperChallenge {
  id: number;
  unitId: number;
  sentence: string; // "We made a [booking] at the hotel, so we waited in the [entrance area] and got a [silent room]."
  targets: {
    simpleWord: string; // The text to replace, e.g., "booking"
    correctWord: string; // The B2 target, e.g., "reservation"
    options: string[]; // ["reservation", "reception", "key card", "elevator"]
    explanation: string;
  }[];
}

export const VOCABULARY_SWAPPER_DATA: SwapperChallenge[] = [
  {
    id: 1,
    unitId: 1,
    sentence: "We made a [booking] at the hotel, so we waited in the [front lobby] and asked if a [silent room] was [ready/free].",
    targets: [
      {
        simpleWord: "booking",
        correctWord: "reservation",
        options: ["reservation", "reception", "key card", "lobby"],
        explanation: "A 'reservation' is the professional noun for a confirmed booking of accommodation."
      },
      {
        simpleWord: "front lobby",
        correctWord: "reception",
        options: ["reception", "elevator", "key card", "lobby"],
        explanation: "The 'reception' (or front desk) is the specific desk area where staff manage arrivals."
      },
      {
        simpleWord: "silent room",
        correctWord: "quiet room",
        options: ["quiet room", "lobby", "available", "included"],
        explanation: "'Quiet room' is the targeted hospitality term representing calm, soundproof space."
      },
      {
        simpleWord: "ready/free",
        correctWord: "available",
        options: ["available", "included", "lobby", "key card"],
        explanation: "'Available' means free and vacant for immediate occupancy."
      }
    ]
  },
  {
    id: 2,
    unitId: 2,
    sentence: "Our [landlord] sent clear instructions, and she highly [suggests] checking out the [surrounding area].",
    targets: [
      {
        simpleWord: "landlord",
        correctWord: "host",
        options: ["host", "critic", "review", "balcony"],
        explanation: "In short-stay apartment rentals, the landlord is referred to as the 'host' or operator."
      },
      {
        simpleWord: "suggests",
        correctWord: "recommends",
        options: ["recommends", "noisy", "windows", "condition"],
        explanation: "'Recommends' is a more professional and active alternative to 'suggests'."
      },
      {
        simpleWord: "surrounding area",
        correctWord: "neighborhood",
        options: ["neighborhood", "balcony", "condition", "location"],
        explanation: "'Neighborhood' is the noun identifying the local community and nearby surrounding streets."
      }
    ]
  },
  {
    id: 3,
    unitId: 3,
    sentence: "I had to buy a [ticket] at the [station] because I was worried about [missing] the fast train.",
    targets: [
      {
        simpleWord: "ticket",
        correctWord: "fare",
        options: ["fare", "platform", "delay", "passenger"],
        explanation: "'Fare' specifically designates the ticket price or cost paid to travel on transit."
      },
      {
        simpleWord: "station",
        correctWord: "terminal",
        options: ["terminal", "platform", "luggage", "announcement"],
        explanation: "A high-speed train or transport hub is referred to as a transit 'terminal'."
      },
      {
        simpleWord: "missing",
        correctWord: "delaying",
        options: ["delaying", "boarding", "departure", "canceling"],
        explanation: "'Delaying' or missing is related to schedule setbacks."
      }
    ]
  },
  {
    id: 4,
    unitId: 4,
    sentence: "During the [meeting], we discussed the [work plan] and reviewed our [duties].",
    targets: [
      {
        simpleWord: "meeting",
        correctWord: "briefing",
        options: ["briefing", "agenda", "colleague", "deadline"],
        explanation: "A focused corporate meeting to outline tasks is specifically labeled a 'briefing'."
      },
      {
        simpleWord: "work plan",
        correctWord: "agenda",
        options: ["agenda", "feedback", "workplace", "presentation"],
        explanation: "The official program or list of meeting items to be addressed is the 'agenda'."
      },
      {
        simpleWord: "duties",
        correctWord: "responsibilities",
        options: ["responsibilities", "colleagues", "feedbacks", "deadlines"],
        explanation: "'Responsibilities' sounds much more analytical and professional in reviews than simple 'duties'."
      }
    ]
  },
  {
    id: 5,
    unitId: 5,
    sentence: "I always [do] my bed and try to [keep] my room clean to establish a good [habit].",
    targets: [
      {
        simpleWord: "do",
        correctWord: "make",
        options: ["make", "dust", "sweep", "tidy"],
        explanation: "The correct verb collocation for organizing bedding is 'to make your bed'."
      },
      {
        simpleWord: "keep",
        correctWord: "maintain",
        options: ["maintain", "sweep", "dust", "fold"],
        explanation: "'Maintain' is an elevated verb meaning to keep a state or house in proper condition."
      },
      {
        simpleWord: "habit",
        correctWord: "routine",
        options: ["routine", "chore", "alarm", "laundry"],
        explanation: "A structured daily workflow is professionally called a 'routine'."
      }
    ]
  },
  {
    id: 6,
    unitId: 6,
    sentence: "The tour has a [quiet] route, but participants must wear safety [gear] and follow cycling [habits].",
    targets: [
      {
        simpleWord: "quiet",
        correctWord: "relaxed",
        options: ["relaxed", "residential", "refunded", "dangerous"],
        explanation: "'Relaxed' replaces boring 'quiet' to convey low-stakes, simple, leisurely pacing."
      },
      {
        simpleWord: "gear",
        correctWord: "helmets",
        options: ["helmets", "guides", "routes", "benefits"],
        explanation: "The specific protective gear provided for heads is 'helmets'."
      },
      {
        simpleWord: "habits",
        correctWord: "routines",
        options: ["routines", "benefits", "stretches", "parks"],
        explanation: "'Routines' is the higher-level word representing habitual exercises and daily flows."
      }
    ]
  },
  {
    id: 7,
    unitId: 7,
    sentence: "This dish has [healthy] parts, and the restaurant [makes sure] to use [local] ingredients.",
    targets: [
      {
        simpleWord: "healthy",
        correctWord: "nutritious",
        options: ["nutritious", "fresh", "delicious", "traditional"],
        explanation: "'Nutritious' is an excellent academic upgrade for generic 'healthy' food descriptors."
      },
      {
        simpleWord: "makes sure",
        correctWord: "guarantees",
        options: ["guarantees", "prepares", "includes", "serves"],
        explanation: "'Guarantees' is an active business verb offering pledge or absolute assurance."
      },
      {
        simpleWord: "local",
        correctWord: "locally sourced",
        options: ["locally sourced", "traditional", "homemade", "organic"],
        explanation: "'Locally sourced' is the advanced food sector vocabulary for goods procured near the shop."
      }
    ]
  },
  {
    id: 8,
    unitId: 8,
    sentence: "To resolve the computer [problem], I had to [follow] the guide step-by-step and [restart] the system.",
    targets: [
      {
        simpleWord: "problem",
        correctWord: "issue",
        options: ["issue", "software", "hardware", "screen"],
        explanation: "In tech support, generic problems are formally called 'issues' or 'anomalies'."
      },
      {
        simpleWord: "follow",
        correctWord: "execute",
        options: ["execute", "reinstall", "connect", "install"],
        explanation: "'Execute' is a premium verb for running or carrying out a set of standard instructions."
      },
      {
        simpleWord: "restart",
        correctWord: "reboot",
        options: ["reboot", "reinstall", "connect", "install"],
        explanation: "'Reboot' is the specific hardware-level terminology for restarting computer components."
      }
    ]
  },
  {
    id: 9,
    unitId: 9,
    sentence: "The nature reserve is [famous] for protecting [animal] species that live in this beautiful [place].",
    targets: [
      {
        simpleWord: "famous",
        correctWord: "renowned",
        options: ["renowned", "protected", "local", "threatened"],
        explanation: "'Renowned' is a high-level CEFR adjective representing being widely known and celebrated."
      },
      {
        simpleWord: "animal",
        correctWord: "wildlife",
        options: ["wildlife", "botanical", "ecosystem", "nature"],
        explanation: "'Wildlife' covers all non-domesticated flora and fauna living in natural habitat ranges."
      },
      {
        simpleWord: "place",
        correctWord: "habitat",
        options: ["habitat", "conservation", "reserve", "ecosystem"],
        explanation: "'Habitat' is the precise ecological definition for the environmental home of a species."
      }
    ]
  },
  {
    id: 10,
    unitId: 10,
    sentence: "The art [show] displayed [amazing] modern works that express the artist's [ideas].",
    targets: [
      {
        simpleWord: "show",
        correctWord: "exhibition",
        options: ["exhibition", "vernissage", "sculpture", "painting"],
        explanation: "An official curated presentation of artistic works is called an 'exhibition'."
      },
      {
        simpleWord: "amazing",
        correctWord: "provocative",
        options: ["provocative", "exquisite", "contemporary", "striking"],
        explanation: "'Provocative' means causing thought, discussion, or strong responses — highly useful for art descriptors."
      },
      {
        simpleWord: "ideas",
        correctWord: "perspective",
        options: ["perspective", "technique", "vernissage", "tradition"],
        explanation: "The intellectual framing, outlook, or worldview of an artist is their 'perspective'."
      }
    ]
  }
];
