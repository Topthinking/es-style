const { getOptions } = require('loader-utils');

module.pitch = function pitch(ReRequest, PreRequest, data) {
  const query = getOptions(this) || {};
  // const childCompiler = this._compilation.createChildCompiler();
  // console.log(123, childCompiler);
};

module.exports = function loader(source) {
  const options = getOptions(this);

  console.log(source);

  // source = source.replace(options.name, 'abc');

  return 'module.exports =  `' + source + '`';
};
