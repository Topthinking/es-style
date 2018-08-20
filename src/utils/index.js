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
  '-',
  '_',
];

const chlength = ch.length;

function rnd() {
  return Math.floor(Math.random() * chlength);
}

function randomValue() {
  return ch[rnd()] + ch[rnd()] + ch[rnd()] + ch[rnd()];
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

export const hashString = (str) => {
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
      return _config[str];
    } else {
      let tmp = randomValue();

      // 如果随机值已经存在，或者随机值以数字开头，都需要重新随机
      while (
        !/^[a-zA-z]/.test(tmp) ||
        uniqueIds.indexOf(tmp) !== -1 ||
        uniqueValue.indexOf(tmp) !== -1
      ) {
        tmp = randomValue();
      }
      _config[str] = tmp;
      uniqueIds.push(tmp);

      fs.writeFileSync(configFile, JSON.stringify(_config));

      return tmp;
    }
  } else {
    return 'e-' + String(_hashString(str));
  }
};
