import { defineConfig, presetWind3 } from 'unocss';

export default defineConfig({
  presets: [presetWind3()],
  theme: {
    colors: {
      ink: '#070a16',
      accent: '#ffd08a',
      teal: '#8ff0e2',
      violet: '#c9b8ff',
      grey: '#b4b9c9',
    },
  },
});
