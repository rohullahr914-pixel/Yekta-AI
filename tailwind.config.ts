import type { Config } from "tailwindcss";
const config: Config = { content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"], theme: { extend: { colors: { midnight: "#100d18", plum: "#1c1525", rose: "#e994a9", gold: "#c9a96e" }, fontFamily: { sans: ["var(--font-inter)", "sans-serif"], display: ["var(--font-serif)", "serif"] } } }, plugins: [] };
export default config;
