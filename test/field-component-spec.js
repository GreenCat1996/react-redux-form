import React from 'react';
import chai from 'chai';
import chaiSubset from 'chai-subset';
import should from 'should';
import { createStore, applyMiddleware, combineReducers } from 'redux';
import { Provider } from 'react-redux';
import thunk from 'redux-thunk';
import TestUtils from 'react-addons-test-utils';

import jsdom from 'jsdom';

global.document = jsdom.jsdom('<!doctype html><html><body></body></html>');
global.window = document.defaultView;
global.navigator = {userAgent: 'node.js'};

chai.use(chaiSubset);

const { assert } = chai;

import { Field, actions, createFormReducer, createModelReducer, initialFieldState } from '../src';

describe('<Field /> component', () => {
  const textFieldElements = [
    ['input', 'text'],
    ['input', 'password'],
    ['input', 'number'],
    ['textarea']
  ];

  textFieldElements.map(([element, type]) => {
    describe(`<${element} ${type ? 'type="' + type + '"' : ''}/>`, () => {
      const store = applyMiddleware(thunk)(createStore)(combineReducers({
        testForm: createFormReducer('test'),
        test: createModelReducer('test', { foo: 'bar' })
      }));

      const foo = TestUtils.renderIntoDocument(
        <Provider store={store}>
          <Field model="test.foo">
            { React.createElement(element, { type }) }
          </Field>
        </Provider>
      );

      const node = TestUtils.findRenderedDOMComponentWithTag(foo, element);

      it('should have an initial value from the model\'s initialState', () => {
        assert.equal(
          node.value,
          'bar');
      });

      it('should dispatch a focus event when focused', () => {    
        TestUtils.Simulate.focus(node);

        assert.containSubset(
          store.getState().testForm.field('test.foo'),
          { focus: true, blur: false });
      });

      it('should dispatch a blur event when blurred', () => {    
        TestUtils.Simulate.blur(node);

        assert.containSubset(
          store.getState().testForm.field('test.foo'),
          { focus: false, blur: true });
      });

      it('should dispatch a change event when changed', () => {
        node.value = 'testing';

        TestUtils.Simulate.change(node);

        assert.equal(
          store.getState().test.foo,
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
        []);

      TestUtils.Simulate.change(checkboxes[1]);

      assert.sameMembers(
        store.getState().test.foo,
        [2]);

      TestUtils.Simulate.change(checkboxes[0]);

      assert.sameMembers(
        store.getState().test.foo,
        [1, 2]);

      TestUtils.Simulate.change(checkboxes[2]);

      assert.sameMembers(
        store.getState().test.foo,
        [1, 2, 3]);

      TestUtils.Simulate.change(checkboxes[0]);

      assert.sameMembers(
        store.getState().test.foo,
        [2, 3]);
    });
  });
});
