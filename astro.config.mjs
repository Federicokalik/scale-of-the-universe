import { defineConfig } from 'astro/config';
import UnoCSS from 'unocss/astro';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: process.env.SITE_URL ?? 'https://scale-of-universe.calicchia.design',
  output: 'static',
  trailingSlash: 'always',
  integrations: [UnoCSS({ injectReset: false }), sitemap()],
});
