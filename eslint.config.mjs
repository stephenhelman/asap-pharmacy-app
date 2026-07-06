// Native flat config from eslint-config-next 16 (no FlatCompat).
import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

const eslintConfig = [
  { ignores: [".next/**", "node_modules/**"] },
  ...coreWebVitals,
  ...typescript,
  {
    rules: {
      // Friendly microcopy is full of apostrophes ("You're all caught up"); the
      // JSX-escaping rule would force &apos; everywhere and hurt readability.
      "react/no-unescaped-entities": "off",
    },
  },
];

export default eslintConfig;
