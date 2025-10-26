/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx,svelte,vue}',
    './content/**/*.{md,mdx,toml,json}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
        display: ['"press-start-2p"', 'ui-monospace', 'monospace'],
        serif: [
          '"Literata Variable"',
          'ui-serif',
          'Georgia',
          'Cambria',
          '"Times New Roman"',
          'Times',
          'serif',
        ],
      },
      colors: {
        'zag-dark': 'rgb(23 23 23)', // neutral-900
        'zag-light': 'rgb(245 245 245)', // neutral-100  
        'zag-dark-muted': 'rgb(82 82 82)', // neutral-600
        'zag-light-muted': 'rgb(163 163 163)', // neutral-400
        'zag-accent-light': 'rgb(52 211 153)', // emerald-400
        'zag-accent-light-muted': 'rgb(110 231 183)', // emerald-300
        'zag-accent-dark': 'rgb(5 150 105)', // emerald-600
        'zag-accent-dark-muted': 'rgb(6 95 70)', // emerald-800
      },
    },
  },
  safelist: [
    'px-4',
    'sm:px-0',
    'pb-4',
    'gap-1',
    'gap-4',
    'gap-8',
    'sm:px-4',
    'py-4',
    'mt-16',
    'sm:mt-0',
  ],
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
