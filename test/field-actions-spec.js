import chai from 'chai';
import chaiSubset from 'chai-subset';
import should from 'should';
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';

chai.use(chaiSubset);

const { assert } = chai;

import { actions, createFormReducer, initialFieldState } from '../src';

describe('RSF field actions', () => {
  describe('setViewValue()', () => {
    it('should set the view value of the field', () => {
      const reducer = createFormReducer('test');

      assert.containSubset(
        reducer(undefined, actions.setViewValue('test.foo', 'bar'))
          .field('foo'),
        {
          viewValue: 'bar'
        });
    });
  });

  describe('reset()', () => {
    it('should set the field to the initial field state', () => {
      const reducer = createFormReducer('test');

      assert.containSubset(
        reducer(undefined, actions.reset('test.foo'))
          .field('foo'),
        initialFieldState);
    });
  });

  describe('focus()', () => {
    it('should set the focus state of the field to true and the blur state to false', () => {    
      const reducer = createFormReducer('test');

      assert.containSubset(
        reducer(undefined, actions.focus('test.foo'))
          .field('foo'),
        {
          focus: true,
          blur: false
        });
    });
  });

  describe('blur()', () => {
    it('should set the blur state of the field to true and the focus state to false', () => {
      const reducer = createFormReducer('test');

      assert.containSubset(
        reducer(undefined, actions.blur('test.foo'))
          .field('foo'),
        {
          blur: true,
          focus: false,
          touched: true,
          untouched: false
        });
    });
  });

  describe('setPristine()', () => {
    it('should set the pristine state of the field to true and the dirty state to false', () => {
      const reducer = createFormReducer('test');

      assert.containSubset(
        reducer(undefined, actions.setPristine('test.foo'))
          .field('foo'),
        {
          pristine: true,
          dirty: false
        });
    });

    it('should set the pristine state of the form to true and the dirty state to false if every field is pristine', () => {
      const reducer = createFormReducer('test');

      let actualPristine = reducer(undefined, actions.setPristine('test.foo'));

      assert.containSubset(
        actualPristine,
        {
          pristine: true,
          dirty: false
        });

      let actualDirty = reducer(actualPristine, actions.setDirty('test.bar'));

      assert.containSubset(
        actualDirty,
        {
          pristine: false,
          dirty: true
        });

      let actualMultiplePristine = reducer(actualDirty, actions.setPristine('test.bar'));

      assert.containSubset(
        actualMultiplePristine,
        {
          pristine: true,
          dirty: false
        });
    });
  });

  describe('setDirty()', () => {
    it('should set the dirty state of the field to true and the pristine state to false', () => {
      const reducer = createFormReducer('test');

      assert.containSubset(
        reducer(undefined, actions.setDirty('test.foo'))
          .field('foo'),
        {
          dirty: true,
          pristine: false
        });
    });

    it('should set the dirty state of the form to true and the pristine state to false', () => {
      const reducer = createFormReducer('test');

      assert.containSubset(
        reducer(undefined, actions.setDirty('test.foo')),
        {
          dirty: true,
          pristine: false
        });
    })
  });

  describe('setPending()', () => {
    it('should set the pending state of the field to true and the submitted state to false', () => {
      const reducer = createFormReducer('test');

      assert.containSubset(
        reducer(undefined, actions.setPending('test.foo'))
          .field('foo'),
        {
          pending: true,
          submitted: false
        });
    });

    it('should set the pending state of the field to the specified state', () => {
      const reducer = createFormReducer('test');

      let actualPending = reducer(undefined, actions.setPending('test.foo', true));

      assert.containSubset(
        actualPending
          .field('foo'),
        {
          pending: true,
          submitted: false
        });

      let actualNotPending = reducer(actualPending, actions.setPending('test.foo', false));

      assert.containSubset(
        actualNotPending
          .field('foo'),
        {
          pending: false,
          submitted: false
        });
    });

    it('should work with forms', () => {
      const reducer = createFormReducer('test');

      let actualPending = reducer(undefined, actions.setPending('test'));

      assert.containSubset(
        actualPending,
        {
          pending: true,
          submitted: false
        });

      assert.containSubset(
        reducer(actualPending, actions.setPending('test', false)),
        {
          pending: false,
          submitted: false
        });
    });
  });

  describe('setSubmitted()', () => {
    it('should set the submitted state of the field to true and the pending state to false', () => {
      const reducer = createFormReducer('test');

      assert.containSubset(
        reducer(undefined, actions.setSubmitted('test.foo'))
          .field('foo'),
        {
          submitted: true,
          pending: false
        });
    });

    it('should set the submitted state of the field to the specified state', () => {
      const reducer = createFormReducer('test');

      let actualSubmitted = reducer(undefined, actions.setSubmitted('test.foo', true));

      assert.containSubset(
        actualSubmitted
          .field('foo'),
        {
          submitted: true,
          pending: false
        });

      let actualNotSubmitted = reducer(actualSubmitted, actions.setSubmitted('test.foo', false));

      assert.containSubset(
        actualNotSubmitted
          .field('foo'),
        {
          submitted: false,
          pending: false
        });
    });

    it('should work with forms', () => {
      const reducer = createFormReducer('test');

      let actualSubmitted = reducer(undefined, actions.setSubmitted('test', true));

      assert.containSubset(
        actualSubmitted,
        {
          submitted: true,
          pending: false
        });

      let actualNotSubmitted = reducer(actualSubmitted, actions.setSubmitted('test', false));

      assert.containSubset(
        actualNotSubmitted,
        {
          submitted: false,
          pending: false
        });
    });
  });

  describe('setTouched()', () => {
    it('should set the touched and blurred state of the field to true and the untouched and focused state to false', () => {
      const reducer = createFormReducer('test');

      assert.containSubset(
        reducer(undefined, actions.setTouched('test.foo'))
          .field('foo'),
        {
          touched: true,
          untouched: false,
          focus: false,
          blur: true
        });
    });
  });

  describe('setUntouched()', () => {
    it('should set the untouched state of the field to true and the touched state to false', () => {
      const reducer = createFormReducer('test');

      assert.containSubset(
        reducer(undefined, actions.setUntouched('test.foo'))
          .field('foo'),
        {
          untouched: true,
          touched: false
        });
    });
  });

  describe('setValidity()', () => {
    it('should set the errors state of the field the inverse of a boolean validity', () => {
      const reducer = createFormReducer('test');

      assert.containSubset(
        reducer(undefined, actions.setValidity('test.foo', true))
          .field('foo'),
        {
          errors: false
        });

      assert.containSubset(
        reducer(undefined, actions.setValidity('test.foo', false))
          .field('foo'),
        {
          errors: true
        });
    });

    it('should set the errors state of the field the inverse of each value of a validity object', () => {
      const reducer = createFormReducer('test');

      let validity = {
        good: true,
        bad: false
      }

      assert.containSubset(
        reducer(undefined, actions.setValidity('test.foo', validity))
          .field('foo'),
        {
          errors: {
            good: false,
            bad: true
          }
        });
    });

    it('should set the valid state to true if all values in validity object are true', () => {
      const reducer = createFormReducer('test');

      let validity = {
        one: true,
        two: true
      };

      let actualForm = reducer(undefined, actions.setValidity('test.foo', validity));

      console.log(actualForm.fields);

      assert.containSubset(
        actualForm.field('foo'),
        {
          valid: true
        });

      assert.containSubset(
        actualForm,
        {
          valid: true
        }, 'form should be valid if all fields are valid');
    });

    it('should set the valid state to false if any value in validity object are false', () => {
      const reducer = createFormReducer('test');

      let validity = {
        one: true,
        two: true,
        three: false
      };

      let actualForm = reducer(undefined, actions.setValidity('test.foo', validity));

      assert.containSubset(
        actualForm.field('foo'),
        {
          valid: false
        });

      assert.containSubset(
        actualForm,
        {
          valid: false
        }, 'form should be invalid if any fields are invalid');
    });

    it('should be able to set the validity of a form', () => {
      const reducer = createFormReducer('test');

      let validity = {
        foo: true,
        baz: false
      };

      let actual = reducer(
        initialFieldState,
        actions.setValidity('test', validity));

      assert.containSubset(
        actual,
        {
          valid: false,
          errors: {
            foo: false,
            baz: true
          }
        });
    });
  });

  describe('asyncSetValidity() (thunk)', () => {
    it('should asynchronously call setValidity() action', (testDone) => {
      const reducer = createFormReducer('test');
      const dispatch = (action) => {
        if (action.type === 'rsf/setValidity') {        
          testDone(assert.containSubset(
            reducer(undefined, action)
              .field('foo'),
              {
              valid: false,
              errors: {
                good: false,
                bad: true
              }
            }));
        }
      };

      const getState = () => ({
        test: { foo: 5 }
      });

      let validator = (value, done) => done({
        good: value > 4,
        bad: value > 5
      });

      actions.asyncSetValidity('test.foo', validator)(dispatch, getState);
    });

    it('should set pending to false when validating, and true when done validating', (testDone) => {
      let pendingStates = [];

      const reducer = createFormReducer('test');
      const dispatch = (action) => {
        if (action.type === 'rsf/setPending') {
          pendingStates.push(action.pending);
          
          if (action.pending === false) { 
            testDone(assert.deepEqual(
              pendingStates,
              [true, false]));
          }
        }
      };

      const getState = () => ({});

      let validator = (_, done) => done(true);

      actions.asyncSetValidity('test.foo', validator)(dispatch, getState);
    });
  });
});
