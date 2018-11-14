/* eslint max-params: [2, 16] */
import OktaAuth from '@okta/okta-auth-js/jquery';
import Router from 'LoginRouter';
import Beacon from 'helpers/dom/Beacon';
import RecoveryChallengeForm from 'helpers/dom/RecoveryChallengeForm';
import Util from 'helpers/mocks/Util';
import Expect from 'helpers/util/Expect';
import res200 from 'helpers/xhr/200';
import resChallenge from 'helpers/xhr/RECOVERY_CHALLENGE';
import resResendError from 'helpers/xhr/SMS_RESEND_error';
import resVerifyError from 'helpers/xhr/SMS_VERIFY_error';
import resSuccess from 'helpers/xhr/SUCCESS';
import $sandbox from 'sandbox';
import { _, $, internal} from 'okta';
const SharedUtil = internal.util.Util;
const itp = Expect.itp;
const tick = Expect.tick;

function setup(settings) {
  const setNextResponse = Util.mockAjax();
  const baseUrl = 'https://foo.com';
  const authClient = new OktaAuth({ url: baseUrl });
  const router = new Router(
    _.extend(
      {
        el: $sandbox,
        baseUrl: baseUrl,
        features: { securityImage: true },
        authClient: authClient,
      },
      settings
    )
  );
  const form = new RecoveryChallengeForm($sandbox);
  const beacon = new Beacon($sandbox);

  Util.registerRouter(router);
  Util.mockRouterNavigate(router);
  Util.mockJqueryCss();

  setNextResponse(resChallenge);
  router.refreshAuthState('dummy-token');

  // Two ticks because of the extra defer that happens when we disable
  // the sent button.
  return Expect.waitForRecoveryChallenge({
    router: router,
    form: form,
    beacon: beacon,
    ac: authClient,
    setNextResponse: setNextResponse,
  }).then(tick);
}

