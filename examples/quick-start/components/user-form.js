import React from 'react';
import { LocalForm, Form, actions, Control, Field, Errors } from 'react-redux-form';
import { connect } from 'react-redux';

const required = (val) => !!(val && val.length);

        function hasToBeTrue(value) {
    if (value === false || typeof value !== 'boolean') {
        return false;
    }
    return true;
}

// control

class UserForm extends React.Component {
  constructor(props) {
    super(props);
    this.handleSubmit = this.handleSubmit.bind(this);
  }
  handleSubmit(user) {
    const { dispatch } = this.props;

    // Do whatever you like in here.
    // You can use actions such as:
    // dispatch(actions.submit('user', somePromise));
    // etc.
    const somePromise = new Promise((resolve) => {
      /* eslint-disable no-console */
      console.log(user);
      /* eslint-enable no-console */
      setTimeout(() => { resolve(true); }, 1000);
    });

    dispatch(actions.submit('user', somePromise));
  }
  render() {
    const { forms: { user }, dispatch } = this.props;

    return (
      <LocalForm onSubmit={v=>console.log(v)}>
        <Control.text model=".username" />
      </LocalForm>
    )

    return (
      <Form model="user" onSubmit={this.handleSubmit.bind(this)}>
        <div>
          <label>First name:</label>
          <Control.text model="user.firstName" validators={{len: (val) => val.length > 8}} />
          <Errors model=".firstName" messages={{
            len: 'len must be > 8'
          }} />
        </div>

        <div>
          <label>Last name:</label>
          <Control model="user.lastName" validators={{required}}/>
        </div>

        <Field model="user.bag">
          <label>
            <input type="radio" value="plastic" />
            <span>Plastic</span>
          </label>
          <label>
            <input type="radio" value="paper" />
            <span>Paper</span>
          </label>
        </Field>

        <button type="submit" disabled={!user.$form.valid}>
          Finish registration!
        </button>
        <input type="reset" value="Reset" title="reset"/>
      </Form>
    );
  }
}

UserForm.propTypes = {
  dispatch: React.PropTypes.func.isRequired,
  user: React.PropTypes.shape({
    firstName: React.PropTypes.string.isRequired,
    lastName: React.PropTypes.string.isRequired,
  }).isRequired,
};

export default connect(s=>s)(UserForm);
