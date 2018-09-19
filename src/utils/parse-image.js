import fs from 'fs-extra';
import memoryFs, { get } from '../watch/fs';
import mime from 'mime';
import requireResolve from 'require-resolve';
import md5 from 'md5';
import { resolve, basename, join } from 'path';

export default ({
  publicEntry,
  url,
  reference,
  write,
  imageOptions,
  publicPath = '/',
} = {}) => {
  imageOptions.path = imageOptions.path || 'dist/images';

  const watchData = get();

  if (Object.keys(watchData).length) {
    publicEntry = watchData.path;
    publicPath = watchData.publicPath;
  }

  let new_src = url;
  // http:// https:// //
  if (!/^http(s)?:|^\/\//.test(url)) {
    const mod = requireResolve(url, resolve(reference));
    if (!mod || !mod.src) {
      throw new Error(`Path '${url}' could not be found for '${reference}'`);
      if (/production|test/.test(process.env.NODE_ENV)) {
        process.exit(1);
      }
      new_src = `/error.png?error=Path-${url}-could-not-be-found-for-${reference}`;
    } else {
      const src = mod.src;
      const stat = fs.statSync(src);
      const data = fs.readFileSync(src);

      if (imageOptions.limit && stat.size < imageOptions.limit) {
        //转成base64
        const mimetype = mime.getType(src);
        new_src = `data:${mimetype || ''};base64,${data.toString('base64')}`;
      } else {
        //拷贝图片到输出目录
        /**
         * /user/a
         * /user/a/dist
         * imageName.ext
         */
        const filename = basename(src);
        let _filename = filename.split('.');
        let ext = _filename.pop();
        _filename = _filename.join('.');
        //文件名称
        _filename = _filename + '_' + md5(data).substr(0, 7) + '.' + ext;

        if (write) {
          // 当前可写资源
          new_src = [publicPath, imageOptions.path, _filename].join('');
          fs.copySync(src, join(publicEntry, imageOptions.path, _filename));
        } else {
          // 当前资源不可写，输出到内存中...
          const new_dir = join('/static', imageOptions.path);

          if (!memoryFs.existsSync(new_dir)) {
            memoryFs.mkdirpSync(new_dir);
          }

          new_src = join(new_dir, _filename);

          memoryFs.writeFileSync(new_src, data);
        }
      }
    }
  }

  return new_src;
};
