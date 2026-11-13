import { defineConfig } from 'astro/config';
import UnoCSS from 'unocss/astro';
import sitemap from '@astrojs/sitemap';

// The site lives in a folder of the default GitHub Pages address. Both parts can be overridden
// (the browser tests build it at the root with BASE_PATH=/).
export default defineConfig({
  site: process.env.SITE_URL || 'https://federicokalik.github.io',
  base: process.env.BASE_PATH || '/scale-of-the-universe/',
  output: 'static',
  trailingSlash: 'always',
  integrations: [UnoCSS({ injectReset: false }), sitemap()],
});
