import PrimaryAuthForm from './PrimaryAuthForm';
const CLASS_SELECTOR = '.idp-discovery';
const NEXT_BUTTON = '.button.button-primary';
export default PrimaryAuthForm.extend({
  isIDPDiscovery: function() {
    return this.$(CLASS_SELECTOR).length === 1;
  },

  idpDiscoveryForm: function() {
    return this.$(CLASS_SELECTOR + ' form');
  },

  nextButton: function() {
    return this.$(NEXT_BUTTON);
  },

  inputsDisabled: function() {
    return this.usernameField().is(':disabled') && this.rememberMeCheckbox().is(':disabled');
  },
});
