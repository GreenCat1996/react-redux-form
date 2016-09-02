/* eslint react/no-multi-comp:0 react/jsx-no-bind:0 */
import { assert } from 'chai';
import React from 'react';
import TestUtils from 'react-addons-test-utils';
import { applyMiddleware, combineReducers, createStore } from 'redux';
import { Provider } from 'react-redux';
import thunk from 'redux-thunk';
import sinon from 'sinon';

import { controls, modelReducer, formReducer, Control, actions } from '../src';
import { testCreateStore, testRender } from './utils';
import handleFocus from '../src/utils/handle-focus';

function createTestStore(reducers) {
  return applyMiddleware(thunk)(createStore)(combineReducers(reducers));
}

describe('<Control> component', () => {
  describe('existence check', () => {
    it('should exist', () => {
      assert.ok(Control);
    });
  });

  describe('basic functionality', () => {
    const store = createTestStore({
      test: modelReducer('test', { foo: 'bar' }),
      testForm: formReducer('test', { foo: 'bar' }),
    });

    const form = TestUtils.renderIntoDocument(
      <Provider store={store}>
        <Control model="test.foo" mapProps={controls.text} component="input" />
      </Provider>
    );

    const input = TestUtils.findRenderedDOMComponentWithTag(form, 'input');

    it('should work as expected with a model (happy path)', () => {
      assert.ok(input);
      assert.equal(input.value, 'bar');
    });

    it('should handle changes properly', () => {
      input.value = 'new';

      TestUtils.Simulate.change(input);

      assert.equal(store.getState().test.foo, 'new');
    });
  });

  describe('onLoad prop', () => {
    const store = createTestStore({
      test: modelReducer('test', { fff: 'bar' }),
      testForm: formReducer('test', { fff: 'bar' }),
    });

    const handleLoad = sinon.spy();

    const form = TestUtils.renderIntoDocument(
      <Provider store={store}>
        <Control
          model="test.fff"
          mapProps={controls.text}
          component="input"
          onLoad={handleLoad}
        />
      </Provider>
    );

    const input = TestUtils.findRenderedDOMComponentWithTag(form, 'input');

    it('should call the onLoad function', () => {
      assert.ok(handleLoad.calledOnce);

      assert.equal(handleLoad.args[0][0], 'bar');
      assert.containSubset(handleLoad.args[0][1], {
        initialValue: 'bar',
      });
      assert.instanceOf(handleLoad.args[0][2], window.HTMLInputElement);
      assert.equal(handleLoad.args[0][2], input);
    });
  });
});


