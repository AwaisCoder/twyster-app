import daisyui from "daisyui";
import daisyUIThemes, { black } from "daisyui/src/theming/themes";
/** @type {import('tailwindcss').Config} */
export default {
	content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
	theme: {
		extend: {},
	},
	plugins: [daisyui],

	daisyui: {
		themes: [
			"light",
			{
				black: {
					...daisyUIThemes["black"],
					primary: "#2C54FF",
					secondary: "#2C54FF",
				},
			},
		],
	},
};