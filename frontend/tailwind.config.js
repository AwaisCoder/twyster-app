import daisyui from "daisyui";
/** @type {import('tailwindcss').Config} */
export default {
	content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
	theme: {
		extend: {},
	},
	plugins: [daisyui],

	daisyui: {
		themes: [
			"valentine", // Default light theme
			{
				black: { // Define the black theme directly
					primary: "#2C54FF", // Your desired primary color
					secondary: "#5F7DFF", // Your desired secondary color
					"base-100": "#000000", // Background color
					"base-200": "#1F2328", // Slightly lighter background color
					// You can add more custom properties if needed
				},
			},
			"coffee",
			"sunset",
		],
	},
};
