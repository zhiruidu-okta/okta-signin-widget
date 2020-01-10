define(['./Form'], function (Form) {
  return Form.extend({
    enrollEmailActivateContent: function () {
      return this.el('enroll-activate-email-content').trimmedText();
    },

    setVerificationCode: function (val) {
      var field = this.input('passCode');
      field.val(val);
      field.trigger('change');
    },

  });
});
