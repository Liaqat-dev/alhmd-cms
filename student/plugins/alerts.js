import plugin from "tailwindcss/plugin";

const colors = [
  "slate", "gray", "zinc", "neutral", "stone",
  "red", "orange", "amber", "yellow", "lime",
  "green", "emerald", "teal", "cyan", "sky",
  "blue", "indigo", "violet", "purple", "fuchsia",
  "pink", "rose", "primary",
];

export default plugin(function ({ addComponents }) {
  const def     = {};
  const soft    = {};
  const outline = {};
  const solid   = {};

  colors.forEach((c) => {
    def[`.alert-${c}`] = {
      [`@apply bg-${c}-100 dark:bg-${c}-500/20 text-${c}-500 border-${c}-200 dark:border-${c}-500/30`]: {},
    };
    soft[`.alert-sub-${c}`] = {
      [`@apply bg-${c}-100 text-${c}-500 border-${c}-100 dark:bg-${c}-500/20 dark:border-${c}-500/0`]: {},
    };
    outline[`.alert-outline-${c}`] = {
      [`@apply bg-transparent text-${c}-500 border-${c}-500`]: {},
    };
    solid[`.alert-solid-${c}`] = {
      [`@apply text-white bg-${c}-500 border-${c}-500`]: {},
    };
  });

  addComponents({
    ".alert": {
      "@apply px-5 py-3 pr-10 text-sm border rounded-md relative": {},
      ".btn-close": {
        "@apply absolute text-lg right-4 top-2.5 transition duration-200 ease-linear opacity-60 hover:opacity-100": {},
      },
      "&.alert-icon": {
        "@apply relative pr-10 pl-16": {},
        ".icon": {
          "@apply absolute inset-y-0 flex items-center justify-center left-0 border-r w-11": {},
        },
      },
      "&.alert-border": {
        "@apply sm:flex gap-3 p-5 relative bg-white !border-t-4 dark:bg-dark-900": {},
      },
      "&.alert-gray": {
        "@apply dark:border-dark-800 dark:bg-dark-850": {},
      },
    },
    ...def,
    ...soft,
    ...outline,
    ...solid,
  });
});
