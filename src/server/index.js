import React from 'react';
import { flush } from '../style';

let file = [];
export default class JSXStyle extends React.Component {
  componentWillMount() {
    if (this.props.file && file.indexOf(this.props.file) === -1) {
      file.push(this.props.file);
    }
  }

  render() {
    return null;
  }
}

export function flushStyleFile() {
  const _file = [...file];
  file = [];
  return _file;
}

export function flushToHTML() {
  const mem = flush();
  let html = '';
  for (const [id, css] of mem) {
    html += `<style id="${id}">${css}</style>`;
  }
  return html;
}

export function flushToReact() {
  const mem = flush();
  const arr = [];
  for (const [id, css] of mem) {
    arr.push(
      React.createElement('style', {
        id: `${id}`,
        key: `${id}`,
        dangerouslySetInnerHTML: {
          __html: css,
        },
      }),
    );
  }
  return arr;
}
