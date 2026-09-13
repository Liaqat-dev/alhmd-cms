import plugin from "tailwindcss/plugin";

const colors = [
  "slate", "gray", "zinc", "neutral", "stone",
  "red", "orange", "amber", "yellow", "lime",
  "green", "emerald", "teal", "cyan", "sky",
  "blue", "indigo", "violet", "purple", "fuchsia",
  "pink", "rose", "primary",
];

export default plugin(function ({ addComponents }) {
  const checkboxBasic = {};
  const checkboxSoft  = {};
  const radioBasic    = {};
  const radioSoft     = {};
  const switchColored = {};

  colors.forEach((c) => {
    checkboxBasic[`.input-check-${c}`] = {
      [`@apply checked:bg-${c}-500 checked:!border-${c}-500 focus:checked:bg-${c}-500`]: {},
    };
    checkboxSoft[`.input-check-soft-${c}`] = {
      [`@apply bg-${c}-500/15 !border-${c}-500/20 dark:!border-${c}-500/20 checked:!bg-${c}-500 checked:!border-${c}-500`]: {},
    };
    radioBasic[`.input-radio-${c}`] = {
      [`@apply checked:bg-${c}-500 checked:!border-${c}-500 focus:checked:bg-${c}-500`]: {},
    };
    radioSoft[`.input-radio-soft-${c}`] = {
      [`@apply bg-${c}-500/15 !border-${c}-500/20 checked:bg-${c}-500 checked:!border-${c}-500`]: {},
    };
    switchColored[`.switch-${c}`] = {
      [`@apply peer-checked:!bg-${c}-500`]: {},
    };
  });

  addComponents({
    /* ── Text Input ─── */
    ".form-input": {
      "@apply border rounded-md block text-base h-10 py-[0.5625rem] px-4 w-full border-gray-200 bg-white focus:outline-none focus:ring-0 focus:border-primary-500 placeholder:text-gray-400 disabled:text-gray-500 disabled:cursor-not-allowed disabled:bg-gray-100": {},
      "@apply dark:bg-dark-900 dark:border-dark-800 dark:focus:border-primary-500 dark:placeholder:text-dark-500 dark:disabled:bg-dark-850 dark:disabled:border-dark-800 dark:disabled:text-dark-500 dark:text-dark-100": {},
      "&.input-sm": { "@apply py-1 px-2 text-xs h-7": {} },
      "&.input-md": { "@apply py-1.5 px-3 text-sm h-[2.125rem]": {} },
      "&.input-lg": { "@apply py-2.5 px-5 text-base h-[2.7813rem]": {} },
    },
    /* ── Label ─── */
    ".form-label": {
      "@apply block mb-2 text-sm font-medium dark:text-dark-200": {},
    },
    /* ── Select ─── */
    ".form-select": {
      "@apply border rounded-md border-gray-200 block py-[0.5625rem] h-10 pl-3 pr-10 text-base w-full appearance-none focus:outline-none focus:ring-0 focus:border-primary-500 bg-no-repeat": {},
      "@apply dark:border-dark-800 dark:bg-dark-900 dark:text-dark-100": {},
      "background-image": `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%231f242e' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m2 5 6 6 6-6'/%3e%3c/svg%3e")`,
      "background-position": "right 0.70rem center",
      "background-repeat": "no-repeat",
      "background-size": "0.70em 0.70em",
    },
    /* ── Textarea ─── */
    ".form-textarea": {
      "@apply border rounded-md block text-base py-2.5 px-4 w-full border-gray-200 bg-white focus:outline-none focus:ring-0 focus:border-primary-500 placeholder:text-gray-400 resize-y min-h-[6rem]": {},
      "@apply dark:bg-dark-900 dark:border-dark-800 dark:focus:border-primary-500 dark:placeholder:text-dark-500 dark:text-dark-100": {},
    },
    /* ── Checkbox base ─── */
    ".input-check": {
      "@apply border border-gray-300 dark:border-dark-800 rounded appearance-none cursor-pointer size-[1.125rem]": {},
    },
    ":is(.input-check-group, .input-radio-group)": {
      "@apply flex items-center gap-2": {},
    },
    ":is(.input-check-label, .input-radio-label)": {
      "@apply cursor-pointer leading-none text-sm dark:text-dark-200": {},
    },
    /* ── Radio base ─── */
    ".input-radio": {
      "@apply size-[1.125rem] border-gray-300 dark:border-dark-800 appearance-none border rounded-full cursor-pointer": {},
    },
    /* ── Range ─── */
    ".input-range": {
      "@apply w-full h-2 rounded-md appearance-none bg-gray-200 dark:bg-dark-800 cursor-pointer": {},
    },
    /* ── File ─── */
    ".form-file": {
      "@apply border rounded-md block text-base w-full focus:outline-none border-gray-200 dark:border-dark-800": {},
      "&::-webkit-file-upload-button": {
        "@apply py-2 px-4 cursor-pointer border-none bg-gray-900 dark:bg-dark-800 text-gray-100 dark:text-dark-100": {},
      },
    },
    /* ── Switch ─── */
    ".switch-group": {
      "@apply flex items-center cursor-pointer select-none gap-2": {},
      ".switch-wrapper": {
        "@apply relative block w-12 border border-gray-200 rounded-full h-7 dark:border-dark-800 transition-colors duration-200": {},
      },
      ".switch-dot": {
        "@apply absolute transition-all duration-200 bg-gray-200 rounded-full dark:bg-dark-800 size-5 left-1 top-1": {},
      },
      "&.switch-soft .switch-wrapper": { "@apply border-0 bg-gray-200 dark:bg-dark-800": {} },
      "&.switch-soft .switch-dot":     { "@apply bg-white dark:bg-dark-900": {} },
      "&.switch-3d .switch-wrapper":   { "@apply shadow-inner shadow-gray-300 dark:shadow-dark-850": {} },
      "&.switch-3d .switch-dot":       { "@apply shadow-lg shadow-gray-400 bg-white dark:bg-dark-800 dark:shadow-dark-850": {} },
    },
    /* peer-checked moves the dot */
    ".switch-group input:checked ~ .switch-wrapper .switch-dot": {
      "@apply left-6 bg-white dark:bg-dark-900": {},
    },
    ...checkboxBasic,
    ...checkboxSoft,
    ...radioBasic,
    ...radioSoft,
    ...switchColored,
  });
});
