import { join } from 'node:path';

export default {
  content: [join(process.cwd(), 'index.html'), './src/**/*.{js,jsx,ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
};

