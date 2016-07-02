/* eslint react/no-multi-comp:0 react/jsx-no-bind:0 */
import { assert } from 'chai';
import React from 'react';
import { findDOMNode } from 'react-dom';
import TestUtils from 'react-addons-test-utils';
import { applyMiddleware, combineReducers, createStore } from 'redux';
import { Provider } from 'react-redux';
import thunk from 'redux-thunk';
import createTestStore from 'redux-test-store';
import sinon from 'sinon';

import { Form, modelReducer, formReducer, Field, actions, actionTypes } from '../src';

describe('<Form> component', () => {
  describe('wraps component if specified', () => {
    const store = applyMiddleware(thunk)(createStore)(combineReducers({
      testForm: formReducer('test', {}),
      test: modelReducer('test'),
    }));

    it('should wrap children with specified component (string)', () => {
      const form = TestUtils.renderIntoDocument(
        <Provider store={store}>
          <Form model="test" component="section" />
        </Provider>
      );

      const wrapper = TestUtils.findRenderedDOMComponentWithTag(form, 'section');

      assert.ok(wrapper);
    });

    it('should wrap children with specified component (class)', () => {
      class Wrapper extends React.Component {
        render() {
          const { children, ...other } = this.props;
          return <form className="wrapper" {...other}>{children}</form>;
        }
      }
      Wrapper.propTypes = {
        children: React.PropTypes.object,
      };
      const form = TestUtils.renderIntoDocument(
        <Provider store={store}>
          <Form model="test" component={Wrapper} />
        </Provider>
      );

      const wrapper = TestUtils.findRenderedDOMComponentWithClass(form, 'wrapper');

      assert.ok(wrapper);
    });
    it('Renders as <form> by default', () => {
      const field = TestUtils.renderIntoDocument(
        <Provider store={store}>
          <Form model="test" />
        </Provider>
      );

      const wrapper = TestUtils.findRenderedDOMComponentWithTag(field, 'form');

      assert.ok(wrapper);
    });
  });

  describe('validation on submit', () => {
    function fixture() {
      const store = applyMiddleware(thunk)(createStore)(combineReducers({
        testForm: formReducer('test', { foo: '', bar: '' }),
        test: modelReducer('test', { foo: '', bar: '' }),
      }));

      let timesValidated = 0;

      function getTimesValidated() {
        return timesValidated;
      }

      const form = TestUtils.renderIntoDocument(
        <Provider store={store}>
          <Form model="test"
            validators={{
              foo: (val) => {
                timesValidated += 1;
                return val === 'testing foo';
              },
              bar: {
                one: (val) => val && val.length >= 1,
                two: (val) => val && val.length >= 2,
              },
            }}
            validateOn="submit"
          >
            <Field model="test.foo">
              <input type="text" />
            </Field>

            <Field model="test.bar">
              <input type="text" />
            </Field>
          </Form>
        </Provider>
      );

      const formElement = TestUtils.findRenderedDOMComponentWithTag(form, 'form');

      const [fooControl, barControl] = TestUtils.scryRenderedDOMComponentsWithTag(form, 'input');

      return {
        store,
        form,
        formElement,
        fooControl,
        barControl,
        timesValidated: getTimesValidated,
      };
    }

    it('should only have validated once (on load) before submit', () => {
      const { timesValidated } = fixture();

      assert.equal(timesValidated(), 1);
    });

    it('should not validate on change', () => {
      const { fooControl, timesValidated } = fixture();

      TestUtils.Simulate.change(fooControl);

      assert.equal(timesValidated(), 1);
    });

    it('should validate all validators on submit', () => {
      const {
        formElement,
        store,
        timesValidated,
        fooControl,
      } = fixture();

      assert.equal(timesValidated(), 1);

      TestUtils.Simulate.submit(formElement);

      assert.equal(timesValidated(), 2);

      assert.containSubset(
        store.getState().testForm.fields.foo,
        { valid: false });

      fooControl.value = 'testing foo';

      TestUtils.Simulate.change(fooControl);

      assert.equal(
        store.getState().test.foo,
        'testing foo');

      assert.equal(timesValidated(), 2,
        'should not have validated again before submit');

      TestUtils.Simulate.submit(formElement);

      assert.equal(timesValidated(), 3);

      assert.containSubset(
        store.getState().testForm.fields.foo,
        { valid: true });
    });

    it('should allow for keywise validation', () => {
      const { formElement, store, barControl } = fixture();

      TestUtils.Simulate.submit(formElement);

      assert.containSubset(
        store.getState().testForm.fields.bar,
        {
          errors: { one: true, two: true },
          valid: false,
        });

      barControl.value = '1';
      TestUtils.Simulate.change(barControl);

      assert.equal(
        store.getState().test.bar,
        '1');

      TestUtils.Simulate.submit(formElement);

      assert.containSubset(
        store.getState().testForm.fields.bar,
        {
          errors: { one: false, two: true },
          valid: false,
        });

      barControl.value = '12';
      TestUtils.Simulate.change(barControl);

      assert.equal(
        store.getState().test.bar,
        '12');

      TestUtils.Simulate.submit(formElement);

      assert.containSubset(
        store.getState().testForm.fields.bar,
        {
          errors: { one: false, two: false },
          valid: true,
        });
    });
  });

  describe('error validation on submit', () => {
    const store = applyMiddleware(thunk)(createStore)(combineReducers({
      testForm: formReducer('test'),
      test: modelReducer('test', {
        foo: '',
        bar: '',
      }),
    }));

    const form = TestUtils.renderIntoDocument(
      <Provider store={store}>
        <Form model="test"
          errors={{
            foo: (val) => val !== 'valid foo' && 'invalid foo',
            bar: {
              one: (val) => val.length < 1 && 'bar too short',
              two: (val) => val.length > 2 && 'bar too long',
            },
          }}
        >
          <Field model="test.foo">
            <input type="text" />
          </Field>

          <Field model="test.bar">
            <input type="text" />
          </Field>
        </Form>
      </Provider>
    );

    const formElement = TestUtils.findRenderedDOMComponentWithTag(form, 'form');

    const [fooControl, barControl] = TestUtils.scryRenderedDOMComponentsWithTag(form, 'input');

    it('should validate all validators on submit', () => {
      TestUtils.Simulate.submit(formElement);

      assert.containSubset(
        store.getState().testForm.fields.foo,
        {
          valid: false,
          errors: 'invalid foo',
        });

      fooControl.value = 'valid foo';

      TestUtils.Simulate.change(fooControl);

      TestUtils.Simulate.submit(formElement);

      assert.containSubset(
        store.getState().testForm.fields.foo,
        {
          valid: true,
          errors: false,
        });
    });

    it('should allow for keywise validation', () => {
      TestUtils.Simulate.submit(formElement);

      assert.containSubset(
        store.getState().testForm.fields.bar,
        {
          errors: {
            one: 'bar too short',
            two: false,
          },
          valid: false,
        });

      barControl.value = '1';
      TestUtils.Simulate.change(barControl);
      TestUtils.Simulate.submit(formElement);

      assert.containSubset(
        store.getState().testForm.fields.bar,
        {
          errors: {
            one: false,
            two: false,
          },
          valid: true,
        });

      barControl.value = '12';
      TestUtils.Simulate.change(barControl);
      TestUtils.Simulate.submit(formElement);

      assert.containSubset(
        store.getState().testForm.fields.bar,
        {
          errors: {
            one: false,
            two: false,
          },
          valid: true,
        });

      barControl.value = '123';
      TestUtils.Simulate.change(barControl);
      TestUtils.Simulate.submit(formElement);

      assert.containSubset(
        store.getState().testForm.fields.bar,
        {
          errors: {
            one: false,
            two: 'bar too long',
          },
          valid: false,
        });
    });
  });

  describe('error validation from silent changes on submit', () => {
    const store = applyMiddleware(thunk)(createStore)(combineReducers({
      testForm: formReducer('test'),
      test: modelReducer('test', {
        foo: 'valid foo',
        bar: '',
      }),
    }));

    const form = TestUtils.renderIntoDocument(
      <Provider store={store}>
        <Form model="test"
          errors={{
            foo: (val) => val !== 'valid foo' && 'invalid foo',
            bar: {
              one: (val) => val.length < 1 && 'bar too short',
              two: (val) => val.length > 2 && 'bar too long',
            },
          }}
        >
          <Field model="test.foo">
            <input type="text" />
          </Field>

          <Field model="test.bar">
            <input type="text" />
          </Field>
        </Form>
      </Provider>
    );

    const formElement = TestUtils.findRenderedDOMComponentWithTag(form, 'form');

    it('should show correct initial error messages', () => {
      assert.deepEqual(
        store.getState().testForm.fields.bar.errors,
        {
          one: 'bar too short',
          two: false,
        });
    });

    it('should validate errors upon submit after silent changes', () => {
      store.dispatch(actions.load('test.foo', 'nope'));

      TestUtils.Simulate.submit(formElement);

      assert.equal(
        store.getState().testForm.fields.foo.errors,
        'invalid foo');
    });
  });

  describe('validation on change (default)', () => {
    const store = applyMiddleware(thunk)(createStore)(combineReducers({
      testForm: formReducer('test'),
      test: modelReducer('test', {
        foo: '',
        bar: '',
      }),
    }));

    let timesBarValidationCalled = 0;

    const form = TestUtils.renderIntoDocument(
      <Provider store={store}>
        <Form model="test"
          validators={{
            foo: (val) => val && val === 'testing foo',
            bar: {
              one: (val) => val && val.length >= 1,
              two: (val) => val && val.length >= 2,
              called: () => {
                timesBarValidationCalled += 1;
                return true;
              },
            },
          }}
        >
          <Field model="test.foo">
            <input type="text" />
          </Field>

          <Field model="test.bar">
            <input type="text" />
          </Field>
        </Form>
      </Provider>
    );

    const [fooControl] = TestUtils.scryRenderedDOMComponentsWithTag(form, 'input');

    it('should validate form validators initially on load', () => {
      assert.equal(timesBarValidationCalled, 1);
    });

    it('should validate form validators on field change', () => {
      fooControl.value = 'invalid';

      TestUtils.Simulate.change(fooControl);

      assert.containSubset(
        store.getState().testForm.fields.foo,
        {
          errors: true,
          valid: false,
        });

      fooControl.value = 'testing foo';

      TestUtils.Simulate.change(fooControl);

      assert.containSubset(
        store.getState().testForm.fields.foo,
        {
          errors: false,
          valid: true,
        });
    });

    it('should NOT run validation for fields that have not changed', () => {
      fooControl.value = 'invalid';

      TestUtils.Simulate.change(fooControl);

      assert.equal(timesBarValidationCalled, 1);
    });
  });

  describe('error validation on change', () => {
    const store = applyMiddleware(thunk)(createStore)(combineReducers({
      testForm: formReducer('test'),
      test: modelReducer('test', {
        foo: '',
        bar: '',
      }),
    }));

    let timesBarValidationCalled = 0;

    const form = TestUtils.renderIntoDocument(
      <Provider store={store}>
        <Form model="test"
          errors={{
            foo: (val) => val !== 'valid foo' && 'invalid foo',
            bar: () => {
              timesBarValidationCalled += 1;
              return 'bar validated';
            },
          }}
          validateOn="change"
        >
          <Field model="test.foo">
            <input type="text" />
          </Field>

          <Field model="test.bar">
            <input type="text" />
          </Field>
        </Form>
      </Provider>
    );

    const [fooControl] = TestUtils.scryRenderedDOMComponentsWithTag(form, 'input');

    it('should validate form validators initially on load', () => {
      assert.equal(timesBarValidationCalled, 1);
    });

    it('should validate form error validators on field change', () => {
      fooControl.value = 'invalid';

      TestUtils.Simulate.change(fooControl);

      assert.containSubset(
        store.getState().testForm.fields.foo,
        {
          errors: 'invalid foo',
          valid: false,
        });

      fooControl.value = 'valid foo';

      TestUtils.Simulate.change(fooControl);

      assert.containSubset(
        store.getState().testForm.fields.foo,
        {
          errors: false,
          valid: true,
        });
    });

    it('should NOT run validation for fields that have not changed', () => {
      fooControl.value = 'testing';

      TestUtils.Simulate.change(fooControl);

      assert.equal(timesBarValidationCalled, 1);
    });
  });

  describe('maintaining field validation state', () => {
    const initialState = { foo: '', bar: '' };

    const required = (val) => val && val.length;

    const store = applyMiddleware(thunk)(createStore)(combineReducers({
      testForm: formReducer('test', initialState),
      test: modelReducer('test', initialState),
    }));

    const form = TestUtils.renderIntoDocument(
      <Provider store={store}>
        <Form model="test"
          validators={{
            foo: required,
            bar: required,
          }}
          validateOn="change"
        >
          <Field model="test.foo">
            <input type="text" />
          </Field>

          <Field model="test.bar">
            <input type="text" />
          </Field>
        </Form>
      </Provider>
    );

    const [fooControl, barControl] = TestUtils.scryRenderedDOMComponentsWithTag(form, 'input');

    it('should initially be invalid', () => {
      assert.isFalse(store.getState().testForm.valid);
    });

    it('should still be invalid if fields are still invalid', () => {
      fooControl.value = 'valid';
      TestUtils.Simulate.change(fooControl);

      assert.isTrue(
        store.getState().testForm.fields.foo.valid,
        'foo should be valid');
      assert.isFalse(
        store.getState().testForm.fields.bar.valid,
        'bar should be invalid');

      assert.isFalse(
        store.getState().testForm.valid,
        'form should be invalid');
    });

    it('should be valid once all fields are valid', () => {
      fooControl.value = 'valid';
      TestUtils.Simulate.change(fooControl);
      barControl.value = 'valid';
      TestUtils.Simulate.change(barControl);

      assert.isTrue(
        store.getState().testForm.fields.foo.valid,
        'foo should be valid');
      assert.isTrue(
        store.getState().testForm.fields.bar.valid,
        'bar should be valid');

      assert.isTrue(
        store.getState().testForm.valid,
        'form should be valid');
    });
  });

  describe('onSubmit() prop', () => {
    const store = applyMiddleware(thunk)(createStore)(combineReducers({
      testForm: formReducer('test'),
      test: modelReducer('test', {
        foo: '',
        bar: '',
        baz: '',
      }),
    }));

    let submitValue = null;

    const form = TestUtils.renderIntoDocument(
      <Provider store={store}>
        <Form model="test"
          validators={{
            foo: (val) => val && val === 'valid',
            baz: {
              validationKey: (val) => val && val === 'valid',
            },
          }}
          errors={{
            bar: (val) => val !== 'bar' && 'bar invalid',
          }}
          onSubmit={(val) => {
            submitValue = val;
            return true;
          }}
        >
          <Field model="test.foo">
            <input type="text" />
          </Field>

          <Field model="test.bar">
            <input type="text" />
          </Field>

          <Field model="test.baz">
            <input type="text" />
          </Field>
        </Form>
      </Provider>
    );

    const formElement = TestUtils.findRenderedDOMComponentWithTag(form, 'form');

    const [fooControl, barControl, bazControl] = TestUtils
      .scryRenderedDOMComponentsWithTag(form, 'input');

    it('should NOT call onSubmit if form is invalid', () => {
      TestUtils.Simulate.submit(formElement);

      assert.isNull(submitValue);

      fooControl.value = 'valid';

      TestUtils.Simulate.change(fooControl);

      assert.isTrue(
        store.getState().testForm.fields.foo.valid);

      assert.isNull(submitValue);
    });

    it('should set submitFailed to true if form is invalid and submitted', () => {
      TestUtils.Simulate.submit(formElement);

      assert.isTrue(store.getState().testForm.submitFailed);
    });

    it('should call onSubmit with model value if form is valid', () => {
      barControl.value = 'bar';

      TestUtils.Simulate.change(barControl);

      TestUtils.Simulate.submit(formElement);

      assert.isNull(submitValue,
        'should not be valid yet because baz is still invalid');

      bazControl.value = 'valid';

      TestUtils.Simulate.change(bazControl);

      assert.deepEqual(
        store.getState().test,
        {
          foo: 'valid',
          bar: 'bar',
          baz: 'valid',
        });

      TestUtils.Simulate.submit(formElement);

      assert.deepEqual(
        submitValue,
        {
          bar: 'bar',
          baz: 'valid',
          foo: 'valid',
        });
    });
  });

  describe('validation of form itself', () => {
    const store = applyMiddleware(thunk)(createStore)(combineReducers({
      testForm: formReducer('test'),
      test: modelReducer('test', {
        foo: '',
        bar: '',
      }),
    }));

    const form = TestUtils.renderIntoDocument(
      <Provider store={store}>
        <Form model="test"
          validators={{
            '': {
              foobar: (val) => val.foo + val.bar === 'foobar',
            },
          }}
          errors={{
            '': {
              formError: (val) => val.foo === 'error' && 'form error',
            },
          }}
        >
          <Field model="test.foo">
            <input type="text" />
          </Field>
          <Field model="test.bar">
            <input type="text" />
          </Field>
        </Form>
      </Provider>
    );

    const formElement = TestUtils.findRenderedDOMComponentWithTag(form, 'form');

    const [fooControl, barControl] = TestUtils.scryRenderedDOMComponentsWithTag(form, 'input');

    it('should be able to set keyed validation to the form model', () => {
      TestUtils.Simulate.submit(formElement);

      assert.containSubset(
        store.getState().testForm,
        { valid: false });

      fooControl.value = 'foo';
      TestUtils.Simulate.change(fooControl);

      barControl.value = 'bar';
      TestUtils.Simulate.change(barControl);

      TestUtils.Simulate.submit(formElement);

      assert.containSubset(
        store.getState().testForm,
        { valid: true });
    });

    it('should be able to set keyed errors to the form model', () => {
      fooControl.value = 'error';

      TestUtils.Simulate.change(fooControl);
      TestUtils.Simulate.submit(formElement);

      assert.containSubset(
        store.getState().testForm,
        {
          valid: false,
          errors: {
            foobar: true,
            formError: 'form error',
          },
        });
    });
  });

  describe('external validators', () => {
    const store = applyMiddleware(thunk)(createStore)(combineReducers({
      testForm: formReducer('test'),
      test: modelReducer('test', {
        foo: '',
        bar: '',
      }),
    }));

    let timesSubmitCalled = 0;

    function handleSubmit() {
      timesSubmitCalled++;
    }

    const form = TestUtils.renderIntoDocument(
      <Provider store={store}>
        <Form model="test"
          onSubmit={handleSubmit}
        >
          <Field model="test.foo"
            validators={{
              required: (val) => val && val.length > 5,
            }}
          >
            <input type="text" />
          </Field>
        </Form>
      </Provider>
    );

    const formElement = TestUtils.findRenderedDOMComponentWithTag(form, 'form');
    const inputElement = TestUtils.findRenderedDOMComponentWithTag(form, 'input');

    it('should initially be invalid if the form state is invalid', () => {
      TestUtils.Simulate.submit(formElement);

      assert.equal(timesSubmitCalled, 0);
    });

    it('should prevent onSubmit if the form state is invalid after change', () => {
      inputElement.value = 'short';

      TestUtils.Simulate.change(inputElement);
      TestUtils.Simulate.submit(formElement);

      assert.equal(timesSubmitCalled, 0);
    });

    it('should submit once the form state is valid after change', () => {
      inputElement.value = 'longer';

      TestUtils.Simulate.change(inputElement);
      TestUtils.Simulate.submit(formElement);

      assert.equal(timesSubmitCalled, 1);
    });
  });

  describe('internal validators without form reducers', () => {
    const store = applyMiddleware(thunk)(createStore)(combineReducers({
      test: modelReducer('test', {
        foo: '',
        bar: '',
      }),
    }));

    let timesSubmitCalled = 0;

    function handleSubmit() {
      timesSubmitCalled++;
    }

    const form = TestUtils.renderIntoDocument(
      <Provider store={store}>
        <Form model="test"
          validators={{
            foo: (val) => val && val.length > 5,
          }}
          onSubmit={handleSubmit}
        >
          <Field model="test.foo">
            <input type="text" />
          </Field>
        </Form>
      </Provider>
    );

    const formElement = TestUtils.findRenderedDOMComponentWithTag(form, 'form');
    const inputElement = TestUtils.findRenderedDOMComponentWithTag(form, 'input');

    it('should initially be invalid if the form state is invalid', () => {
      TestUtils.Simulate.submit(formElement);

      assert.equal(timesSubmitCalled, 0);
    });

    it('should prevent onSubmit if the form state is invalid after change', () => {
      inputElement.value = 'short';

      TestUtils.Simulate.change(inputElement);
      TestUtils.Simulate.submit(formElement);

      assert.equal(timesSubmitCalled, 0);
    });

    it('should submit once the form state is valid after change', () => {
      inputElement.value = 'longer';

      TestUtils.Simulate.change(inputElement);
      TestUtils.Simulate.submit(formElement);

      assert.equal(timesSubmitCalled, 1);
    });
  });

  describe('plain form without form reducers', () => {
    const store = applyMiddleware(thunk)(createStore)(combineReducers({
      test: modelReducer('test', {
        foo: '',
        bar: '',
      }),
    }));

    let timesSubmitCalled = 0;

    function handleSubmit() {
      timesSubmitCalled++;
    }

    const form = TestUtils.renderIntoDocument(
      <Provider store={store}>
        <Form model="test"
          onSubmit={handleSubmit}
        >
          <Field model="test.foo">
            <input type="text" />
          </Field>
        </Form>
      </Provider>
    );

    const formElement = TestUtils.findRenderedDOMComponentWithTag(form, 'form');

    it('should handle submit without any errors', () => {
      assert.doesNotThrow(() => {
        TestUtils.Simulate.submit(formElement);

        assert.equal(timesSubmitCalled, 1);
      });
    });
  });

  describe('deep state path', () => {
    const formsReducer = combineReducers({
      testForm: formReducer('forms.test'),
      test: modelReducer('forms.test', {
        foo: '',
        bar: '',
      }),
    });
    const store = applyMiddleware(thunk)(createStore)(combineReducers({
      forms: formsReducer,
    }));

    const form = TestUtils.renderIntoDocument(
      <Provider store={store}>
        <Form model="forms.test" onSubmit={() => {}} />
      </Provider>
    );

    const component = TestUtils.findRenderedComponentWithType(form, Form);
    const props = component.renderedElement.props;

    it('should resolve the model value', () => {
      assert.containSubset(props.modelValue, { foo: '', bar: '' });
    });

    it('should resolve the form value', () => {
      assert.containSubset(props.formValue, { valid: true, model: 'forms.test' });
    });
  });

  describe('invalidating async validity on form change', () => {
    const store = createTestStore(applyMiddleware(thunk)(createStore)(combineReducers({
      test: modelReducer('test', { val: 'invalid' }),
      testForm: formReducer('test', { val: 'invalid' }),
    })));

    function handleSubmit() {
      const promise = new Promise((resolve, reject) => reject('Form is invalid'));

      store.dispatch(actions.submit('test', promise));
    }

    const form = TestUtils.renderIntoDocument(
      <Provider store={store}>
        <Form model="test"
          onSubmit={handleSubmit}
        >
          <Field model="test.foo">
            <input type="text" />
          </Field>
        </Form>
      </Provider>
    );

    const formElement = TestUtils.findRenderedDOMComponentWithTag(form, 'form');
    const inputElement = TestUtils.findRenderedDOMComponentWithTag(form, 'input');

    it('should set errors from rejected submit handler on valid submit', (done) => {
      store.when(actionTypes.SET_ERRORS, (state) => {
        assert.isFalse(state.testForm.valid);
        assert.equal(state.testForm.errors, 'Form is invalid');
        done();
      });

      TestUtils.Simulate.submit(formElement);
    });

    it('should set validity on form changes after submit failed', () => {
      inputElement.value = 'valid';
      TestUtils.Simulate.change(inputElement);

      assert.isTrue(store.getState().testForm.valid);
    });
  });

  describe('invalidating async validity on form change with form validators', () => {
    const store = createTestStore(applyMiddleware(thunk)(createStore)(combineReducers({
      test: modelReducer('test', { foo: 'invalid' }),
      testForm: formReducer('test', { foo: 'invalid' }),
    })));

    function handleSubmit() {
      store.dispatch(actions.batch('test', [
        actions.setSubmitFailed('test'),
        actions.setErrors('test', 'Form is invalid', { errors: true }),
      ]));
    }

    const form = TestUtils.renderIntoDocument(
      <Provider store={store}>
        <Form model="test"
          validators={{
            foo: (val) => val && val.length,
          }}
          onSubmit={handleSubmit}
        >
          <Field model="test.foo">
            <input type="text" />
          </Field>
        </Form>
      </Provider>
    );

    const formElement = TestUtils.findRenderedDOMComponentWithTag(form, 'form');
    const inputElement = TestUtils.findRenderedDOMComponentWithTag(form, 'input');

    it('should set errors from rejected submit handler on valid submit', () => {
      TestUtils.Simulate.submit(formElement);

      assert.containSubset(
        store.getState().testForm,
        { errors: 'Form is invalid' });
    });

    it('should set validity on form changes after submit failed', () => {
      inputElement.value = 'valid';
      TestUtils.Simulate.change(inputElement);

      assert.isTrue(store.getState().testForm.valid);
    });
  });

  describe('submit after invalid', () => {
    const handleSubmit = sinon.spy((val) => val);

    const store = createTestStore(applyMiddleware(thunk)(createStore)(combineReducers({
      test: modelReducer('test', { pass1: '', pass2: '' }),
      testForm: formReducer('test', { pass1: '', pass2: '' }),
    })));

    const passwordsMatch = (val) => val.pass1 === val.pass2;
    const required = (val) => val && val.length;

    const form = TestUtils.renderIntoDocument(
      <Provider store={store}>
        <Form
          model="test"
          validators={{
            '': [passwordsMatch],
            pass1: [required],
            pass2: [required],
          }}
          onSubmit={handleSubmit}
          validateOn="submit"
        >
          <Field model="test.pass1">
            <input />
          </Field>
          <Field model="test.pass2">
            <input />
          </Field>
        </Form>
      </Provider>
    );

    const formElement = TestUtils.findRenderedDOMComponentWithTag(form, 'form');
    const [pass1, pass2] = TestUtils.scryRenderedDOMComponentsWithTag(form, 'input');

    it('should fail to submit with an invalid form', () => {
      TestUtils.Simulate.submit(formElement);

      assert.containSubset(
        store.getState().testForm,
        {
          valid: false,
          submitFailed: true,
        });

      pass1.value = 'aaa';
      pass2.value = 'bbb';

      TestUtils.Simulate.change(pass1);
      TestUtils.Simulate.change(pass2);

      TestUtils.Simulate.submit(formElement);

      assert.containSubset(
        store.getState().testForm,
        {
          valid: false,
          submitFailed: true,
        });
    });

    it('should submit with a valid form', () => {
      pass2.value = 'aaa';

      TestUtils.Simulate.change(pass2);


      TestUtils.Simulate.submit(formElement);

      assert.isTrue(store.getState().testForm.valid);

      assert.isTrue(handleSubmit.calledOnce);

      assert.containSubset(
        store.getState().testForm,
        {
          valid: true,
          submitFailed: false,
        });
    });
  });

  describe('form reducer name isolation', () => {
    const store = applyMiddleware(thunk)(createStore)(combineReducers({
      user: modelReducer('user'),
      userForm: formReducer('user'),
      userEx: modelReducer('userEx'),
      userExForm: formReducer('userEx'),
    }));

    const isRequired = (val) => val && val.length;

    class UserForm extends React.Component {
      componentDidMount() {
        store.dispatch(actions.change('userEx', { username: '', email: '' }));
      }
      render() {
        return (
          <Form
            model="userEx"
            validators={{
              username: isRequired,
              email: isRequired,
            }}
          >
            <Field model="userEx.username">
              <input type="text" />
            </Field>

            <Field model="userEx.email">
              <input type="text" />
            </Field>
          </Form>
        );
      }
    }

    TestUtils.renderIntoDocument(
      <Provider store={store}>
        <UserForm />
      </Provider>
    );

    it('the similarly-named userEx form should not be valid in presence of'
      + 'valid user form', () => {
      assert.isFalse(store.getState().userExForm.valid);
    });
  });

  describe('field validation and external changes', () => {
    const store = applyMiddleware(thunk)(createStore)(combineReducers({
      test: modelReducer('test', { foo: '', bar: '' }),
      testForm: formReducer('test', { foo: '', bar: '' }),
    }));

    it('should validate form on external (async) change', () => {
      const required = (val) => val && val.length;

      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <Form model="user">
            <Field
              model="test.foo"
              validators={{ required }}
            >
              <input type="text" />
            </Field>
            <Field
              model="test.bar"
              validators={{ required }}
            >
              <input type="text" />
            </Field>
          </Form>
        </Provider>
      );

      assert.isFalse(store.getState().testForm.valid);

      store.dispatch(actions.merge('test', {
        foo: 'foo valid',
        bar: 'bar valid',
      }));

      assert.isTrue(store.getState().testForm.valid);
    });
  });

  xdescribe('reset event on form', () => {
    it('should reset the model on the onReset event', () => {
      const store = applyMiddleware(thunk)(createStore)(combineReducers({
        test: modelReducer('test', { foo: '' }),
        testForm: formReducer('test', { foo: '' }),
      }));

      const form = TestUtils.renderIntoDocument(
        <Provider store={store}>
          <Form model="test">
            <Field
              model="test.foo"
            >
              <input type="text" />
            </Field>
            <button type="reset" />
          </Form>
        </Provider>
      );

      const input = TestUtils.findRenderedDOMComponentWithTag(form, 'input');
      const reset = TestUtils.findRenderedDOMComponentWithTag(form, 'button');

      input.value = 'changed';

      TestUtils.Simulate.change(input);

      assert.equal(store.getState().test.foo, 'changed');

      TestUtils.Simulate.click(reset);

      assert.equal(store.getState().test.foo, '');
    });
  });

  describe('programmatically submitting', () => {
    it('the form node should be able to be submitted with submit()', () => {
      const store = applyMiddleware(thunk)(createStore)(combineReducers({
        test: modelReducer('test', { foo: '' }),
        testForm: formReducer('test', { foo: '' }),
      }));

      const handleSubmit = sinon.spy((val) => val);

      const app = TestUtils.renderIntoDocument(
        <Provider store={store}>
          <Form
            model="test"
            onSubmit={handleSubmit}
          >
            <Field
              model="test.foo"
            >
              <input type="text" />
            </Field>
          </Form>
        </Provider>
      );

      const form = TestUtils.findRenderedDOMComponentWithTag(app, 'form');

      form.submit();

      assert.isTrue(handleSubmit.calledOnce);
    });
  });

  it('the form node should be able to be referenced', () => {
    const store = applyMiddleware(thunk)(createStore)(combineReducers({
      test: modelReducer('test', { foo: '' }),
      testForm: formReducer('test', { foo: '' }),
    }));

    const handleSubmit = sinon.spy((val) => val);

    class App extends React.Component {
      attachNode(node) {
        this._node = findDOMNode(node);
      }
      handleClick() {
        this._node.submit();
      }
      render() {
        return (
          <div>
            <Form
              model="test"
              onSubmit={handleSubmit}
              ref={this.attachNode.bind(this)}
            >
              <Field
                model="test.foo"
              >
                <input type="text" />
              </Field>
            </Form>
            <button onClick={this.handleClick.bind(this)} />
          </div>
        );
      }
    }

    const app = TestUtils.renderIntoDocument(
      <Provider store={store}>
        <App />
      </Provider>
    );

    const button = TestUtils.findRenderedDOMComponentWithTag(app, 'button');

    TestUtils.Simulate.click(button);

    assert.isTrue(handleSubmit.calledOnce);
  });
});
