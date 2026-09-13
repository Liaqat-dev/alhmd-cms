import plugin from "tailwindcss/plugin";

const colors = [
  "slate", "gray", "zinc", "neutral", "stone",
  "red", "orange", "amber", "yellow", "lime",
  "green", "emerald", "teal", "cyan", "sky",
  "blue", "indigo", "violet", "purple", "fuchsia",
  "pink", "rose", "primary",
];

export default plugin(function ({ addComponents }) {
  const solid   = {};
  const outline = {};
  const soft    = {};
  const btn3d   = {};
  const dashed  = {};
  const active  = {};

  colors.forEach((c) => {
    solid[`.btn-${c}`] = {
      [`@apply bg-${c}-500 text-white border-${c}-500
               hover:bg-${c}-600 hover:border-${c}-600
               focus:bg-${c}-600 focus:border-${c}-600`]: {},
    };
    outline[`.btn-outline-${c}`] = {
      [`@apply bg-transparent text-${c}-500 border-${c}-500
               hover:bg-${c}-500 hover:text-white
               focus:bg-${c}-500 focus:text-white`]: {},
    };
    soft[`.btn-sub-${c}`] = {
      [`@apply bg-${c}-500/10 text-${c}-500 border-none
               hover:bg-${c}-500/20 hover:text-${c}-600
               focus:bg-${c}-500/20  focus:text-${c}-600`]: {},
    };
    btn3d[`.btn-3d-${c}`] = {
      [`@apply shadow-inner bg-${c}-500 text-white border-${c}-500
               shadow-${c}-700
               hover:bg-${c}-600 hover:border-${c}-600
               focus:bg-${c}-600 focus:border-${c}-600`]: {},
    };
    dashed[`.btn-dashed-${c}`] = {
      [`@apply bg-transparent text-${c}-500 border-${c}-500 border-dashed
               hover:bg-${c}-500/10
               focus:bg-${c}-500/10`]: {},
    };
    active[`.btn-active-${c}`] = {
      [`@apply bg-transparent text-${c}-500 border-none
               hover:bg-${c}-500/10
               focus:bg-${c}-500/10`]: {},
    };
  });

  addComponents({
    ...solid,
    ...outline,
    ...soft,
    ...btn3d,
    ...dashed,
    ...active,
  });
});
