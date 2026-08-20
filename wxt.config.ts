import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'wxt';

export default defineConfig({
  manifest: {
    name: 'Inline Grammar',
    description: "Inline grammar and tone assistance using the user's chosen AI provider.",
    host_permissions: ['https://generativelanguage.googleapis.com/*'],
    permissions: ['storage'],
  },
  modules: ['@wxt-dev/module-react'],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
});
