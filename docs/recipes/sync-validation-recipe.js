import React from 'react';
import { connect } from 'react-redux';
import { Field } from 'redux-simple-form';

import validator from 'validator';

import Recipe from '../components/recipe-component';

const isRequired = (value) => !validator.isNull(value);

class SyncValidationRecipe extends React.Component {
  render() {
    let { user, userForm } = this.props;

    return (
      <Recipe model="user">
        <h2>Sync Validation</h2>
        <Field model="user.username"
          validators={{
            required: isRequired,
            length: (v) => v && v.length > 15
          }}
          validateOn="blur">
          <label>Username</label>
          <input type="text"/>
          <div className="rsf-error">
          { userForm.field('user.username').errors.required
            && 'Username is required'
          }
          </div>
        </Field>
        <Field model="user.email"
          validators={{
            required: isRequired,
            email: validator.isEmail
          }}
          validateOn="blur">
          <label>Email</label>
          <input type="text" />
          { (userForm.field('user.email').errors.required)
          && <div className="rsf-error">Email address is required</div> }
          { (userForm.field('user.email').errors.email)
          && <div className="rsf-error">Must be valid email address</div> }
        </Field>
        <Field model="user.age"
          parse={(val) => +val}
          validators={{
            required: isRequired,
            number: validator.isInt,
            minAge: (age) => age >= 18
          }}
          validateOn="blur">
          <label>Age</label>
          <input type="text" />
          { (userForm.field('user.age').errors.required)
          && <div className="rsf-error">Age is required</div> }
          { (userForm.field('user.age').errors.number)
          && <div className="rsf-error">Age must be a number</div> }
          { (userForm.field('user.age').errors.minAge)
          && <div className="rsf-error">Must be 18 years or older</div> }
        </Field>
        <button>Submit</button>
      </Recipe>
    );
  }
}

export default connect(s => s)(SyncValidationRecipe);
