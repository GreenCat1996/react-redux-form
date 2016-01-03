import React from 'react';
import { connect } from 'react-redux';
import { Field, actions } from 'redux-simple-form';
import debounce from 'lodash/function/debounce';

import Recipe from '../components/recipe-component';

class MultiRecordRecipe extends React.Component {
  render() {
    let { multiRecord, dispatch } = this.props;

    return (
      <Recipe model="multiRecord">
        <h2>Multiple Records</h2>
        <table><tbody>
        { multiRecord.map((record, i) => 
          <tr key={i}>
            <td>
              <Field model={`multiRecord[${i}].name`}>
                <input type="text" />
              </Field>
            </td>
            <td>
              <Field model={`multiRecord[${i}].description`}
                updateOn={(change) => debounce(change, 1000)}>
                <input type="text" />
              </Field>
            </td>
            <td>
              <Field model={`multiRecord[${i}].quantity`}
                parse={a => +a}>
                <input type="text" />
              </Field>
            </td>
            <td>
              <Field model={`multiRecord[${i}].price`}
                parse={a => +a}>
                <input type="text" />
              </Field>
            </td>
          </tr>
        )}
        </tbody></table>
        <button type="button"
          onClick={() => dispatch(actions.push('multiRecord', {}))}>
          Add new record
        </button>
      </Recipe>
    );
  }
}

export default connect(s => s)(MultiRecordRecipe);
