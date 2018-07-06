import React from 'react';
import Home from './detail';
import bg from './bg.svg';
import './index.scss';

export default () => (
  <React.Fragment>
    <div className={`container`}>
      <h1 className="xuicon xuicon-web_ic_play_s_h">鼠标放上来</h1>
    </div>
    <img src={bg} />
    <Home />
  </React.Fragment>
);
