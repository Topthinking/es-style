import React from 'react';
import './home.scss';

export default () => (
  <section>
    <h1 className="name bg">hell22o Index</h1>
    <img src={bg} />
    <Ims />
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
    import('./detail').then((AnotherComponent) => {
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
