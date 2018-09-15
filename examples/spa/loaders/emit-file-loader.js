const loaderUtils = require('loader-utils');

module.exports = function(content, sourceMap) {
  this.cacheable();
  const query = loaderUtils.getOptions(this);

  console.log(query);
  let name = query.name || '[hash].[ext]';
  const context =
    query.context || this.rootContext || (this.options && this.options.context);
  const regExp = query.regExp;
  const opts = { context, content, regExp };
  const interpolatedName = loaderUtils.interpolateName(this, name, opts);

  console.log(interpolatedName);

  if (/\.ts(x?)$/.test(interpolatedName)) {
    name = name.replace('[ext]', '[js]');
  }

  const emit = (code, map) => {
    this.emitFile(interpolatedName, code, false);
    this.callback(null, code);
  };

  if (query.transform) {
    const transformed = query.transform({
      content,
      sourceMap,
      interpolatedName,
    });
    return emit(transformed.content, transformed.sourceMap);
  }

  return emit(content, sourceMap);
};
