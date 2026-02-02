// src/core/anytime/registry.ts

import { DeepModuleRegistryV02 } from "./deepModule";
import { diversityDppV02 } from "../extensions/diversity.dpp";
import { robustnessPerturbV02 } from "../extensions/robustness.perturb";
import { smcChangepointV02 } from "../extensions/smc.changepoint";

export const deepRegistryV02: DeepModuleRegistryV02 = {
  modules: [
    diversityDppV02,
    robustnessPerturbV02,
    smcChangepointV02,
  ],
};
