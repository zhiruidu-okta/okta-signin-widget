import { loc } from 'okta';
import BaseForm from '../../internals/BaseForm';
import BaseFooter from '../../internals/BaseFooter';
import BaseFactorView from '../shared/BaseFactorView';

const Body = BaseForm.extend({

  title: loc('factor.password', 'login'),

  save: loc('mfa.challenge.verify', 'login'),
});

const Footer = BaseFooter.extend({
  links: function () {
    var links = [
      {
        'type': 'link',
        'label': 'Forgot Password',
        'name': 'forgot-password',
        'actionPath': 'factor.recovery',
      }
    ];
    // check if we have a select-factor form in remediation, if so add a link
    if (this.options.appState.hasRemediationForm('select-factor')) {
      links.push({
        'type': 'link',
        'label': 'Switch Factor',
        'name': 'switchFactor',
        'formName': 'select-factor',
      });
    }
    return links;
  }
});

export default BaseFactorView.extend({
  Body,
  Footer,
});