describe('Extended Control components', () => {
  const inputControlElements = [
    '', // input with no type
    'text',
    'password',
    'number',
    'color',
  ];

  inputControlElements.forEach((type) => {
    describe(`with <Control.text> ${type ? `and type="${type}"` : ''}`, () => {
      const store = createTestStore({
        testForm: formReducer('test'),
        test: modelReducer('test', { foo: 'bar' }),
      });

      const field = TestUtils.renderIntoDocument(
        <Provider store={store}>
          <Control.text model="test.foo" type={type} />
        </Provider>
      );

      const node = TestUtils.findRenderedDOMComponentWithTag(field, 'input');

      it('should have an initial value from the model\'s initialState', () => {
        assert.equal(
          node.value,
          'bar');
      });

      it('should dispatch a focus event when focused', () => {
        TestUtils.Simulate.focus(node);

        assert.containSubset(
          store.getState().testForm.foo,
          { focus: true });
      });

      it('should dispatch a blur event when blurred', () => {
        TestUtils.Simulate.blur(node);

        assert.containSubset(
          store.getState().testForm.foo,
          { focus: false });
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
  });

  describe('with <Control.radio />', () => {
    const store = createTestStore({
      testForm: formReducer('test'),
      test: modelReducer('test', { foo: 'two' }),
    });

    const field = TestUtils.renderIntoDocument(
      <Provider store={store}>
        <div>
          <Control.radio model="test.foo" value="one" />
          <Control.radio model="test.foo" value="two" />
        </div>
      </Provider>
    );

    const [radioOne, radioTwo] = TestUtils.scryRenderedDOMComponentsWithTag(field, 'input');

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

  describe('with <Control.checkbox /> (single toggle)', () => {
    const store = createTestStore({
      testForm: formReducer('test'),
      test: modelReducer('test', {
        single: true,
      }),
    });

    const field = TestUtils.renderIntoDocument(
      <Provider store={store}>
        <Control.checkbox model="test.single" />
      </Provider>
    );

    const checkbox = TestUtils.findRenderedDOMComponentWithTag(field, 'input');

    it('should initially set the checkbox to checked if the model is truthy', () => {
      assert.equal(checkbox.checked, true);
    });

    it('should give each radio input a name attribute of the model', () => {
      assert.equal(checkbox.name, 'test.single');
    });

    it('should dispatch a change event when changed', () => {
      TestUtils.Simulate.change(checkbox);

      assert.equal(
        store.getState().test.single,
        false, 'false');

      TestUtils.Simulate.change(checkbox);

      assert.equal(
        store.getState().test.single,
        true, 'true');
    });

    it('should check/uncheck the checkbox when model is externally changed', () => {
      store.dispatch(actions.change('test.single', true));

      assert.equal(checkbox.checked, true);

      store.dispatch(actions.change('test.single', false));

      assert.equal(checkbox.checked, false);
    });

    it('should uncheck the checkbox for any falsey value', () => {
      store.dispatch(actions.change('test.single', ''));

      assert.equal(checkbox.checked, false);
    });
  });

  describe('with <Control.checkbox /> (multi toggle)', () => {
    const store = applyMiddleware(thunk)(createStore)(combineReducers({
      testForm: formReducer('test'),
      test: modelReducer('test', {
        foo: [1],
      }),
    }));

    const field = TestUtils.renderIntoDocument(
      <Provider store={store}>
        <div>
          <Control.checkbox model="test.foo[]" value={1} />
          <Control.checkbox model="test.foo[]" value={2} />
          <Control.checkbox model="test.foo[]" value={3} />
        </div>
      </Provider>
    );

    const checkboxes = TestUtils.scryRenderedDOMComponentsWithTag(field, 'input');

    it('should initially set the checkbox to checked if the model is truthy', () => {
      assert.equal(checkboxes[0].checked, true);
    });

    it('should give each checkbox a name attribute of the model', () => {
      checkboxes.forEach(checkbox => {
        assert.equal(checkbox.name, 'test.foo[]');
      });
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

  describe('with <Control.checkbox /> (custom onChange)', () => {
    const store = createTestStore({
      testForm: formReducer('test'),
      test: modelReducer('test', {
        foo: true,
      }),
    });

    const handleOnChange = sinon.spy((e) => e);

    const field = TestUtils.renderIntoDocument(
      <Provider store={store}>
        <Control.checkbox model="test.foo" onChange={handleOnChange} />
      </Provider>
    );

    const checkbox = TestUtils.findRenderedDOMComponentWithTag(field, 'input');

    TestUtils.Simulate.change(checkbox);

    it('should call the custom onChange event handler', () => {
      assert.ok(handleOnChange.calledOnce);
    });

    it('should update the state as expected', () => {
      assert.isFalse(store.getState().test.foo);
    });
  });

  describe('with <Control.file />', () => {
    it('should update with an array of files', () => {
      const store = createTestStore({
        testForm: formReducer('test'),
        test: modelReducer('test', { foo: [] }),
      });

      const field = TestUtils.renderIntoDocument(
        <Provider store={store}>
          <Control.file model="test.foo" />
        </Provider>
      );

      const input = TestUtils.findRenderedDOMComponentWithTag(field, 'input');

      TestUtils.Simulate.change(input, {
        target: {
          type: 'file',
          files: [
            { name: 'first.jpg' },
            { name: 'second.jpg' },
          ],
        },
      });

      assert.deepEqual(
        store.getState().test.foo,
        [
          { name: 'first.jpg' },
          { name: 'second.jpg' },
        ]);
    });
  });

  describe('with <Control.select />', () => {
    const store = createTestStore({
      testForm: formReducer('test'),
      test: modelReducer('test', {
        foo: 'one',
      }),
    });

    const field = TestUtils.renderIntoDocument(
      <Provider store={store}>
        <Control.select model="test.foo">
          <option value="one" />
          <option value="two" />
          <option value="three" />
          <optgroup>
            <option value="four" />
            <option value="five" />
            <option value="six" />
          </optgroup>
        </Control.select>
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

  describe('ignoring events with ignore prop', () => {
    const store = testCreateStore({
      test: modelReducer('test', { foo: 'bar' }),
      testForm: formReducer('test', { foo: 'bar' }),
    });

    const control = testRender(
      <Control.text
        model="test.foo"
        ignore={['focus', 'blur']}
      />, store);

    const input = TestUtils.findRenderedDOMComponentWithTag(control, 'input');

    it('ignores the events specified in the ignore prop', () => {
      assert.isFalse(store.getState().testForm.foo.focus);

      TestUtils.Simulate.focus(input);

      assert.isFalse(store.getState().testForm.foo.focus,
        'focus event should be ignored');

      TestUtils.Simulate.blur(input);

      assert.isFalse(store.getState().testForm.foo.touched,
        'blur event should be ignored');
    });
  });

  describe('validators and validateOn property', () => {
    const store = testCreateStore({
      testForm: formReducer('test'),
      test: modelReducer('test', {
        foo: '',
        blur: '',
        external: '',
      }),
    });

    it('should set the proper field state for validation', () => {
      const field = TestUtils.renderIntoDocument(
        <Provider store={store}>
          <Control.text
            model="test.foo"
            validators={{
              good: () => true,
              bad: () => false,
              custom: val => val !== 'invalid',
            }}
          />
        </Provider>
      );

      const control = TestUtils.findRenderedDOMComponentWithTag(field, 'input');

      control.value = 'valid';

      TestUtils.Simulate.change(control);

      assert.deepEqual(
        store.getState().testForm.foo.errors,
        {
          good: false,
          bad: true,
          custom: false,
        });

      control.value = 'invalid';

      TestUtils.Simulate.change(control);

      assert.deepEqual(
        store.getState().testForm.foo.errors,
        {
          good: false,
          bad: true,
          custom: true,
        });
    });

    it('should validate on blur when validateOn prop is "blur"', () => {
      let timesValidationCalled = 0;

      const field = TestUtils.renderIntoDocument(
        <Provider store={store}>
          <Control.text
            model="test.blur"
            validators={{
              good: () => true,
              bad: () => false,
              custom: (val) => {
                timesValidationCalled += 1;
                return val !== 'invalid';
              },
            }}
            validateOn="blur"
          />
        </Provider>
      );

      const control = TestUtils.findRenderedDOMComponentWithTag(field, 'input');

      control.value = 'valid';

      assert.equal(timesValidationCalled, 1,
        'validation should only be called once upon load');

      TestUtils.Simulate.change(control);

      assert.equal(timesValidationCalled, 1,
        'validation should not be called upon change');

      TestUtils.Simulate.blur(control);

      assert.equal(timesValidationCalled, 2,
        'validation should be called upon blur');

      assert.deepEqual(
        store.getState().testForm.blur.errors,
        {
          good: false,
          bad: true,
          custom: false,
        }, 'should only validate upon blur');
    });

    it('should validate on external change', () => {
      let timesValidationCalled = 0;

      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <Control.text
            model="test.external"
            validators={{
              required: (val) => {
                timesValidationCalled += 1;
                return val && val.length;
              },
            }}
          />
        </Provider>
      );

      assert.equal(timesValidationCalled, 1,
        'validation called on load');

      assert.isFalse(store.getState().testForm.external.valid);

      store.dispatch(actions.change('test.external', 'valid'));

      assert.isTrue(store.getState().testForm.external.valid);

      assert.equal(timesValidationCalled, 2,
        'validation called because of external change');
    });
  });

  describe('asyncValidators and asyncValidateOn property', () => {
    const reducer = formReducer('test');
    const store = createTestStore({
      testForm: reducer,
      test: modelReducer('test', {}),
    });

    it('should set the proper field state for a valid async validation', done => {
      const field = TestUtils.renderIntoDocument(
        <Provider store={store}>
          <Control.text
            model="test.foo"
            asyncValidators={{
              testValid: (val, _done) => setTimeout(() => _done(true), 10),
            }}
            asyncValidateOn="blur"
          />
        </Provider>
      );

      const control = TestUtils.findRenderedDOMComponentWithTag(field, 'input');

      const expectedStates = [
        (state) => state.focus === false,

        // initially valid
        (state) => state.validating === true && state.valid,

        // true after validating
        (state) => state.validating === false && state.valid,
      ];

      const actualStates = [];

      store.subscribe(() => {
        const state = store.getState();

        actualStates.push(state.testForm.foo);

        if (actualStates.length === expectedStates.length) {
          expectedStates.map((expectedFn, i) =>
            assert.ok(expectedFn(actualStates[i]), `${i}`)
          );

          done();
        }
      });

      TestUtils.Simulate.blur(control);
    });

    it('should set the proper field state for an invalid async validation', done => {
      const field = TestUtils.renderIntoDocument(
        <Provider store={store}>
          <Control.text
            model="test.foo"
            asyncValidators={{
              testValid: (val, _done) => setTimeout(() => _done(false), 10),
            }}
            asyncValidateOn="blur"
          />
        </Provider>
      );

      const control = TestUtils.findRenderedDOMComponentWithTag(field, 'input');

      const expectedStates = [
        (state) => state.focus === false,

        // initially valid
        (state) => state.validating === true && state.valid,

        // false after validating
        (state) => state.validating === false && !state.valid,
      ];

      const actualStates = [];

      store.subscribe(() => {
        const state = store.getState();

        actualStates.push(state.testForm.foo);

        if (actualStates.length === expectedStates.length) {
          expectedStates.map((expectedFn, i) =>
            assert.ok(expectedFn(actualStates[i]), `${i}`)
          );

          done();
        }
      });

      TestUtils.Simulate.blur(control);
    });
  });

  describe('manual focus/blur', () => {
    beforeEach(() => {
      handleFocus.clearCache();
    });

    const store = testCreateStore({
      test: modelReducer('test', { foo: 'bar' }),
      testForm: formReducer('test', { foo: 'bar' }),
    });

    const control = testRender(
      <Control.text
        model="test.foo"
      />, store);

    const input = TestUtils.findRenderedDOMComponentWithTag(control, 'input');

    it('should manually focus the control', () => {
      store.dispatch(actions.focus('test.foo'));

      assert.equal(document.activeElement, input);
    });

    it('should manually blur the control', () => {
      store.dispatch(actions.focus('test.foo'));

      assert.equal(document.activeElement, input);

      store.dispatch(actions.blur('test.foo'));

      assert.notEqual(document.activeElement, input);
    });
  });
});
