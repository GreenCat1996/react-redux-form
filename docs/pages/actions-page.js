import React from 'react';

import Markdown, { js } from '../components/markdown-component';

const content =
`
## Actions

Redux Simple Form is built around a single action that describes all
changes to your models, the \`change(model, value)\` action.

${js`
import React from 'react';
import { connect } from 'react-redux';
import {
  actions
} from 'redux-simple-form';

export default class UserForm extends React.Component {
  render() {
    let { dispatch, user } = this.props;

    return (
      <div>
        <h1>Name: { user.name }</h1>
        <button onClick={() =>
          dispatch(actions.change('user.name', 'David'))}>
          Change name to David
        </button>
      </div>
    );
  }
}
`}

`;

const IntroPage = () => (
  <Markdown content={content} />
);

export default IntroPage;
