import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],

    theme: {
        extend: {
            fontFamily: {
                // sans: ['Figtree', ...defaultTheme.fontFamily.sans],
                sans: ['Poppins', ...defaultTheme.fontFamily.sans],
            },
            keyframes: {
                fade: {
                  '0%, 100%': { opacity: '0' },
                  '50%': { opacity: '1' },
                },
            },
            animation: {
                fade: 'fade 2s ease-in-out infinite',
            },
        },
    },

    plugins: [forms, require('daisyui')],
    daisyui: {
        themes: ['light', 'dark'], // add more if you want
    },
};
