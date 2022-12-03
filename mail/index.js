import ReactDOM from 'react-dom/server';

import { ActivationByToken } from './components/Activation';
import { EmailConfirmation } from './components/Confirmation';
import { BaseNotification } from './components/Notification';
import { Recovery } from './components/Recovery';

function Render(Component, props) {
  return ReactDOM.renderToString(<Component {...props} />);
}

export default {
  Activation: function (props) {
    return Render(ActivationByToken, props);
  },
  Confirmation: function (props) {
    return Render(EmailConfirmation, props);
  },
  Notification: function (props) {
    return Render(BaseNotification, props);
  },
  Recovery: function (props) {
    return Render(Recovery, props);
  },
};
