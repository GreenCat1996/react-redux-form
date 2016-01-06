import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import contains from 'lodash/collection/contains';
import get from 'lodash/object/get';
import defaults from 'lodash/object/defaults';
import compose from 'lodash/function/compose';
import capitalize from 'lodash/string/capitalize';
import identity from 'lodash/utility/identity';
import mapValues from 'lodash/object/mapValues';
import isEqual from 'lodash/lang/isEqual';
import partial from 'lodash/function/partial';

import {
  change,
  toggle,
  xor
} from '../actions/model-actions';
import {
  focus,
  blur,
  setValidity,
  asyncSetValidity
} from '../actions/field-actions';

import Control from './control-component';

import {
  isMulti,
  getValue
} from '../utils';

function selector(state, { model }) {
  return {
    model,
    modelValue: get(state, model)
  };
}

const controlPropsMap = {
  'text': (props) => ({
    name: props.model,
    defaultValue: props.modelValue
  }),
  'textarea': (props) => ({
    name: props.model,
    defaultValue: props.modelValue
  }),
  'checkbox': (props) => ({
    name: model,
    checked: isMulti(props.model)
      ? contains(props.modelValue, props.value)
      : !!props.modelValue
  }),
  'radio': (props) => ({
    name: props.model,
    checked: props.modelValue === props.value
  }),
  'select': (props) => ({
    name: props.model
  }),
  'default': (props) => ({})
};

const changeMethod = (model, value, action = change, parser = (a) => a) => {
  return compose(partial(action, model), parser, getValue)(value);
};

const controlActionMap = {
  'checkbox': (props) => isMulti(props.model)
    ? xor
    : toggle,
  'default': () => change
};

class Field extends React.Component {
  createField(control, props) {
    if (!control
      || !control.props
      || Object.hasOwnProperty(control.props, 'modelValue')
    ) return control;

    let {
      dispatch,
      model,
      modelValue,
      validators,
      asyncValidators,
      parse
    } = props;
    let value = control.props.value;
    let updateOn = (typeof props.updateOn === 'function')
      ? 'onChange'
      : `on${capitalize(props.updateOn || 'change')}`;
    let validateOn = `on${capitalize(props.validateOn || 'change')}`;
    let asyncValidateOn = `on${capitalize(props.asyncValidateOn || 'blur')}`;

    let defaultProps = {};

    let eventActions = {
      onFocus: [() => dispatch(focus(model))],
      onBlur: [() => dispatch(blur(model))],
      onChange: []
    };

    let controlType = control.type === 'input'
      ? control.props.type
      : control.type;

    let controlProps = (controlPropsMap[controlType] || controlPropsMap.default)(props);
    let controlAction = (controlActionMap[controlType] || controlActionMap.default)(props);

    // let changeMethod = (model, value) => {
    //   return change(model, (parse || ((a) => a))(getValue(value)));
    // };

    let controlChangeMethod = changeMethod(props.model, props.value, controlAction, parse);

    let dispatchChange = control.props.hasOwnProperty('value')
      ? () => dispatch(controlChangeMethod(model, value))
      : (e) => dispatch(controlChangeMethod(model, e));

    // switch (control.type) {
    //   case 'input':
    //   case 'textarea':
    //     switch (control.props.type) {
    //       case 'checkbox':
    //         defaultProps = {
    //           name: model,
    //           checked: isMulti(model)
    //             ? contains(modelValue, value)
    //             : !!modelValue
    //         };

    //         changeMethod = isMulti(model)
    //           ? xor
    //           : toggle;

    //         break;

    //       case 'radio':
    //         defaultProps = {
    //           name: model,
    //           checked: modelValue === value
    //         };

    //         break;

    //       default:
    //         defaultProps = {
    //           name: model,
    //           defaultValue: modelValue
    //         };

    //         dispatchChange = (e) => dispatch(changeMethod(model, e));

    //         break;
    //     }
    //     break;
    //   case 'select':
    //     dispatchChange = (e) => dispatch(changeMethod(model, e));

    //     break;

    //   default:
    //     if (control.props.children && control.props.children.length) {
    //       return React.cloneElement(
    //         control,
    //         {
    //           children: React.Children.map(
    //             control.props.children,
    //             (child) => this.createField(child, props)
    //           )
    //         });
    //     }
    //     return control;
    // }

    if (typeof props.updateOn === 'function') {
      dispatchChange = props.updateOn(dispatchChange);
    }

    eventActions[updateOn].push(dispatchChange);

    if (validators) {
      let dispatchValidate = (e) => {
        let validatingValue = control.props.hasOwnProperty('value')
          ? value
          : e.target.value;
        let validity = mapValues(validators,
          (validator) => validator(validatingValue));

        dispatch(setValidity(model, validity));
      }

      eventActions[validateOn].push(dispatchValidate);
    }

    if (asyncValidators) {
      let dispatchAsyncValidate = (e) => {
        let validatingValue = control.props.hasOwnProperty('value')
          ? value
          : e.target.value;

        mapValues(asyncValidators,
          (validator, key) => dispatch(asyncSetValidity(model, (value, done) => {
            const outerDone = (valid) => done({ [key]: valid });

            validator(value, outerDone);
          })));
      }

      eventActions[asyncValidateOn].push(dispatchAsyncValidate);
    }

    return (
      <Control
        {...controlProps}
        {...mapValues(eventActions, (actions) => compose(...actions))}
        modelValue={modelValue}
        control={control} />
    );
  }

  render() {
    let { props } = this;

    if (props.children.length > 1) {
      return <div {...props}>
        { React.Children.map(props.children, (child) => this.createField(child, props)) }
      </div>
    }

    return this.createField(React.Children.only(props.children), props);
  }
}

export default connect(selector)(Field);
