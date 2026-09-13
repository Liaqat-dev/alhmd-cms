import plugin from "tailwindcss/plugin";

const colors = [
  "slate", "gray", "zinc", "neutral", "stone",
  "red", "orange", "amber", "yellow", "lime",
  "green", "emerald", "teal", "cyan", "sky",
  "blue", "indigo", "violet", "purple", "fuchsia",
  "pink", "rose", "primary",
];

export default plugin(function ({ addComponents }) {
  const filled  = {};
  const outline = {};
  const soft    = {};
  const solid   = {};

  colors.forEach((c) => {
    filled[`.badge-${c}`]          = { [`@apply bg-${c}-500/10 text-${c}-500 border-${c}-500/20`]: {} };
    outline[`.badge-outline-${c}`] = { [`@apply bg-transparent text-${c}-500 border-${c}-500`]: {} };
    soft[`.badge-sub-${c}`]        = { [`@apply bg-${c}-500/20 text-${c}-500 border-${c}-500/0`]: {} };
    solid[`.badge-solid-${c}`]     = { [`@apply bg-${c}-500 text-white border-${c}-500`]: {} };
  });

  addComponents({
    ".badge": {
      "@apply inline-block px-1.5 py-0.5 rounded-md text-11 border font-medium": {},
    },
    ".badge-square": {
      "@apply inline-flex items-center justify-center size-5 rounded-md text-11 border font-medium": {},
    },
    ...filled,
    ...outline,
    ...soft,
    ...solid,
  });
});
