/* eslint max-params:[2, 14] */
import { internal } from 'okta';
import OktaAuth from '@okta/okta-auth-js/jquery';
import Router from 'LoginRouter';
import Beacon from 'helpers/dom/Beacon';
import Form from 'helpers/dom/EnrollCustomFactorForm';
import Util from 'helpers/mocks/Util';
import Expect from 'helpers/util/Expect';
import responseMfaEnrollActivateCustomOidc from 'helpers/xhr/MFA_ENROLL_ACTIVATE_CustomOidc';
import responseMfaEnrollActivateCustomSaml from 'helpers/xhr/MFA_ENROLL_ACTIVATE_CustomSaml';
import responseMfaEnrollAll from 'helpers/xhr/MFA_ENROLL_allFactors';
import resNoPermissionError from 'helpers/xhr/NO_PERMISSION_error';
import responseSuccess from 'helpers/xhr/SUCCESS';
import $sandbox from 'sandbox';
import LoginUtil from 'util/Util';
const SharedUtil = internal.util.Util;
const itp = Expect.itp;
const tick = Expect.tick;

Expect.describe('EnrollCustomFactor', function() {
  function setup(isOidc) {
    const setNextResponse = Util.mockAjax([responseMfaEnrollAll]);
    const baseUrl = 'https://foo.com';
    const authClient = new OktaAuth({ url: baseUrl, transformErrorXHR: LoginUtil.transformErrorXHR });
    const successSpy = jasmine.createSpy('success');
    const router = new Router({
      el: $sandbox,
      baseUrl: baseUrl,
      authClient: authClient,
      globalSuccessFn: successSpy,
    });

    Util.registerRouter(router);
    Util.mockRouterNavigate(router);
    return tick()
      .then(function() {
        router.refreshAuthState('dummy-token');
        return Expect.waitForEnrollChoices();
      })
      .then(function() {
        if (isOidc) {
          router.enrollOIDCFactor();
        } else {
          router.enrollSAMLFactor();
        }
        return Expect.waitForEnrollCustomFactor({
          router: router,
          beacon: new Beacon($sandbox),
          form: new Form($sandbox),
          ac: authClient,
          setNextResponse: setNextResponse,
          successSpy: successSpy,
        });
      });
  }

  Expect.describe('Header & Footer', function() {
    itp('displays the correct factorBeacon', function() {
      return setup().then(function(test) {
        expect(test.beacon.isFactorBeacon()).toBe(true);
        expect(test.beacon.hasClass('mfa-custom-factor')).toBe(true);
      });
    });
    itp('has a "back" link in the footer', function() {
      return setup().then(function(test) {
        Expect.isVisible(test.form.backLink());
      });
    });
  });

  Expect.describe('Enroll factor', function() {
    Expect.describe('GENERIC_SAML', function() {
      itp('displays correct title', function() {
        return setup().then(function(test) {
          test.setNextResponse(responseSuccess);
          expect(test.form.titleText()).toBe('Third Party Factor');
          expect(test.form.buttonBar().hasClass('hide')).toBe(false);
        });
      });

      itp('displays correct subtitle', function() {
        return setup().then(function(test) {
          test.setNextResponse(responseSuccess);
          expect(test.form.subtitleText()).toBe(
            'Clicking below will redirect to MFA enrollment with Third Party Factor'
          );
          expect(test.form.buttonBar().hasClass('hide')).toBe(false);
        });
      });

      itp('redirects to third party when Enroll button is clicked', function() {
        spyOn(SharedUtil, 'redirect');
        return setup()
          .then(function(test) {
            test.setNextResponse([responseMfaEnrollActivateCustomSaml, responseSuccess]);
            test.form.submit();
            return Expect.waitForSpyCall(SharedUtil.redirect);
          })
          .then(function() {
            expect(SharedUtil.redirect).toHaveBeenCalledWith(
              'http://rain.okta1.com:1802/policy/mfa-saml-idp-redirect?okta_key=mfa.redirect.id'
            );
          });
      });

      itp('displays error when error response received', function() {
        return setup()
          .then(function(test) {
            test.setNextResponse(resNoPermissionError);
            test.form.submit();
            return Expect.waitForFormError(test.form, test);
          })
          .then(function(test) {
            expect(test.form.hasErrors()).toBe(true);
            expect(test.form.errorMessage()).toBe('You do not have permission to perform the requested action');
          });
      });
    });

    Expect.describe('GENERIC_OIDC', function() {
      itp('displays correct title', function() {
        return setup(true).then(function(test) {
          test.setNextResponse(responseSuccess);
          expect(test.form.titleText()).toBe('OIDC Factor');
          expect(test.form.buttonBar().hasClass('hide')).toBe(false);
        });
      });

      itp('displays correct subtitle', function() {
        return setup(true).then(function(test) {
          test.setNextResponse(responseSuccess);
          expect(test.form.subtitleText()).toBe('Clicking below will redirect to MFA enrollment with OIDC Factor');
          expect(test.form.buttonBar().hasClass('hide')).toBe(false);
        });
      });

      itp('redirects to third party when Enroll button is clicked', function() {
        spyOn(SharedUtil, 'redirect');
        return setup(true)
          .then(function(test) {
            test.setNextResponse([responseMfaEnrollActivateCustomOidc, responseSuccess]);
            test.form.submit();
            return Expect.waitForSpyCall(SharedUtil.redirect);
          })
          .then(function() {
            expect(SharedUtil.redirect).toHaveBeenCalledWith(
              'http://rain.okta1.com:1802/policy/mfa-oidc-idp-redirect?okta_key=mfa.redirect.id'
            );
          });
      });

      itp('displays error when error response received', function() {
        return setup(true)
          .then(function(test) {
            test.setNextResponse(resNoPermissionError);
            test.form.submit();
            return Expect.waitForFormError(test.form, test);
          })
          .then(function(test) {
            expect(test.form.hasErrors()).toBe(true);
            expect(test.form.errorMessage()).toBe('You do not have permission to perform the requested action');
          });
      });
    });
  });
});
