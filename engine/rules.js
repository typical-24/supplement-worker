function getRules() {
  return {
    phaseOnly: {
      caakg: "AMPK",
      egcg: "AMPK",
      cordyceps: "MTOR",
      rhodiola: "AMPK",
    },

    trainingOnly: new Set([
      "bockshornkleesamen",
      "master-aminosaeuren",
      "eaas",
      "bcaa",
    ]),

    excludePairs: [
      ["cordyceps", "rhodiola"],
      ["nattokinase", "flavozym"],
    ],

    timingPairs: [
      ["eisen", "magnesium"],
      ["eisen", "zink"],
      ["eisen", "opc"],
      ["curcumin", "egcg"],
    ],

    stackPairs: [
      ["vitamin-d3", "vitamin-k2"],
      ["eisen", "vitamin-c"],
      ["magnesium", "glycin"],
      ["glycin", "tryptophan"],
    ],

    substitutions: [
      {
        active: "okra",
        replace: "pleurotus",
        note: "Okra ersetzt Pleurotus.",
      },
      {
        active: "magnesium-l-threonat",
        replace: "magnesium",
        note: "Magnesium L-Threonat ersetzt Standard-Magnesium.",
      },
      {
        active: "uridin-monophosphat",
        replace: "cdp-cholin",
        note: "Uridin und CDP-Cholin laufen alternierend.",
      },
      {
        active: "cdp-cholin",
        replace: "uridin-monophosphat",
        note: "CDP-Cholin und Uridin laufen alternierend.",
      },
    ],

    dominanceGroups: [
      {
        name: "polyphenol_anker",
        items: ["granatapfel", "amla", "maqui", "mangostan"],
        note: "Nur ein dominanter Polyphenol-Anker gleichzeitig.",
      },
      {
        name: "hauptadaptogen",
        items: ["cordyceps", "rhodiola"],
        note: "Nur ein Hauptadaptogen gleichzeitig hoch.",
      },
    ],

    adjustments: [
      {
        ifActive: "chaga",
        thenReduce: "quercetin",
        note: "Wenn Chaga aktiv, Quercetin reduzieren.",
      },
      {
        ifActive: "okra",
        thenReduce: "coprinus",
        note: "Wenn Okra aktiv ist, Coprinus halbieren.",
      },
      {
        ifActive: "maqui",
        thenPause: ["amla", "granatapfel"],
        note: "Wenn Maqui aktiv, Amla und Granatapfel pausieren.",
      },
      {
        ifActive: "l-arginin",
        thenReduce: "bockshornkleesamen",
        note: "Wenn L-Arginin hoch, Bockshornklee reduzieren.",
      },
      {
        ifActive: "flavozym",
        thenPause: ["nattokinase"],
        note: "Wenn Flavozym aktiv, Nattokinase pausieren.",
      },
    ],
  };
}

export { getRules };
