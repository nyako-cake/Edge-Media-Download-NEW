/**
 * esbuild configuration for Eagle Media Downloader plugin
 */

const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

/** X Chat 解密依赖的 wasm 要跟着插件一起发出去 */
function copyWasm() {
  const from = path.join(__dirname, 'node_modules', 'juicebox-sdk', 'juicebox-sdk_bg.wasm');
  const toDir = path.join(__dirname, 'Plugin', 'assets');
  if (!fs.existsSync(from)) return;
  fs.mkdirSync(toDir, { recursive: true });
  fs.copyFileSync(from, path.join(toDir, 'juicebox-sdk_bg.wasm'));
}

const isWatch = process.argv.includes('--watch');

const buildOptions = {
  entryPoints: ['js/plugin.js'],
  bundle: true,
  outfile: 'Plugin/dist/plugin.js',
  platform: 'node',
  format: 'cjs',
  target: 'node16',
  external: [
    'electron'
  ],
  sourcemap: false,
  minify: false,
  logLevel: 'info'
};

async function build() {
  try {
    copyWasm();
    if (isWatch) {
      const ctx = await esbuild.context(buildOptions);
      await ctx.watch();
      console.log('Watching for changes...');
    } else {
      await esbuild.build(buildOptions);
      console.log('Build complete!');
    }
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

build();
