import _hashString from 'string-hash';
import fs from 'fs-extra';
import path from 'path';

let uniqueIds = [];

const ch = [
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'I',
  'J',
  'K',
  'L',
  'M',
  'N',
  'O',
  'P',
  'Q',
  'R',
  'S',
  'T',
  'U',
  'V',
  'W',
  'X',
  'Y',
  'Z',
  'a',
  'b',
  'c',
  'd',
  'e',
  'f',
  'g',
  'h',
  'i',
  'j',
  'k',
  'l',
  'm',
  'n',
  'o',
  'p',
  'q',
  'r',
  's',
  't',
  'u',
  'v',
  'w',
  'x',
  'y',
  'z',
  '0',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '_',
];

const chlength = ch.length;

function rnd() {
  return Math.floor(Math.random() * chlength);
}

function myFunction(begin, end) {
  var num = Math.round(Math.random() * (end - begin) + begin);
  return num;
}

function randomValue() {
  const le = Math.round(Math.random() * 2 + 2);
  return (ch[rnd()] + ch[rnd()] + ch[rnd()] + ch[rnd()]).substr(0, le);
}

export const isObject = (obj) => {
  if (
    typeof obj !== 'undefined' &&
    Object.prototype.toString.call(obj) === '[object Object]'
  ) {
    return true;
  }
  return false;
};

//判断是否import引入了需要解析的后缀
export const shouldBeParseStyle = (path) => {
  const accept = ['.scss', '.sass', '.css'];

  for (const extension of accept) {
    if (path.endsWith(extension)) {
      return true;
    }
  }

  return false;
};

//判断是否import引入了需要解析的后缀
export const shouldBeParseImage = (path) => {
  const accept = ['.png', '.jpg', '.gif', '.jpeg', '.svg'];

  for (const extension of accept) {
    if (path.endsWith(extension)) {
      return true;
    }
  }

  return false;
};

const configFile = path.join(process.cwd(), '.es.json');

export const hashString = (str, classSelector = []) => {
  if (/production|test/.test(process.env.NODE_ENV || '')) {
    str = _hashString(str);
    let config = {};

    if (fs.existsSync(configFile)) {
      config = JSON.parse(fs.readFileSync(configFile, 'utf-8'));
    }

    // 针对配置文件进行去重
    const uniqueValue = [];
    const _config = {};

    for (let key in config) {
      if (uniqueValue.indexOf(config[key]) === -1) {
        uniqueValue.push(config[key]);
        _config[key] = config[key];
      }
    }

    if (_config[str]) {
      if (classSelector.indexOf(_config[str]) === -1) {
        return _config[str];
      }
    }

    let tmp = randomValue();

    // 如果随机值已经存在，或者随机值以数字开头，都需要重新随机
    while (
      /^[\d]/.test(tmp) || // 直接数字开头
      uniqueIds.indexOf(tmp) !== -1 || // 已经存在的随机数
      uniqueValue.indexOf(tmp) !== -1 || // 之前已经生成的随机数
      classSelector.indexOf(tmp) !== -1 // 和类名一致的随机数
    ) {
      tmp = randomValue();
    }
    _config[str] = tmp;
    uniqueIds.push(tmp);

    fs.writeFileSync(configFile, JSON.stringify(_config));

    return tmp;
  } else {
    return 'e-' + String(_hashString(str));
  }
};

export const dev = () =>
  process.env.NODE_ENV === 'development' ||
  typeof process.env.NODE_ENV === 'undefined';
