import type en from "./locales/en.json"

// Makes `t("...")` keys type-checked against the English file.
declare module "i18next" {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- module augmentation needs interface merging
  interface CustomTypeOptions {
    defaultNS: "translation"
    resources: { translation: typeof en }
  }
}
