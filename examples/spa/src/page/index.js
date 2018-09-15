import React from 'react';
import App from './app';

import bg from '../../images/1.jpg';
import './index.scss';

export default () => (
  <section>
    <h1 className="name bg">hell22o Index</h1>
    <img src={bg} />
    <Ims />
    <App />
  </section>
);

class Ims extends React.Component {
  constructor() {
    super();
    this.state = {
      AnotherComponent: null,
    };
  }

  componentWillMount() {
    import('./home').then((AnotherComponent) => {
      this.setState({
        AnotherComponent: AnotherComponent.default || AnotherComponent,
      });
    });
  }

  render() {
    const Component = this.state.AnotherComponent;
    return Component ? <Component /> : null;
  }
}
