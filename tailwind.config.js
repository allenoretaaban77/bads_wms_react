/** @type {import('tailwindcss').Config} */
const plugin = require('tailwindcss/plugin')

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
  plugins: [
    plugin(function ({ addUtilities }) {
      addUtilities({
        /* Thin Scrollbar */
        '.scrollbar-thin': {
          'scrollbar-width': 'thin', /* Firefox */
          '&::-webkit-scrollbar': {
            width: '3px',  /* Safari and Chrome vertical */
            height: '3px', /* Safari and Chrome horizontal */
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            'background-color': '#cbd5e1', /* Tailwind's slate-300 */
            'border-radius': '10px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            'background-color': '#94a3b8', /* Tailwind's slate-400 */
          }
        },
        /* Hidden Scrollbar */
        '.no-scrollbar': {
          '-ms-overflow-style': 'none',  /* IE and Edge */
          'scrollbar-width': 'none',     /* Firefox */
          '&::-webkit-scrollbar': {
            display: 'none',             /* Safari and Chrome */
          }
        }
      })
    })
  ]
}