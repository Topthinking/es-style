import React from 'react';
import ReactDOM from 'react-dom';
import App from './page/other';

if (process.env.NODE_ENV === 'production') {
  ReactDOM.render(
    <React.Fragment>
      <App />
    </React.Fragment>,
    document.getElementById('root'),
  );
} else {
  const { AppContainer } = require('react-hot-loader');
  ReactDOM.render(
    <AppContainer>
      <App />
    </AppContainer>,
    document.getElementById('root'),
  );

  if (module.hot) {
    module.hot.accept();
  }
}
