import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dotenv from 'dotenv';
import geminiHandler from './api/gemini.js';

// Load environment variables for local development
dotenv.config();

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'gemini-api-dev-middleware',
      configureServer(server) {
        // Mount local API route handler at /api/gemini
        server.middlewares.use('/api/gemini', async (req, res, next) => {
          try {
            await geminiHandler(req, res);
          } catch (err) {
            console.error('Local dev error in /api/gemini middleware:', err);
            if (!res.headersSent) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.message || 'Server Error' }));
            }
          }
        });
      }
    }
  ],
  server: {
    port: 5173,
    host: true
  }
});
