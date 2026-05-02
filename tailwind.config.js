/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'sidebar': '#1B5E20',
        'header': '#388E3C',
        'row-alt': '#E8F5E9',
        'button': '#4CAF50',
        'button-hover': '#2E7D32',
        'text': '#212121',
      },
      borderRadius: {
        'custom': '5px',
      },
    },
  },
  plugins: [],
}
