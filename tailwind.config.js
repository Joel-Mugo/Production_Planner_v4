/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}', // This line is the critical fix
  ],
  theme: {
    extend: {
      colors: {
        // This brings back your beautiful corporate color palette
        primary: '#059669',
        secondary: '#4f46e5',
        accent: {
            yellowGreen: '#CAD951',
            olive: '#A6A247',
            earthyGreen: '#87A55A',
            purple: '#8b5cf6',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
};

