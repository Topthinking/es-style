import React from 'react';
import { flush } from '../style';

const file = [];
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
  return file;
}

export function flushToHTML() {
  const mem = flush();
  let html = '';
  for (const [id, css] of mem) {
    html += `<style id="${id}">${css}</style>`;
  }
  return html;
}
