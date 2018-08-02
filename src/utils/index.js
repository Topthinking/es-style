import _hashString from 'string-hash';

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
  '-',
];

const chlength = ch.length;

function rnd() {
  return Math.floor(Math.random() * chlength);
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

export const hashString = (str) => {
  if (/production|test/.test(process.env.NODE_ENV || '')) {
    let tmp = ch[rnd()] + ch[rnd()] + ch[rnd()] + ch[rnd()];

    while (uniqueIds.indexOf(tmp) !== -1) {
      tmp = ch[rnd()] + ch[rnd()] + ch[rnd()] + ch[rnd()];
    }

    uniqueIds.push(tmp);
    return tmp;
  } else {
    return 'e-' + String(_hashString(str));
  }
};
