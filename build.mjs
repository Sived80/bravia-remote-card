// Compila la card in dist/bravia-remote-card.js (un solo file, Lit compreso).
// La versione viene letta da package.json.
import { build, context } from 'esbuild';
import { readFileSync } from 'node:fs';

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));
const options = {
  entryPoints: ['src/bravia-remote-card.ts'],
  bundle: true,
  minify: true,
  format: 'esm',
  target: 'es2021',
  loader: { '.svg': 'text' },
  legalComments: 'none',
  define: { __VERSION__: JSON.stringify(version) },
  outfile: 'dist/bravia-remote-card.js',
  logLevel: 'info',
};

if (process.argv.includes('--watch')) {
  await (await context(options)).watch();
} else {
  await build(options);
}
