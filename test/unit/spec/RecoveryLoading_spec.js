/* eslint max-params: [2, 15] */
import OktaAuth from '@okta/okta-auth-js/jquery';
import Router from 'LoginRouter';
import Beacon from 'helpers/dom/Beacon';
import PrimaryAuthFormView from 'helpers/dom/PrimaryAuthForm';
import RecoveryFormView from 'helpers/dom/RecoveryQuestionForm';
import Util from 'helpers/mocks/Util';
import Expect from 'helpers/util/Expect';
import resRecovery from 'helpers/xhr/RECOVERY';
import resSecurityImage from 'helpers/xhr/security_image';
import $sandbox from 'sandbox';
import { _, $ } from 'okta';
const itp = Expect.itp;
const tick = Expect.tick;

function setup(settings, callRecoveryLoading) {
  const setNextResponse = Util.mockAjax();
  const baseUrl = 'https://foo.com';
  const authClient = new OktaAuth({ url: baseUrl });
  const router = new Router(
    _.extend(
      {
        el: $sandbox,
        baseUrl: baseUrl,
        authClient: authClient,
      },
      settings
    )
  );
  const beacon = new Beacon($sandbox);
  const form = new RecoveryFormView($sandbox);

  Util.registerRouter(router);
  Util.mockRouterNavigate(router);

  setNextResponse(resRecovery);
  if (callRecoveryLoading) {
    router.navigate('signin/recovery/SOMETOKEN', { trigger: true });
  } else {
    router.navigate('', { trigger: true });
  }
  return tick().then(function() {
    return {
      router: router,
      beacon: beacon,
      form: form,
      ac: authClient,
      setNextResponse: setNextResponse,
    };
  });
}

Expect.describe('Recovery Loading', function() {
  itp('makes a request with correct token passed in url', function() {
    return setup({}, true).then(function(test) {
      expect($.ajax.calls.count()).toBe(1);
      Expect.isJsonPost($.ajax.calls.argsFor(0), {
        url: 'https://foo.com/api/v1/authn/recovery/token',
        data: {
          recoveryToken: 'SOMETOKEN',
        },
      });
      expect(test.form.isRecoveryQuestion()).toBe(true);
    });
  });

  itp('makes a request with correct token passed in settings', function() {
    return setup({ recoveryToken: 'SETTINGSTOKEN' }, false)
      .then(function(test) {
        expect($.ajax.calls.count()).toBe(1);
        Expect.isJsonPost($.ajax.calls.argsFor(0), {
          url: 'https://foo.com/api/v1/authn/recovery/token',
          data: {
            recoveryToken: 'SETTINGSTOKEN',
          },
        });
        expect(test.form.isRecoveryQuestion()).toBe(true);
        // the token in settings is unset after the initial navigation
        // so the following navigations are not affected
        test.router.navigate('', { trigger: true });
        return Expect.waitForPrimaryAuth();
      })
      .then(function() {
        const form = new PrimaryAuthFormView($sandbox);

        expect(form.isPrimaryAuth()).toBe(true);
      });
  });

  // It doesn't actually do this. Will leave this here as a reminder that
  // this functionality has not been implemented yet.
  it('calls a callback function if no token passed in settings');
});
