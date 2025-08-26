/** @type {import('tailwindcss').Config} */
module.exports = {
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
    require('@tailwindcss/aspect-ratio'),
  ],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    screens: {
      'xs': '375px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1440px',
    },
    extend: {
      fontFamily: {
        sans: ['Nunito', 'sans-serif'],
      },
      fontSize: {
        'xs': '0.75rem',     // 12px
        'sm': '0.875rem',    // 14px
        'base': '1rem',      // 16px
        'lg': '1.125rem',    // 18px
        'xl': '1.25rem',     // 20px
        '2xl': '1.5rem',     // 24px
        '3xl': '1.875rem',   // 30px
        '4xl': '2.25rem',    // 36px
        '5xl': '3rem',       // 48px
      },
      animation: {
        blob: 'blob 7s infinite',
        fadeOut: 'fadeOut 0.5s ease-out forwards',
      },
      keyframes: {
        blob: {
          '0%': {
            transform: 'translate(0px, 0px) scale(1)',
          },
          '33%': {
            transform: 'translate(30px, -50px) scale(1.1)',
          },
          '66%': {
            transform: 'translate(-20px, 20px) scale(0.9)',
          },
          '100%': {
            transform: 'translate(0px, 0px) scale(1)',
          },
        },
        fadeOut: {
          '0%': { opacity: 1 },
          '100%': { opacity: 0, visibility: 'hidden' },
        },
      },
      colors: {
        brandBlack: {
          DEFAULT: '#130f40',
          light: '#2a2463',
        },
        brandYellow: {
          DEFAULT: '#FFC601',
          light: '#FFD54F',
          dark: '#F2B600',
        },
        brandWhite: '#f9f9f9',
        lightColor: '#666',
        lightBg: '#f7f7f7',
        // Keeping brandGreen for backward compatibility
        brandGreen: {
          DEFAULT: '#FFC601',
          light: '#FFD54F',
        },
        lightGreen: '#FFD54F',
      },
      boxShadow: {
        'soft': '0 8px 24px rgba(0, 0, 0, 0.06)',
        'button': '0 4px 12px rgba(255, 198, 1, 0.3)',
        'button-hover': '0 6px 16px rgba(255, 198, 1, 0.4)',
      },
      fontFamily: {
        sans: ['Nunito', 'sans-serif'],
      },
      fontSize: {
        '15': '1.5rem',
        '17': '1.7rem',
        '20': '2rem',
        '25': '2.5rem',
        '30': '3rem',
        '35': '3.5rem',
        '40': '4rem',
        '45': '4.5rem',
        '50': '5rem',
        '55': '5.5rem',
        '60': '6rem',
      },
      spacing: {
        '1/10': '10%',
        '2/10': '20%',
        '3/10': '30%',
        '4/10': '40%',
        '5/10': '50%',
        '6/10': '60%',
        '7/10': '70%',
        '8/10': '80%',
        '9/10': '90%',
        '10/10': '100%',
      },
      boxShadow: {
        'custom': '0 0.5rem 1rem rgba(0, 0, 0, 0.1)',
      },
      borderRadius: {
        '5': '0.5rem',
      },
      maxWidth: {
        '1200': '1200px',
      },
      borderWidth: {
        '1': '1px',
      },
      borderColor: {
        'default': 'rgba(0, 0, 0, 0.1)',
        'hover': '#27ae60',
      },
    },
  },
  plugins: [],
}
