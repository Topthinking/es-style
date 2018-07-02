import systemFs from 'fs-extra';
import chokidar from 'chokidar';
import memoryFs, { set } from './fs';
import { watchImport, clearPaths } from './watch-import';

let watchFiles = [];

const watch = () => {
  if (memoryFs.existsSync('/es-style/watch.json')) {
    let map = memoryFs.readFileSync('/es-style/watch.json', 'utf-8');
    map = JSON.parse(map);
    let keys = Object.keys(map);
    if (keys.length) {
      let error = [];
      watchImport(keys, memoryFs, map, error);
      clearPaths();
      keys = Object.keys(map);

      keys = keys.filter((item) => watchFiles.indexOf(item) === -1);

      watchFiles = [...keys, ...watchFiles];

      if (keys.length) {
        chokidar
          .watch(keys, { ignored: /node_modules/ })
          .on('all', (event, path) => {
            if (event === 'change') {
              const _path = map[path];
              _path.map((item) => {
                systemFs.utimesSync(item, new Date(), new Date(), () => {});
              });
            }
          });
      }

      if (error.length) {
        throw error[0];
      }
    }
  }
};

let isWatch = false;

// express中间件
const ExpressWatch = (compiler, app = null, donecallback = null) => {
  if (isWatch) {
    return;
  }
  isWatch = true;
  const { path, publicPath } = compiler.options.output;

  set({ path, publicPath });
  if (app != null && typeof app.use != 'undefined') {
    app.use((req, res, next) => {
      if (/^\/static\//.test(req.url)) {
        if (memoryFs.existsSync(req.url)) {
          res
            .status(200)
            .attachment(req.url)
            .send(memoryFs.readFileSync(req.url));
          return;
        }
      }
      next();
    });
  }
  compiler.plugin('done', async (stats) => {
    try {
      watch();
      donecallback && donecallback(stats);
    } catch (error) {
      throw error;
    }
  });
  return compiler;
};

// koa 中间件
const KoaWatch = (compiler, app = null, donecallback = null) => {
  if (isWatch) {
    return;
  }
  isWatch = true;
  const { path, publicPath } = compiler.options.output;

  set({ path, publicPath });
  if (app != null && typeof app.use != 'undefined') {
    app.use(async (ctx, next) => {
      if (/^\/static\//.test(ctx.request.url)) {
        if (memoryFs.existsSync(ctx.request.url)) {
          ctx.status = 200;
          ctx.type = 'jpg';
          ctx.body = memoryFs.readFileSync(ctx.request.url);
          return;
        }
      }
      await next();
    });
  }
  compiler.plugin('done', async (stats) => {
    try {
      watch();
      donecallback && donecallback(stats);
    } catch (error) {
      throw error;
    }
  });
  return compiler;
};

module.exports = {
  ExpressWatch,
  KoaWatch,
};
