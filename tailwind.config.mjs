/** @type {import('tailwindcss').Config} */
import { colors } from "./src/styles/colors.js";

export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        primary: colors.primary,
        accent: colors.accent,
      },
    },
  },
  plugins: [],
};
