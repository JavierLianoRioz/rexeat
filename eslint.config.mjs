import rexeatConfig from "./packages/configs/eslint/eslint.config.mjs";

export default [
  ...rexeatConfig,
  {
    ignores: ["**/dist/**", "**/node_modules/**", "**/build/**", ".next/**"],
  },
];
