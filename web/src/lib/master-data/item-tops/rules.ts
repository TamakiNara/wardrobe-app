import type { TopsDesignValue } from "./designs";
import type { TopsFitValue } from "./fits";
import type { TopsLengthValue } from "./lengths";
import type { TopsNeckValue } from "./necks";
import type { TopsShapeValue } from "./shapes";
import type { TopsSleeveValue } from "./sleeves";

export type TopsRule = {
  sleeves: readonly TopsSleeveValue[];
  lengths: readonly TopsLengthValue[];
  necks: readonly TopsNeckValue[];
  designs: readonly TopsDesignValue[];
  fits: readonly TopsFitValue[];
  defaults?: {
    sleeve?: TopsSleeveValue | null;
    length?: TopsLengthValue | null;
    neck?: TopsNeckValue | null;
    design?: TopsDesignValue | null;
    fit?: TopsFitValue;
  };
};

export const TOPS_RULES: Record<TopsShapeValue, TopsRule> = {
  tshirt: {
    sleeves: ["short", "five", "seven", "long", "sleeveless", "french"],
    lengths: ["short", "normal", "long"],
    necks: ["crew", "v", "u", "square", "boat", "henley", "turtle", "mock"],
    designs: [],
    fits: ["normal", "oversized"],
    defaults: {
      sleeve: "short",
      length: "normal",
      neck: "crew",
      design: null,
      fit: "normal",
    },
  },

  shirt: {
    sleeves: ["short", "five", "seven", "long"],
    lengths: ["short", "normal", "long"],
    necks: ["collar", "crew", "v"],
    designs: [],
    fits: ["normal", "oversized"],
    defaults: {
      sleeve: "long",
      length: "normal",
      neck: "collar",
      design: null,
      fit: "normal",
    },
  },

  blouse: {
    sleeves: ["short", "five", "seven", "long", "sleeveless", "french"],
    lengths: ["short", "normal", "long"],
    necks: ["collar", "crew", "v", "mock", "square"],
    designs: [],
    fits: ["normal", "oversized"],
    defaults: {
      sleeve: "short",
      length: "normal",
      neck: "collar",
      design: null,
      fit: "normal",
    },
  },

  polo: {
    sleeves: ["short", "five", "seven", "long"],
    lengths: ["short", "normal", "long"],
    necks: ["collar"],
    designs: [],
    fits: ["normal"],
    defaults: {
      sleeve: "short",
      length: "normal",
      neck: "collar",
      design: null,
      fit: "normal",
    },
  },

  sweatshirt: {
    sleeves: ["short", "five", "seven", "long"],
    lengths: ["short", "normal", "long"],
    necks: ["crew"],
    designs: [],
    fits: ["normal", "oversized"],
    defaults: {
      sleeve: "long",
      length: "normal",
      neck: "crew",
      design: null,
      fit: "normal",
    },
  },

  hoodie: {
    sleeves: ["short", "five", "seven", "long", "sleeveless"],
    lengths: ["short", "normal", "long"],
    necks: [],
    designs: [],
    fits: ["normal", "oversized"],
    defaults: {
      sleeve: "long",
      length: "normal",
      neck: null,
      design: null,
      fit: "normal",
    },
  },

  knit: {
    sleeves: ["short", "five", "seven", "long", "sleeveless"],
    lengths: ["short", "normal", "long"],
    necks: ["crew", "v", "square", "turtle", "mock"],
    designs: [],
    fits: ["normal", "oversized"],
    defaults: {
      sleeve: "long",
      length: "normal",
      neck: "crew",
      design: null,
      fit: "normal",
    },
  },

  cardigan: {
    sleeves: ["short", "seven", "long"],
    lengths: ["short", "normal", "long"],
    necks: ["v", "crew"],
    designs: [],
    fits: ["normal", "oversized"],
    defaults: {
      sleeve: "long",
      length: "normal",
      neck: "v",
      design: null,
      fit: "normal",
    },
  },

  vest: {
    sleeves: [],
    lengths: ["short", "normal", "long"],
    necks: ["crew", "v", "boat", "turtle"],
    designs: [],
    fits: ["normal", "oversized"],
    defaults: {
      sleeve: null,
      length: "normal",
      neck: "crew",
      design: null,
      fit: "normal",
    },
  },

  camisole: {
    sleeves: [],
    lengths: ["short", "normal", "long"],
    necks: ["camisole_neck", "square", "v", "halter"],
    designs: [],
    fits: ["normal"],
    defaults: {
      sleeve: null,
      length: "normal",
      neck: "camisole_neck",
      design: null,
      fit: "normal",
    },
  },

  tanktop: {
    sleeves: [],
    lengths: ["short", "normal", "long"],
    necks: ["crew", "square", "highneck", "mock", "boat", "u", "v", "halter"],
    designs: [],
    fits: ["normal", "oversized"],
    defaults: {
      sleeve: null,
      length: "normal",
      neck: "crew",
      design: null,
      fit: "normal",
    },
  },
};
