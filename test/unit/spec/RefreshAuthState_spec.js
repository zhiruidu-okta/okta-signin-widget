/* eslint max-params: [2, 25] */
import OktaAuth from '@okta/okta-auth-js/jquery';
import Router from 'LoginRouter';
import Beacon from 'helpers/dom/Beacon';
import FormView from 'helpers/dom/Form';
import Util from 'helpers/mocks/Util';
import Expect from 'helpers/util/Expect';
import resEnroll from 'helpers/xhr/MFA_ENROLL_allFactors';
import resSecurityImage from 'helpers/xhr/security_image';
import Q from 'q';
import $sandbox from 'sandbox';
const { _, $ } = Okta;
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
        authClient: authClient,
        features: {
          securityImage: true,
        },
      },
      settings
    )
  );
  const beacon = new Beacon($sandbox);
  const form = new FormView($sandbox);

  Util.registerRouter(router);
  Util.mockRouterNavigate(router);
  Util.mockJqueryCss();
  return Q({
    router: router,
    beacon: beacon,
    form: form,
    ac: authClient,
    setNextResponse: setNextResponse,
  });
}

Expect.describe('RefreshAuthState', function() {
  itp('redirects to PrimaryAuth if authClient does not need a refresh', function() {
    return setup()
      .then(function(test) {
        spyOn(test.ac.tx, 'exists').and.returnValue(false);
        test.router.refreshAuthState();
        return Expect.waitForPrimaryAuth(test);
      })
      .then(function(test) {
        Expect.isPrimaryAuth(test.router.controller);
      });
  });
  itp('refreshes auth state on render if it does need a refresh', function() {
    return setup()
      .then(function(test) {
        Util.mockSDKCookie(test.ac);
        test.setNextResponse(resEnroll);
        test.router.refreshAuthState();
        return tick(test);
      })
      .then(function() {
        expect($.ajax.calls.count()).toBe(1);
        Expect.isJsonPost($.ajax.calls.argsFor(0), {
          url: 'https://foo.com/api/v1/authn',
          data: {
            stateToken: 'testStateToken',
          },
        });
      });
  });
  itp('calls status with token if initialized with token', function() {
    return setup({ stateToken: 'someStateToken' })
      .then(function(test) {
        test.setNextResponse(resEnroll);
        test.router.refreshAuthState();
        return tick(test);
      })
      .then(function() {
        expect($.ajax.calls.count()).toBe(1);
        Expect.isJsonPost($.ajax.calls.argsFor(0), {
          url: 'https://foo.com/api/v1/authn',
          data: {
            stateToken: 'someStateToken',
          },
        });
      });
  });
});
