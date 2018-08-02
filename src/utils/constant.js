export const STYLE_COMPONENT = '_ESStyle';
export const STYLE_DATA_ES = /production|test/.test(process.env.NODE_ENV || '')
  ? ''
  : 'e-';
export const STYLE_COMPONENT_CSS = 'css';
export const STYLE_COMPONENT_STYLEID = 'styleId';
