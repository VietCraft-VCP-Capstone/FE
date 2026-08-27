/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: '#0f172a',
                primary: {
                    light: '#f59e0b',
                    DEFAULT: '#d97706',
                    dark: '#b45309',
                },
                accent: {
                    light: '#f43f5e',
                    DEFAULT: '#e11d48',
                    dark: '#be123c',
                },
                vietcraft: {
                    green: '#007700',
                    'green-dark': '#005B00',
                    'green-light': '#94FC7E',
                    'green-subtle': '#EAF0E2',
                    'green-tint': 'rgba(0, 119, 0, 0.1)',
                    purple: '#330033',
                    'purple-dark': '#471042',
                    'neutral-dark': '#111827',
                    'neutral-olive': '#171D15',
                    'neutral-body': '#3F4A3B',
                    'neutral-muted': '#6B7280',
                    'border-olive': '#BECAB6',
                    'border-light': '#E5E7EB',
                    'bg-page': '#F9FAFB',
                    'danger': '#BA1A1A',
                },
                // Bảng màu trang quản trị. Trước đây là các biến CSS --ad-* trong
                // layouts.css; đưa vào đây để JSX dùng Tailwind mà giữ nguyên diện mạo.
                admin: {
                    brand: '#1a6b1a',
                    'brand-600': '#15801a',
                    'brand-700': '#145c14',
                    'brand-050': '#eef7ee',
                    ink: '#16211a',
                    body: '#384740',
                    muted: '#64748b',
                    line: '#e8ede8',
                    'line-soft': '#f1f4f1',
                    surface: '#ffffff',
                    canvas: '#f8fafb',
                    danger: '#dc2626',
                    'danger-050': '#fef2f2',
                }
            },
            boxShadow: {
                'admin-sm': '0 1px 2px rgba(16, 33, 26, 0.04)',
                'admin-md': '0 4px 16px rgba(16, 33, 26, 0.08)',
                'admin-lg': '0 24px 60px rgba(16, 33, 26, 0.18)',
            },
            borderRadius: {
                admin: '10px',
            },
            fontFamily: {
                sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
                jakarta: ['"Plus Jakarta Sans"', 'sans-serif'],
                vietnam: ['"Be Vietnam Pro"', 'sans-serif'],
                inter: ['Inter', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
