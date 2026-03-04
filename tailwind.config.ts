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
  		sans: ['var(--font-public-sans)', 'Public Sans', 'sans-serif'],
  		mono: ['var(--font-geist-mono)', 'monospace'],
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
  				DEFAULT: '#7367F0',
  				light: '#8F85F3',
  				dark: '#675DD8',
  			},
  			surface: 'hsl(var(--background))',
  			status: {
  				unassigned: '#94A3B8',
  				'not-started': '#CBD5E1',
  				'in-progress': '#F59E0B',
  				done: '#10B981',
  				'inspected-pass': '#059669',
  				'inspected-fail': '#DC2626',
  				'has-issues': '#EF4444',
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
  			'xs': '0 1px 2px 0 rgb(0 0 0 / 0.04)',
  			'sm': '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
  			'md': '0 4px 8px -2px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.06)',
  			'lg': '0 8px 16px -4px rgb(0 0 0 / 0.1), 0 4px 6px -2px rgb(0 0 0 / 0.05)',
  			'xl': '0 20px 24px -8px rgb(0 0 0 / 0.12), 0 8px 8px -4px rgb(0 0 0 / 0.04)',
  		},
  		spacing: {
  			'sidebar': 'var(--sidebar-width)',
  			'sidebar-collapsed': 'var(--sidebar-collapsed-width)',
  			'header': 'var(--header-height)',
  		},
  	}
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
