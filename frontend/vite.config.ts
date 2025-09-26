import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 80,
    allowedHosts: ['ec2-54-193-170-230.us-west-1.compute.amazonaws.com', 'localhost'],
    proxy: {
      '/api': {
        target: 'http://ec2-54-193-170-230.us-west-1.compute.amazonaws.com:8080',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    }
  },
  preview: {
    host: '0.0.0.0',
    port: 3000
  }
})