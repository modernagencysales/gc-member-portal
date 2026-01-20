import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');

  // Use environment variable for Gemini API key
  // Set VITE_GEMINI_API_KEY in .env.local for local development

  return {
    plugins: [react()],
    define: {
      // Expose process.env to the client-side code so AIRTABLE keys and API_KEY work
      'process.env': env,
    },
    server: {
      port: 3000,
    },
    build: {
      // @google/genai is bundled normally from node_modules
    },
  };
});
