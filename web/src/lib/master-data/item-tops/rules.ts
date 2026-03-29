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
    necks: ["crew", "v", "mock", "collar"],
    designs: ["raglan"],
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
    lengths: ["normal", "long"],
    necks: ["crew", "v"],
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

  blouse: {
    sleeves: ["short", "five", "seven", "long", "sleeveless", "french"],
    lengths: ["normal", "long"],
    necks: ["crew", "v", "mock", "collar"],
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

  knit: {
    sleeves: ["short", "five", "seven", "long", "sleeveless"],
    lengths: ["short", "normal", "long"],
    necks: ["crew", "v", "turtle", "mock"],
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
    sleeves: ["seven", "long"],
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

  camisole: {
    sleeves: ["camisole"],
    lengths: ["short", "normal"],
    necks: ["v"],
    designs: [],
    fits: ["normal"],
    defaults: {
      sleeve: "camisole",
      length: "normal",
      neck: "v",
      design: null,
      fit: "normal",
    },
  },

  tanktop: {
    sleeves: ["sleeveless"],
    lengths: ["short", "normal", "long"],
    necks: ["crew", "v"],
    designs: [],
    fits: ["normal", "oversized"],
    defaults: {
      sleeve: "sleeveless",
      length: "normal",
      neck: "crew",
      design: null,
      fit: "normal",
    },
  },
};