Expect.describe('RecoveryChallenge', function() {
  beforeEach(function() {
    const throttle = _.throttle;

    spyOn(_, 'throttle').and.callFake(function(fn) {
      return throttle(fn, 0);
    });
    this.originalDelay = _.delay;
    spyOn(_, 'delay');
  });
  itp('displays the security beacon', function() {
    return setup().then(function(test) {
      expect(test.beacon.isSecurityBeacon()).toBe(true);
    });
  });
  itp('has a signout link which cancels the current stateToken and navigates to primaryAuth', function() {
    return setup()
      .then(function(test) {
        $.ajax.calls.reset();
        test.setNextResponse(res200);
        const $link = test.form.signoutLink();

        expect($link.length).toBe(1);
        $link.click();
        return Expect.waitForPrimaryAuth(test);
      })
      .then(function(test) {
        expect($.ajax.calls.count()).toBe(1);
        Expect.isJsonPost($.ajax.calls.argsFor(0), {
          url: 'https://foo.com/api/v1/authn/cancel',
          data: {
            stateToken: 'testStateToken',
          },
        });
        Expect.isPrimaryAuth(test.router.controller);
      });
  });
  itp('has a signout link which cancels the current stateToken and redirects to the provided signout url', function() {
    return setup({ signOutLink: 'http://www.goodbye.com' })
      .then(function(test) {
        spyOn(SharedUtil, 'redirect');
        $.ajax.calls.reset();
        test.setNextResponse(res200);
        const $link = test.form.signoutLink();

        expect($link.length).toBe(1);
        $link.click();
        return tick();
      })
      .then(function() {
        expect($.ajax.calls.count()).toBe(1);
        Expect.isJsonPost($.ajax.calls.argsFor(0), {
          url: 'https://foo.com/api/v1/authn/cancel',
          data: {
            stateToken: 'testStateToken',
          },
        });
        expect(SharedUtil.redirect).toHaveBeenCalledWith('http://www.goodbye.com');
      });
  });
  itp('has a text field to enter the recovery sms code', function() {
    return setup().then(function(test) {
      Expect.isTextField(test.form.codeField());
    });
  });
  itp('does not allow autocomplete', function() {
    return setup().then(function(test) {
      expect(test.form.getAutocompleteCodeField()).toBe('off');
    });
  });
  itp('has a disabled "Sent" button on initialize', function() {
    return setup()
      .then(function(test) {
        $.ajax.calls.reset();
        const button = test.form.resendButton();

        expect(button.text()).toBe('Sent');
        button.click();
        return tick();
      })
      .then(function() {
        expect($.ajax.calls.count()).toBe(0);
      });
  });
  itp('has a "Re-send" button after a short delay', function() {
    const delay = this.originalDelay;

    _.delay.and.callFake(function(func, wait, args) {
      return delay(func, 0, args);
    });
    return setup().then(function(test) {
      expect(test.form.resendButton().text()).toBe('Re-send code');
    });
  });
  itp('"Re-send" button will resend the code and then be disabled', function() {
    const delay = this.originalDelay;

    _.delay.and.callFake(function(func, wait, args) {
      return delay(func, 0, args);
    });
    return setup()
      .then(function(test) {
        $.ajax.calls.reset();
        test.setNextResponse(resChallenge);
        test.button = test.form.resendButton();
        test.button.click();
        expect(test.button.text()).toBe('Sent');
        expect(test.button.attr('class')).toMatch('link-button-disabled');
        return tick();
      })
      .then(function() {
        expect($.ajax.calls.count()).toBe(1);
        Expect.isJsonPost($.ajax.calls.argsFor(0), {
          url: 'https://foo.com/api/v1/authn/recovery/factors/SMS/resend',
          data: {
            stateToken: 'testStateToken',
          },
        });
      });
  });
  itp('displays only one error block when a resend button clicked several time and got error resp', function() {
    const delay = this.originalDelay;

    _.delay.and.callFake(function(func, wait, args) {
      return delay(func, 0, args);
    });
    return setup()
      .then(function(test) {
        test.setNextResponse(resResendError);
        test.form.resendButton().click();
        return tick(test);
      })
      .then(function(test) {
        expect(test.form.hasErrors()).toBe(true);
        expect(test.form.errorBox().length).toBe(1);
        test.setNextResponse(resResendError);
        test.form.resendButton().click();
        return tick(test);
      })
      .then(function(test) {
        expect(test.form.hasErrors()).toBe(true);
        expect(test.form.errorBox().length).toBe(1);
      });
  });
  itp('makes the right auth request when form is submitted', function() {
    return setup()
      .then(function(test) {
        $.ajax.calls.reset();
        test.form.setCode('1234');
        test.setNextResponse(resSuccess);
        test.form.submit();
        return tick();
      })
      .then(function() {
        expect($.ajax.calls.count()).toBe(1);
        Expect.isJsonPost($.ajax.calls.argsFor(0), {
          url: 'https://foo.com/api/v1/authn/recovery/factors/SMS/verify',
          data: {
            passCode: '1234',
            stateToken: 'testStateToken',
          },
        });
      });
  });
  itp('validates that the code is not empty before submitting', function() {
    return setup().then(function(test) {
      $.ajax.calls.reset();
      test.form.submit();
      expect($.ajax).not.toHaveBeenCalled();
      expect(test.form.hasErrors()).toBe(true);
    });
  });
  itp('shows an error msg if there is an error re-sending the code', function() {
    const delay = this.originalDelay;

    _.delay.and.callFake(function(func, wait, args) {
      return delay(func, 0, args);
    });
    return setup()
      .then(function(test) {
        test.setNextResponse(resResendError);
        test.form.resendButton().click();
        return tick(test);
      })
      .then(function(test) {
        expect(test.form.hasErrors()).toBe(true);
        expect(test.form.errorMessage()).toBe('You do not have permission to perform the requested action');
      });
  });
  itp('shows an error msg if there is an error submitting the code', function() {
    return setup()
      .then(function(test) {
        test.setNextResponse(resVerifyError);
        test.form.setCode('1234');
        test.form.submit();
        return tick(test);
      })
      .then(function(test) {
        expect(test.form.hasErrors()).toBe(true);
        expect(test.form.errorMessage()).toBe('You do not have permission to perform the requested action');
      });
  });
});
