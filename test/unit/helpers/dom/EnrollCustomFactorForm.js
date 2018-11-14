import Form from './Form';
export default Form.extend({
  backLink: function() {
    return this.el('back-link');
  },

  buttonBar: function() {
    return this.$('.o-form-button-bar');
  },
});
