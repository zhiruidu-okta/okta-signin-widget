let { $ } = Okta;

$.fn.trimmedText = function() {
  return $.trim(this.text());
};
