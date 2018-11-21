import path from 'path';
import fs from 'fs-extra';

const cache = new Map();

const defaultConfig = {
  plugins: [],
  limit: null,
};

export default ({ dir = process.cwd(), refresh = false } = {}) => {
  //强制刷新获取最新的配置信息，一般是开发环境使用
  if (refresh) {
    return loadConfig(dir, refresh);
  }

  if (!cache.has(dir)) {
    cache.set(dir, loadConfig(dir, refresh));
  }
  return cache.get(dir);
};

const loadConfig = (dir, refresh) => {
  const esConfigPath = path.join(dir, '.es-style.json');

  let userConfig = {};

  if (fs.existsSync(esConfigPath)) {
    userConfig = JSON.parse(fs.readFileSync(esConfigPath, 'utf-8'));
  }

  return withDefaults(userConfig);
};

const withDefaults = (config) => {
  return Object.assign({}, defaultConfig, config);
};
