
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // This allows access from other devices on the same Wi-Fi
    port: 5173,
    strictPort: true,
  },
});
