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
      this.trigger('form:clear-errors');
      return this.doTransaction(function (transaction) {
        // authn support multiple `resend` hence has to specify name.
        return transaction.resend('email');
      });
    },

    save: function () {
      this.trigger('save');
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
      hasSavingState: true,
      formChildren: [
        // message
        FormType.View({
          View: Okta.View.extend({
            attributes: {
              'data-se': 'enroll-activate-email-content',
            },
            template: 'A verification code was sent to <span class="mask-email">{{factorEmail}}</span>. ' +
              'Check your email and enter the code below.',

            getTemplateData: function () {
              const factor = this.options.appState.get('factor');

              return {
                factorEmail: factor && factor.profile ? factor.profile.email : ''
              };
            },

          })
        }),
        // passcode input
        FormType.Input({
          label: 'Verification code',
          'label-top': true,
          name: 'passCode',
          type: 'text',
          wide: true,
        }),
        // send again link button
        FormType.View({
          View: Okta.View.extend({
            template: '<a href="#" class="email-activate-send-again-btn">send again</a>',
            events: {
              'click .email-activate-send-again-btn': 'resendEmail',
            },
            resendEmail: function (e) {
              e.preventDefault();
              this.model.resend();
            },
            initialize: function () {
            },
          })
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
