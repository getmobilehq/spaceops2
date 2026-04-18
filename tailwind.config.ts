import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: ["class"],
    content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	fontFamily: {
  		sans: ['var(--font-geist)', 'Geist', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
  		mono: ['var(--font-geist-mono)', 'Geist Mono', 'ui-monospace', 'monospace'],
  		serif: ['var(--font-instrument-serif)', 'Instrument Serif', 'Times New Roman', 'serif'],
  	},
  	fontSize: {
  		'xs': ['0.75rem', { lineHeight: '1.16667' }],
  		'sm': ['0.8125rem', { lineHeight: '1.53846' }],
  		'base': ['0.9375rem', { lineHeight: '1.46667' }],
  		'lg': ['1.125rem', { lineHeight: '1.5556' }],
  		'xl': ['1.25rem', { lineHeight: '1.5' }],
  		'2xl': ['1.5rem', { lineHeight: '1.58334' }],
  		'3xl': ['1.75rem', { lineHeight: '1.5' }],
  		'4xl': ['2.375rem', { lineHeight: '1.47368' }],
  		'5xl': ['2.875rem', { lineHeight: '1.47826' }],
  	},
  	extend: {
  		colors: {
  			brand: {
  				DEFAULT: '#4338CA',
  				light: '#EEF2FF',
  				dark: '#1E1B4B',
  			},
  			surface: 'hsl(var(--background))',
  			status: {
  				unassigned: '#94A3B8',
  				'not-started': '#CBD5E1',
  				'in-progress': '#A16207',
  				done: '#166534',
  				'inspected-pass': '#166534',
  				'inspected-fail': '#991B1B',
  				'has-issues': '#991B1B',
  			},
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			success: {
  				DEFAULT: 'hsl(var(--success))',
  				foreground: 'hsl(var(--success-foreground))'
  			},
  			warning: {
  				DEFAULT: 'hsl(var(--warning))',
  				foreground: 'hsl(var(--warning-foreground))'
  			},
  			info: {
  				DEFAULT: 'hsl(var(--info))',
  				foreground: 'hsl(var(--info-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		boxShadow: {
  			'xs': '0 1px 2px rgba(10, 10, 10, 0.04)',
  			'sm': '0 1px 2px rgba(10, 10, 10, 0.04)',
  			'md': '0 4px 16px rgba(10, 10, 10, 0.06), 0 1px 2px rgba(10, 10, 10, 0.04)',
  			'lg': '0 12px 40px rgba(10, 10, 10, 0.08)',
  			'xl': '0 12px 40px rgba(10, 10, 10, 0.08)',
  		},
  		spacing: {
  			'sidebar': 'var(--sidebar-width)',
  			'sidebar-collapsed': 'var(--sidebar-collapsed-width)',
  			'header': 'var(--header-height)',
  		},
  		transitionTimingFunction: {
  			'brand': 'cubic-bezier(0.2, 0.6, 0.2, 1)',
  		},
  	}
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
