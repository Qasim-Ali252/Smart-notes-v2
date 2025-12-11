import nextPlugin from "eslint-plugin-next";

export default [
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    extends: ["next/core-web-vitals", "next/typescript"],
    plugins: {
      next: nextPlugin,
    }
  }
];
