// npm publish
const path = require('path');
const del = require('del');
const fs = require('fs');
const beautify = require('js-beautify').js_beautify;
const child_process = require('child_process');

const clean = async () => {
  await del(path.join(__dirname, 'publish'), { force: true });
};

const copy = async (from, to) => {
  await child_process.spawn('cp', ['-r', from, to]);
};

const main = async () => {
  await clean();
  await child_process.spawn('mkdir', ['publish']);
  await copy('./dist', './publish/dist');

  await copy('./babel.js', './publish');
  await copy('./webpack-plugin.js', './publish');
  await copy('./watch.js', './publish');
  await copy('./server.js', './publish');
  await copy('./index.js', './publish');

  await copy('./README.md', './publish');
  await copy('./License', './publish');

  const data = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));

  delete data.scripts.postinstall;

  fs.writeFileSync(
    './publish/package.json',
    beautify(JSON.stringify(data), { indent_size: 2 }),
  );
};

module.exports = main();
