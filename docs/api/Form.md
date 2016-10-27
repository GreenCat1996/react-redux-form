# Form Component

The `<Form>` component is a decorated `<form>` component with a few helpful props. It is useful for blocking `onSubmit` handlers when the form is invalid. Validation is specified by the `validators` and/or `errors` prop.

```jsx
import { Form, Control } from 'react-redux-form';
import { isEmail, isNull } from 'validator';

const required = isNull;

const passwordsMatch = ({ password, confirmPassword }) => {
  return password === confirmPassword;
};

// in render() return block:
<Form model="user"
  validators={{
    '': { passwordsMatch },
    email: { required, isEmail },
    password: { required },
    confirmPassword: { required }
  }}
  onSubmit={...}>
  <Control
    type="email"
    model=".email"
  />
  
  <Control
    type="password"
    model=".password"
  />

  <Control
    type="password"
    model=".confirmPassword"
  />

  <button>Submit!</button>
</Form>
```

# Prop Types

## `model="..."` (required)
_(String | Function)_: The string representing the model value of the entire form in the store.

Typically, the `<Control>` (and/or `<Field>`) components nested inside `<Form>` would be _members_ of the form model; e.g. `user.email` and `user.password` are members of the `user` model.

You can also use [partial models](../guides/partial-models) for `<Control>`, `<Field>`, and `<Errors>` components inside of `<Form>` - they will be resolved to the form's model.

## `validators={{...}}`
_(Object)_: An object representing the validators for the fields inside the form, where:

- the **keys** are the field model names (e.g. `'email'` for `user.email`)
- the **values** are validator(s) for the field model. They can be:
  - a validator function, which receives the field model value, or
  - a validator object, with validation keys and validator functions as values, also receiving the field model value.

If the key is the empty string (`'': {...}`), then the validator will belong to the form model itself (i.e., it is for form-wide validation).

Validation will occur on _any field model change_ by default, and only the validators for the fields that have changed will be run (as a performance enhancement)!

### Notes
- Specifying validators on the form is usually sufficient - you don't need to put validators on the `<Field>` or `<Control>` for most use cases.
- If you need validators to run on submit, this is the place to put them.

## `errors={{...}}`
_(Object)_: An object representing the error validators for the fields inside the form, where:

- the **keys** are the field model names (e.g. `'email'` for `user.email`)
- the **values** are error validator(s) for the field model. They can be:
  - an error validator function, which receives the field model value, or
  - an error validator object, with validation keys and error validator functions as values, also receiving the field model value.

Its behavior is identical to the `validators={{...}}` prop, with the exception that an error validator that returns anything truthy is interpreted as an _error_. See [the validation guide](../guides/validation) for more info.

## `validateOn="..."`
_(String)_: A string that indicates when `validators` or `errors` (for error validators) should run.

By default, validators will only run whenever a field in the form's `model` changes, and
- only for the field that has changed, and
- always for any form-wide validators.

The possible values are:
- `"change"` (Default): run validation whenever a field model value changes
- `"submit"`: run validation only when submitting the form.

### Notes
- Keep in mind, validation will always run initially, when the form is loaded.
- If you want better performance, you can use `validateOn="submit"`, depending on your use-case.

## `onSubmit={...}`
_(Function)_: The handler function called when the form is submitted. This works almost exactly like a normal `<form onSubmit={...}>` handler, with a few differences:

- The submit event's default action is prevented by default, using `event.preventDefault()`.
- The `onSubmit` handler _will not execute_ if the form is invalid.
- The `onSubmit` handler receives the form model data, not the event.

The function passed into `onSubmit={...}` will be called with one argument: the form's model value.

### Example
```jsx
import React from 'react';
import { connect } from 'react-redux';
import { Form, Control, actions } from 'react-redux-form';

class MyForm extends React.Component {
  handleSubmit(user) {
    const { dispatch } = this.props;
    let userPromise = fetch('...', {
      method: 'post',
      body: user
    })
    .then((res) => res.json())
    .then((res) => {
      // ...
    });
    
    dispatch(actions.submit('user', userPromise));
  }
  
  render() {
    return (
      <Form
        model="user"
        validators={{...}}
        onSubmit={ (user) => this.handleSubmit(user) }
      >
        <Control type="email" model=".email" />
      </Form>
    );
  }
}

export default connect(null)(MyForm);
```
- Here, `handleSubmit()` will _not_ be called if any of the `validators` (or `errors`, if specified) are not valid.
- `handleSubmit(user)` receives the `user` model value, since `model="user"` on the `<Form>` component.

### Notes
- You can do anything in `onSubmit`; including firing off custom actions or handling (async) validation yourself.

## `component={...}`
_(Any)_ The `component` that the `<Form>` should be rendered to (default: `"form"`).

### Notes
- For React Native, the `View` component is used to render the form, if you `import { Form } from 'react-redux-form/native'`.
- In HTML, you are not allowed to nest forms. If you do want to nest forms, you will have to do one of the following:
  - If you want a nested form that doesn't submit, you can set the nested form's component to something other than `'form'`, like `<Form component="div" ...>`
  - If you _do_ want a "form" inside a form that does submit, you'll have to set the component and submit manually by dispatching `actions.validSubmit(model, promise)`.
