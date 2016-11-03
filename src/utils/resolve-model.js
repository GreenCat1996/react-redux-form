import React, { Component, PropTypes } from 'react';
import shallowEqual from './shallow-equal';

function resolveModel(model, parentModel) {
  if (parentModel) {
    if (model[0] === '.' || model[0] === '[') {
      return `${parentModel}${model}`;
    }

    if (typeof model === 'function') {
      return (state) => model(state, parentModel);
    }
  }

  return model;
}

export default function wrapWithModelResolver(WrappedComponent) {
  class ResolvedModelWrapper extends Component {
    constructor(props, context) {
      super(props, context);

      this.model = context.model;
      this.store = context.localStore;
    }
    shouldComponentUpdate(nextProps) {
      return !shallowEqual(this.props, nextProps);
    }
    render() {
      const resolvedModel = resolveModel(
        this.props.model,
        this.model);

      return (<WrappedComponent
        {...this.props}
        model={resolvedModel}
        store={this.store || undefined}
      />);
    }
  }

  ResolvedModelWrapper.propTypes = {
    model: PropTypes.any,
  };

  ResolvedModelWrapper.contextTypes = {
    model: PropTypes.any,
    localStore: PropTypes.shape({
      subscribe: PropTypes.func,
      dispatch: PropTypes.func,
      getState: PropTypes.func,
    }),
  };

  return ResolvedModelWrapper;
}
