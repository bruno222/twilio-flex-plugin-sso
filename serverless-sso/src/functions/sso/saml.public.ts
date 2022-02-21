/**
 *
 * Test URL:
 *
 *   https://bkilian.eu.ngrok.io/sso/saml?SAMLRequest=rVPLjtowFP2VyPu8gQQLkNLQBxKFCGgX3VQe%2B2bGmsSmvg4wf18Thg6LGVZdRJbu4%2Fic45MJsrbZ06KzT2oDfzpA653aRiHtG1PSGUU1Q4lUsRaQWk63xfclTYKI7o22muuG3Kzc32CIYKzUiniL%2BZSsV5%2BX66%2BL1e%2FBKMtHSQ5%2BBqz2BymM%2FHE8zvwsT%2FN4zAZZGgni%2FQSDbndKHJQDQOxgodAyZV0pShI%2Fiv002iUJjQd0GP8iXmX0QQowK8dkSnZH2UhNvLlTKRWzPdaTtXukYfjw7JpMBdAF6tHo50DqENF9TlQP1Ev9JJWQ6vG%2ByofLENJvu13lV%2BvtjnjFVXmpFXYtmC2Yg%2BTwY7N84yBZG9ieZMB1Gx7isOBcd8piWJRRVEdiEA%2FrfCwg5dkQUhGlcQQ5z8eQ1T3ThMwm55P27pjZf0QOW7BMMMsm4e0Nk0uCzg4v5pVuJH%2FxvmjTMvuxSXEQ9xUp%2FLofpdAy2RRCGEB0ZjWNPpYGmHWvZk0HxAuvF72mFESfWeemhZP1St3umZF4flE4MW6vPtxOlY3L3wbq2d2IcsrPc65cueOojXgV%2FC7UpfcBrX%2Fd2%2F9r9hc%3D&atobState=AAAAAS5GQVNfUzNfS01TX3YxOjo6%2F4D%2FjeF0KXdrDqfTf95QLgcve8%2FXdyGi9fSPIbh7F7FZ7xD0%2FI8SlWND%2BgkeqWBADdc%2Ffos1xVwagNsMLwrliBLHvehqIjT4IODs12c9sns6L2VbIthf
 */
import '@twilio-labs/serverless-runtime-types';
import { ServerlessCallback, ServerlessFunctionSignature } from '@twilio-labs/serverless-runtime-types/types';
import { ServiceProvider } from 'samlify';
const { ohNoCatch, MIN, startCachedStuff } = require(Runtime.getFunctions()['utils/helper'].path);

type MyEvent = {
  SAMLRequest: string;
  RelayState: string;
};

type MyContext = {
  SYNC_SERVICE_SID: string;
  DOMAIN_WHILE_WORKING_LOCALLY?: string;
};

export const handler: ServerlessFunctionSignature<MyContext, MyEvent> = async (context, event, callback: ServerlessCallback) => {
  try {
    const twilioClient = context.getTwilioClient();
    const { SYNC_SERVICE_SID, DOMAIN_NAME, DOMAIN_WHILE_WORKING_LOCALLY } = context;
    const whichDomain = DOMAIN_WHILE_WORKING_LOCALLY ? DOMAIN_WHILE_WORKING_LOCALLY : DOMAIN_NAME;
    const { idp } = startCachedStuff(twilioClient, SYNC_SERVICE_SID, whichDomain);

    console.log('event:', event);
    const { SAMLRequest, RelayState } = event;

    const sp = ServiceProvider({ isAssertionEncrypted: false });

    const { extract } = await idp.parseLoginRequest(sp, 'redirect', {
      query: {
        SAMLRequest,
      },
    });

    const id = extract.request.id;

    const response = new Twilio.Response();
    response.setStatusCode(301);
    response.appendHeader('Location', `https://${whichDomain}/sso/login?id=${encodeURIComponent(id)}&RelayState=${encodeURIComponent(RelayState)}`);
    return callback(null, response);
  } catch (e) {
    ohNoCatch(e, callback);
  }
};
