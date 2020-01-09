/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *
 * See the License for the specific language governing permissions and limitations under the License.
 */
define([
  'okta',
  'util/FormController',
  'views/enroll-factors/Footer',
  'util/FormType',
],
function (Okta, FormController, Footer, FormType) {

  var _ = Okta._;

  const Model = {
    props: {
      passCode: 'string',
    },

    resend: function () {
      return this.doTransaction(function (transaction) {
        return transaction.resend();
      });
    },

    save: function () {
      const formData = this.toJSON();
      return this.doTransaction(function (transaction) {
        return transaction.activate(formData);
      });
    }
  };

  const Form = function () {
    return {
      title: 'Set up Email Authentication',
      noButtonBar: false,
      autoSave: true,
      save: _.partial(Okta.loc, 'mfa.challenge.verify', 'login'),
      formChildren: [
        FormType.View({
          View: Okta.View.extend({
            template: 'A verification code was sent to {{factorEmail}}. Check your email and enter the code below.',

            getTemplateData: function () {
              const factor = this.options.appState.get('factor');

              return {
                factorEmail: factor && factor.profile ? factor.profile.email : ''
              };
            },

          })
        }),
        FormType.Input({
          label: 'Verification code',
          'label-top': true,
          name: 'passcode',
          type: 'text',
          wide: true,
        }),
      ]
    };
  };

  return FormController.extend({

    className: 'enroll-activate-email',

    Model: Model,

    Form: Form,

    Footer: Footer,

    initialize: function () {
      // this.model.set(_.pick(this.options, 'factorType', 'provider'));
    }

  });

});
