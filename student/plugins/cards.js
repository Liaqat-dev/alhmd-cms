import plugin from "tailwindcss/plugin";

export default plugin(function ({ addComponents }) {
  addComponents({
    ".card": {
      "@apply rounded-md border border-gray-200 mb-5 shadow-lg shadow-gray-100 bg-white dark:bg-dark-900 dark:border-dark-800 dark:shadow-dark-900 dark:text-dark-100": {},
      ".card-title": {
        "@apply text-card-title font-semibold text-xl sm:text-2xl": {},
      },
      "&.hovered": {
        "@apply transition-all duration-200 ease-linear hover:-translate-y-1": {},
      },
    },
    ".card-body":   { "@apply p-5": {} },
    ".card-header": { "@apply p-5 border-b border-gray-200 rounded-t-md dark:border-dark-800": {} },
    ".card-footer": { "@apply p-5 border-t border-gray-200 rounded-b-md dark:border-dark-800": {} },
  });
});
