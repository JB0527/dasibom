import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  preview: {
    host: true,
    port: 4173,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'ec2-13-52-103-155.us-west-1.compute.amazonaws.com',
      'ec2-54-193-170-230.us-west-1.compute.amazonaws.com'
    ]
  }
})