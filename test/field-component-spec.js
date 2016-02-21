import React from 'react';
import chai from 'chai';
import chaiSubset from 'chai-subset';
import { createStore, applyMiddleware, combineReducers } from 'redux';
import { Provider, connect } from 'react-redux';
import thunk from 'redux-thunk';
import TestUtils from 'react-addons-test-utils';

chai.use(chaiSubset);

const { assert } = chai;

import { Field, actions, createFormReducer, createModelReducer, initialFieldState } from '../lib';

describe('<Field /> component', () => {
  const textFieldElements = [
    ['input', 'text'],
    ['input', 'password'],
    ['input', 'number'],
    ['input', 'color'],
    ['textarea']
  ];

  it('should wrap child components in a <div> if more than one', () => {
    const store = applyMiddleware(thunk)(createStore)(combineReducers({
        testForm: createFormReducer('test'),
        test: createModelReducer('test', { foo: 'bar' })
      }));
    const field = TestUtils.renderIntoDocument(
      <Provider store={store}>
        <Field model="test.foo">
          <label />
          <input />
        </Field>
      </Provider>
    );

    const div = TestUtils.findRenderedDOMComponentWithTag(field, 'div');

    assert.ok(div);

    assert.equal(
      div.props.children.length,
      2);
  });

  it('should not wrap child components in a <div> if only one', () => {
    const store = applyMiddleware(thunk)(createStore)(combineReducers({
        test: createModelReducer('test', { foo: 'bar' })
      }));
    const field = TestUtils.renderIntoDocument(
      <Provider store={store}>
        <Field model="test.foo">
          <input />
        </Field>
      </Provider>
    );

    assert.throws(() => {
      TestUtils.findRenderedDOMComponentWithTag(field, 'div');
    });

    assert.ok(TestUtils.findRenderedDOMComponentWithTag(field, 'input'));
  });

  it('should recursively handle nested control components', () => {
    const store = applyMiddleware(thunk)(createStore)(combineReducers({
      test: createModelReducer('test', { foo: 'bar' })
    }));

    const field = TestUtils.renderIntoDocument(
      <Provider store={store}>
        <Field model="test.foo">
          <div>
            <label />
            <input />
          </div>
        </Field>
      </Provider>
    );

    const control = TestUtils.findRenderedDOMComponentWithTag(field, 'input');

    assert.equal(
      control.value,
      'bar',
      'should set control to initial value');

    control.value = 'testing';

    TestUtils.Simulate.change(control);

    assert.equal(
      store.getState().test.foo,
      'testing',
      'should update state when control is changed');
  });

  textFieldElements.map(([element, type]) => {
    describe(`with <${element} ${type ? 'type="' + type + '"' : ''}/>`, () => {
      const store = applyMiddleware(thunk)(createStore)(combineReducers({
        testForm: createFormReducer('test'),
        test: createModelReducer('test', { foo: 'bar' })
      }));

      const field = TestUtils.renderIntoDocument(
        <Provider store={store}>
          <Field model="test.foo">
            { React.createElement(element, { type }) }
          </Field>
        </Provider>
      );

      const node = TestUtils.findRenderedDOMComponentWithTag(field, element);

      it('should have an initial value from the model\'s initialState', () => {
        assert.equal(
          node.value,
          'bar');
      });

      it('should dispatch a focus event when focused', () => {    
        TestUtils.Simulate.focus(node);

        assert.containSubset(
          store.getState().testForm.fields['foo'],
          { focus: true, blur: false });
      });

      it('should dispatch a blur event when blurred', () => {    
        TestUtils.Simulate.blur(node);

        assert.containSubset(
          store.getState().testForm.fields['foo'],
          { focus: false, blur: true });
      });

      it('should dispatch a change event when changed', () => {
        node.value = 'testing';

        TestUtils.Simulate.change(node);

        assert.equal(
          store.getState().test.foo,
          'testing');

        node.value = 'testing again';

        TestUtils.Simulate.change(node);

        assert.equal(
          store.getState().test.foo,
          'testing again');
      });
    });

    describe(`with a controlled <${element} ${type ? 'type="' + type + '"' : ''} /> component`, () => {
      const store = applyMiddleware(thunk)(createStore)(combineReducers({
        testForm: createFormReducer('test'),
        test: createModelReducer('test', { foo: 'bar' })
      }));

      const TestField = connect(s => s)((props) => {
        let { test } = props;

        return (
          <Field model="test.foo">
            { React.createElement(element, {
              type: type,
              value: test.foo
            }) }
          </Field>
        );
      });

      const field = TestUtils.renderIntoDocument(
        <Provider store={store}>
          <TestField />
        </Provider>
      );

      const node = TestUtils.findRenderedDOMComponentWithTag(field, element);

      it('should have the initial value of the state', () => {
        assert.equal(
          node.value,
          'bar');
      });

      it('should update the value when the controlled input is changed', () => {
        TestUtils.Simulate.change(node, {
          target: { value: 'testing' }
        });

        assert.equal(
          node.value,
          'testing');
      });
    });
  });

  describe('with <input type="radio" />', () => {
    const store = applyMiddleware(thunk)(createStore)(combineReducers({
      testForm: createFormReducer('test'),
      test: createModelReducer('test', { foo: 'two' })
    }));

    const field = TestUtils.renderIntoDocument(
      <Provider store={store}>
        <Field model="test.foo">
          <input type="radio" value="one" />
          <input type="radio" value="two" />
        </Field>
      </Provider>
    );

    const [ radioOne, radioTwo ] = TestUtils.scryRenderedDOMComponentsWithTag(field, 'input');

    it('should initially set the radio button matching the initial state to checked', () => {
      assert.equal(radioTwo.checked, true);
      assert.equal(radioOne.checked, false);
    });

    it('should give each radio input a name attribute of the model', () => {
      assert.equal(radioOne.name, 'test.foo');
      assert.equal(radioTwo.name, 'test.foo');
    });


    it('should dispatch a change event when changed', () => {
      TestUtils.Simulate.change(radioOne);

      assert.equal(
        store.getState().test.foo,
        'one');

      TestUtils.Simulate.change(radioTwo);

      assert.equal(
        store.getState().test.foo,
        'two');
    });

    it('should check the appropriate radio button when model is externally changed', () => {
      store.dispatch(actions.change('test.foo', 'one'));

      assert.equal(radioOne.checked, true);
      assert.equal(radioTwo.checked, false);

      store.dispatch(actions.change('test.foo', 'two'));

      assert.equal(radioTwo.checked, true);
      assert.equal(radioOne.checked, false);
    });

    it('should uncheck all radio buttons that are not equal to the value', () => {
      store.dispatch(actions.change('test.foo', 'three'));

      assert.equal(radioOne.checked, false);
      assert.equal(radioTwo.checked, false);
    });
  });

  describe('with <input type="checkbox" /> (single toggle)', () => {
    const store = applyMiddleware(thunk)(createStore)(combineReducers({
      testForm: createFormReducer('test'),
      test: createModelReducer('test', {
        foo: true
      })
    }));

    const field = TestUtils.renderIntoDocument(
      <Provider store={store}>
        <Field model="test.foo">
          <input type="checkbox" />
        </Field>
      </Provider>
    );

    const checkbox = TestUtils.findRenderedDOMComponentWithTag(field, 'input');

    it('should initially set the checkbox to checked if the model is truthy', () => {
      assert.equal(checkbox.checked, true);
    });

    it('should give each radio input a name attribute of the model', () => {
      assert.equal(checkbox.name, 'test.foo');
    });


    it('should dispatch a change event when changed', () => {
      TestUtils.Simulate.change(checkbox);

      assert.equal(
        store.getState().test.foo,
        false);

      TestUtils.Simulate.change(checkbox);

      assert.equal(
        store.getState().test.foo,
        true);
    });

    it('should check/uncheck the checkbox when model is externally changed', () => {
      store.dispatch(actions.change('test.foo', true));

      assert.equal(checkbox.checked, true);

      store.dispatch(actions.change('test.foo', false));

      assert.equal(checkbox.checked, false);
    });

    it('should uncheck the checkbox for any falsey value', () => {
      store.dispatch(actions.change('test.foo', ''));

      assert.equal(checkbox.checked, false);
    });
  });

  describe('with <input type="checkbox" /> (multi toggle)', () => {
    const store = applyMiddleware(thunk)(createStore)(combineReducers({
      testForm: createFormReducer('test'),
      test: createModelReducer('test', {
        foo: [1]
      })
    }));

    const field = TestUtils.renderIntoDocument(
      <Provider store={store}>
        <Field model="test.foo[]">
          <input type="checkbox" value={1} />
          <input type="checkbox" value={2} />
          <input type="checkbox" value={3} />
        </Field>
      </Provider>
    );

    const checkboxes = TestUtils.scryRenderedDOMComponentsWithTag(field, 'input');

    it('should initially set the checkbox to checked if the model is truthy', () => {
      assert.equal(checkboxes[0].checked, true);
    });

    it('should give each checkbox a name attribute of the model', () => {
      checkboxes.forEach((checkbox) => {
        assert.equal(checkbox.name, 'test.foo[]');
      })
    });

    it('should dispatch a change event when changed', () => {
      TestUtils.Simulate.change(checkboxes[0]);

      assert.sameMembers(
        store.getState().test.foo,
        [], 'all unchecked');

      TestUtils.Simulate.change(checkboxes[1]);

      assert.sameMembers(
        store.getState().test.foo,
        [2], 'one checked');

      TestUtils.Simulate.change(checkboxes[0]);

      assert.sameMembers(
        store.getState().test.foo,
        [1, 2], 'two checked');

      TestUtils.Simulate.change(checkboxes[2]);

      assert.sameMembers(
        store.getState().test.foo,
        [1, 2, 3], 'all checked');

      TestUtils.Simulate.change(checkboxes[0]);

      assert.sameMembers(
        store.getState().test.foo,
        [2, 3], 'one unchecked');
    });

    it('should check the appropriate checkboxes when model is externally changed', () => {
      store.dispatch(actions.change('test.foo', [1, 2]));

      assert.isTrue(checkboxes[0].checked);
      assert.isTrue(checkboxes[1].checked);
      assert.isFalse(checkboxes[2].checked);
    });
  });

  describe('with <select>', () => {
    const store = applyMiddleware(thunk)(createStore)(combineReducers({
      testForm: createFormReducer('test'),
      test: createModelReducer('test', {
        foo: "one"
      })
    }));

    const field = TestUtils.renderIntoDocument(
      <Provider store={store}>
        <Field model="test.foo">
          <select>
            <option value="one" />
            <option value="two" />
            <option value="three" />
            <optgroup>
              <option value="four" />
              <option value="five" />
              <option value="six" />
            </optgroup>
          </select>
        </Field>
      </Provider>
    );

    const select = TestUtils.findRenderedDOMComponentWithTag(field, 'select');
    const options = TestUtils.scryRenderedDOMComponentsWithTag(field, 'option');

    it('should select the option that matches the initial state of the model', () => {
      assert.isTrue(options[0].selected);
      assert.isFalse(options[1].selected);
      assert.equal(select.value, 'one');
    });

    it('should dispatch a change event when changed', () => {
      TestUtils.Simulate.change(options[1]);

      assert.equal(
        store.getState().test.foo,
        'two');
    });

    it('should select the appropriate <option> when model is externally changed', () => {
      store.dispatch(actions.change('test.foo', 'three'));

      assert.isTrue(options[2].selected);
      assert.equal(select.value, 'three');
    });

    it('should work with <optgroup>', () => {
      TestUtils.Simulate.change(options[3]);

      assert.isTrue(options[3].selected);
      assert.equal(
        store.getState().test.foo,
        'four');
    });
  });

  describe('validators and validateOn property', () => {
    const formReducer = createFormReducer('test');
    const store = applyMiddleware(thunk)(createStore)(combineReducers({
      testForm: formReducer,
      test: createModelReducer('test', {})
    }));

    it('should set the proper field state for validation', () => {
      const field = TestUtils.renderIntoDocument(
        <Provider store={store}>
          <Field model="test.foo"
            validators={{
              good: () => true,
              bad: () => false,
              custom: (val) => val !== 'invalid'
            }}>
            <input type="text"/>
          </Field>
        </Provider>
      );

      const control = TestUtils.findRenderedDOMComponentWithTag(field, 'input');

      control.value = 'valid';

      TestUtils.Simulate.change(control);

      assert.deepEqual(
        store.getState().testForm.fields['foo'].errors,
        {
          good: false,
          bad: true,
          custom: false
        });

      control.value = 'invalid';

      TestUtils.Simulate.change(control);

      assert.deepEqual(
        store.getState().testForm.fields['foo'].errors,
        {
          good: false,
          bad: true,
          custom: true
        });
    });

    it('should validate on blur when validateOn prop is "blur"', () => {
      const field = TestUtils.renderIntoDocument(
        <Provider store={store}>
          <Field model="test.blur"
            validators={{
              good: () => true,
              bad: () => false,
              custom: (val) => val !== 'invalid'
            }}
            validateOn="blur">
            <input type="text"/>
          </Field>
        </Provider>
      );

      const control = TestUtils.findRenderedDOMComponentWithTag(field, 'input');

      control.value = 'valid';

      TestUtils.Simulate.change(control);

      assert.deepEqual(
        store.getState().testForm.fields['blur'].errors,
        {}, 'should not validate upon change');

      TestUtils.Simulate.blur(control);

      assert.deepEqual(
        store.getState().testForm.fields['blur'].errors,
        {
          good: false,
          bad: true,
          custom: false
        }, 'should only validate upon blur');
    });
  });

  describe('asyncValidators and asyncValidateOn property', () => {
    const formReducer = createFormReducer('test');
    const store = applyMiddleware(thunk)(createStore)(combineReducers({
      testForm: formReducer,
      test: createModelReducer('test', {})
    }));

    it('should set the proper field state for a valid async validation', (done) => {
      const field = TestUtils.renderIntoDocument(
        <Provider store={store}>
          <Field model="test.foo"
            asyncValidators={{
              testValid: (val, done) => setTimeout(() => done(true), 10)
            }}
            asyncValidateOn="blur">
            <input type="text"/>
          </Field>
        </Provider>
      );

      const control = TestUtils.findRenderedDOMComponentWithTag(field, 'input');
      let expectedStates = [
        { blur: true },
        { pending: true, valid: true }, // initially valid
        { pending: true, valid: true }, // true after validating
        { pending: false, valid: true }
      ];

      let actualStates = [];

      store.subscribe(() => {
        let state = store.getState();

        actualStates.push(state.testForm.fields['foo']);

        if (actualStates.length == expectedStates.length) {
          expectedStates.map((expected, i) => {
            assert.containSubset(actualStates[i], expected, `${i}`);
          });

          done();
        }
      });

      TestUtils.Simulate.blur(control);
    });

    it('should set the proper field state for an invalid async validation', (done) => {
      const field = TestUtils.renderIntoDocument(
        <Provider store={store}>
          <Field model="test.foo"
            asyncValidators={{
              testValid: (val, done) => setTimeout(() => done(false), 10)
            }}
            asyncValidateOn="blur">
            <input type="text"/>
          </Field>
        </Provider>
      );

      const control = TestUtils.findRenderedDOMComponentWithTag(field, 'input');
      let expectedStates = [
        { blur: true },
        { pending: true, valid: true }, // initially valid
        { pending: true, valid: false }, // false after validating
        { pending: false, valid: false }
      ];

      let actualStates = [];

      store.subscribe(() => {
        let state = store.getState();

        actualStates.push(state.testForm.fields['foo']);

        if (actualStates.length == expectedStates.length) {
          expectedStates.map((expected, i) => {
            assert.containSubset(actualStates[i], expected, `${i}`);
          });

          done();
        }
      });

      TestUtils.Simulate.blur(control);
    });
  });

  describe('dynamic components', () => {
    const formReducer = createFormReducer('test');
    const store = applyMiddleware(thunk)(createStore)(combineReducers({
      testForm: formReducer,
      test: createModelReducer('test', {})
    }));

    class DynamicSelectForm extends React.Component {
      constructor() {
        super();

        this.state = { options: [1, 2] };
      }
      render() {
        return (
          <div>
            <button onClick={() => this.setState({ options: [1, 2, 3] })} />
            <Field model="test.foo">
              <select>
              { this.state.options.map((option, i) => 
                <option key={i} value={ option } />
              )}
              </select>
            </Field>
          </div>
        )
      }
    }

    it('should properly update dynamic components inside <Field>', () => {
      const field = TestUtils.renderIntoDocument(
        <Provider store={store}>
          <DynamicSelectForm />
        </Provider>
      );

      let options = TestUtils.scryRenderedDOMComponentsWithTag(field, 'option');
      const button = TestUtils.findRenderedDOMComponentWithTag(field, 'button');

      assert.equal(options.length, 2);

      TestUtils.Simulate.click(button);

      options = TestUtils.scryRenderedDOMComponentsWithTag(field, 'option');

      assert.equal(options.length, 3);
    });
  });

  describe('wrapper components with component property', () => {
    const store = applyMiddleware(thunk)(createStore)(combineReducers({
      test: createModelReducer('test', {})
    }));

    it('should wrap children with specified component (string)', () => {
      const field = TestUtils.renderIntoDocument(
        <Provider store={store}>
          <Field component="div">
            <input type="text" />
          </Field>
        </Provider>
      );

      const wrapper = TestUtils.findRenderedDOMComponentWithTag(field, 'div');

      assert.ok(wrapper);
    });

    it('should wrap children with specified component (class)', () => {
      class Wrapper extends React.Component {
        render() {
          return <main className="wrapper">{ this.props.children }</main>
        }
      }

      const field = TestUtils.renderIntoDocument(
        <Provider store={store}>
          <Field component={Wrapper}>
            <input type="text" />
          </Field>
        </Provider>
      );

      const wrapper = TestUtils.findRenderedDOMComponentWithClass(field, 'wrapper');

      assert.ok(wrapper);
    });

    it('should wrap children with specified component (function)', () => {
      function Wrapper(props) {
        return <section className="wrapper">{props.children}</section>
      }

      const field = TestUtils.renderIntoDocument(
        <Provider store={store}>
          <Field component={Wrapper}>
            <input type="text" />
          </Field>
        </Provider>
      );

      const wrapper = TestUtils.findRenderedDOMComponentWithClass(field, 'wrapper');

      assert.ok(wrapper);
    });

    it('should wrap children with a <div> when provided with className', () => {
      const field = TestUtils.renderIntoDocument(
        <Provider store={store}>
          <Field className="wrapper">
            <input type="text" />
          </Field>
        </Provider>
      );

      const wrapper = TestUtils.findRenderedDOMComponentWithClass(field, 'wrapper');

      assert.ok(wrapper);
    });
  });
});
