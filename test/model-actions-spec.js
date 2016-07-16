import { assert } from 'chai';
import { combineReducers } from 'redux';
import { actions, modelReducer, formReducer, track } from '../src';

describe('model actions', () => {
  const testItems = [
    { id: 1, value: 'one' },
    { id: 2, value: 'two' },
    { id: 3, value: 'three' },
  ];

  describe('load()', () => {
    it('should load model values', () => {
      const reducer = modelReducer('foo');

      const actual = reducer({}, actions.load('foo', { bar: 'string' }));
      assert.deepEqual(actual, { bar: 'string' });
    });

    it('should load model and form stay untouched', () => {
      const reducer = combineReducers({
        foo: modelReducer('foo'),
        fooForm: formReducer('foo'),
      });

      const actual = reducer({}, actions.load('foo', { bar: 'string' }));
      assert.deepEqual(actual.foo, { bar: 'string' });
      assert.equal(actual.fooForm.dirty, false);
      assert.equal(actual.fooForm.untouched, true);
    });
  });

  describe('change()', () => {
    it('should modify the model given a shallow path', () => {
      const reducer = modelReducer('foo');

      const actual = reducer({}, actions.change('foo.bar', 'string'));
      assert.deepEqual(actual, { bar: 'string' });
    });

    it('should modify the model given a deep path', () => {
      const reducer = modelReducer('foo');

      const actual = reducer({}, actions.change('foo.bar.baz', 'string'));
      assert.deepEqual(actual, { bar: { baz: 'string' } });
    });

    it('should work with a tracker', () => {
      const reducer = modelReducer('foo', testItems);

      const dispatch = (action) => {
        const actual = reducer(undefined, action);
        assert.deepEqual(actual[1], { id: 2, value: 'tracked' });
      };

      const getState = () => ({ foo: testItems });

      actions.change(
        track('foo[].value', { id: 2 }),
        'tracked')(dispatch, getState);
    });
  });

  describe('reset()', () => {
    it('should reset the model to the initial state provided in the reducer', () => {
      const reducer = modelReducer('test', {
        foo: 'initial',
      });

      const actual = reducer({ foo: 'bar' }, actions.reset('test.foo'));

      assert.deepEqual(actual, { foo: 'initial' });
    });

    it('should set the model to undefined if an initial state was not provided from a deep model',
      () => {
        const reducer = modelReducer('test', {
          foo: 'initial',
        });

        const actual = reducer({ bar: { baz: 'uninitialized' } }, actions.reset('test.bar.baz'));

        assert.isDefined(actual.bar);

        assert.isUndefined(actual.bar.baz);
      });

    it('should set the model to undefined if an initial state was not provided', () => {
      const reducer = modelReducer('test', {
        foo: 'initial',
      });

      const actual = reducer({ bar: 'uninitialized' }, actions.reset('test.bar'));

      assert.isUndefined(actual.bar);
    });

    it('should be able to reset an entire model', () => {
      const initialState = {
        foo: 'test foo',
        bar: 'test bar',
        baz: { one: 'two' },
      };

      const reducer = modelReducer('test', initialState);

      const actual = reducer({}, actions.reset('test'));

      assert.deepEqual(actual, initialState);
    });
  });

  describe('thunk action creators', () => {
    const actionTests = {
      push: [
        {
          init: { foo: [123] },
          params: ['test.foo', 456],
          expected: { foo: [123, 456] },
        },
        {
          init: {},
          params: ['test.foo', 456],
          expected: { foo: [456] },
        },
        {
          init: [
            testItems[0],
            { id: 2, value: ['two'] },
            testItems[2],
          ],
          params: [track('test[].value', { id: 2 }), 'pushed'],
          expected: [
            testItems[0],
            {
              id: 2,
              value: ['two', 'pushed'],
            },
            testItems[2],
          ],
        },
      ],
      xor: [
        {
          init: { foo: [123, 456] },
          params: ['test.foo', 456],
          expected: { foo: [123] },
        },
        {
          init: { foo: ['primitive', { a: 'b' }] },
          params: ['test.foo', { a: 'b' }, (item) => item.a === 'b'],
          expected: { foo: ['primitive'] },
        },
        {
          init: [
            testItems[0],
            { id: 2, value: ['two'] },
            testItems[2],
          ],
          params: [track('test[].value', { id: 2 }), 'two'],
          expected: [
            testItems[0],
            { id: 2, value: [] },
            testItems[2],
          ],
        },
      ],
      toggle: [
        {
          init: { foo: true },
          params: ['test.foo'],
          expected: { foo: false },
        },
        {
          init: testItems,
          params: [track('test[].value', { id: 2 })],
          expected: [
            testItems[0],
            { id: 2, value: false },
            testItems[2],
          ],
        },
      ],
      filter: [
        {
          init: { foo: [1, 2, 3, 4, 5, 6] },
          params: ['test.foo', n => n % 2 === 0],
          expected: { foo: [2, 4, 6] },
        },
        {
          init: [
            testItems[0],
            { id: 2, value: [1, 2, 3, 4, 5, 6] },
            testItems[2],
          ],
          params: [track('test[].value', { id: 2 }), n => n % 2 === 0],
          expected: [
            testItems[0],
            { id: 2, value: [2, 4, 6] },
            testItems[2],
          ],
        },
      ],
      map: [
        {
          init: { foo: [1, 2, 3, 4, 5] },
          params: ['test.foo', n => n * 2],
          expected: { foo: [2, 4, 6, 8, 10] },
        },
        {
          init: [
            testItems[0],
            { id: 2, value: [1, 2, 3, 4, 5] },
            testItems[2],
          ],
          params: [track('test[].value', { id: 2 }), n => n * 2],
          expected: [
            testItems[0],
            { id: 2, value: [2, 4, 6, 8, 10] },
            testItems[2],
          ],
        },
      ],
      remove: [
        {
          init: { foo: ['first', 'second', 'third'] },
          params: ['test.foo', 1],
          expected: { foo: ['first', 'third'] },
        },
        {
          init: [
            testItems[0],
            { id: 2, value: ['first', 'second', 'third'] },
            testItems[2],
          ],
          params: [track('test[].value', { id: 2 }), 1],
          expected: [
            testItems[0],
            { id: 2, value: ['first', 'third'] },
            testItems[2],
          ],
        },
      ],
      move: [
        {
          init: { foo: ['first', 'second', 'third'] },
          params: ['test.foo', 2, 1],
          expected: { foo: ['first', 'third', 'second'] },
        },
        {
          init: { foo: ['first', 'second', 'third'] },
          params: ['test.foo', 0, 2],
          expected: { foo: ['second', 'third', 'first'] },
        },
        {
          init: { foo: [] },
          params: ['test.foo', 0, 2],
          expected: Error('Error moving array item: invalid bounds 0, 2'),
        },
        {
          init: [
            testItems[0],
            { id: 2, value: ['first', 'second', 'third'] },
            testItems[2],
          ],
          params: [track('test[].value', { id: 2 }), 0, 2],
          expected: [
            testItems[0],
            { id: 2, value: ['second', 'third', 'first'] },
            testItems[2],
          ],
        },
      ],
      merge: [
        {
          init: { foo: { bar: 'baz', untouched: 'intact' } },
          params: ['test.foo', { bar: 'new', one: 'two' }],
          expected: { foo: { bar: 'new', one: 'two', untouched: 'intact' } },
        },
        {
          init: [
            testItems[0],
            { id: 2, value: { bar: 'baz', untouched: 'intact' } },
            testItems[2],
          ],
          params: [
            track('test[].value', { id: 2 }),
            { bar: 'new', one: 'two' },
          ],
          expected: [
            testItems[0],
            { id: 2, value: { bar: 'new', one: 'two', untouched: 'intact' } },
            testItems[2],
          ],
        },
      ],
      omit: [
        {
          init: { one: 1, two: 2, three: 3 },
          params: ['test', 'two'],
          expected: { one: 1, three: 3 },
        },
        {
          init: { one: 1, two: 2, three: 3 },
          params: ['test', ['one', 'three']],
          expected: { two: 2 },
        },
        {
          init: [
            testItems[0],
            { id: 2, value: { one: 1, two: 2, three: 3 } },
            testItems[2],
          ],
          params: [track('test[].value', { id: 2 }), 'two'],
          expected: [
            testItems[0],
            { id: 2, value: { one: 1, three: 3 } },
            testItems[2],
          ],
        },
      ],
    };

    /* eslint-disable array-callback-return */
    Object.keys(actionTests).map((action) => {
      describe(`${action}()`, () => {
        actionTests[action].map((test) => {
          const { init, params, expected } = test;
          it('should modify the model to the expected result', () => {
            const reducer = modelReducer('test');
            const getState = () => ({ test: init });
            const dispatch = (_action) => {
              if (typeof _action === 'function') {
                _action(dispatch, getState);
              } else {
                assert.deepEqual(
                  reducer(init, _action),
                  expected);
              }
            };

            if (expected instanceof Error) {
              assert.throws(() => actions[action](...params)(dispatch, getState), expected.message);
            } else {
              actions[action](...params)(dispatch, getState);
            }
          });
        });
      });
    });
    /* eslint-enable */
  });
});
