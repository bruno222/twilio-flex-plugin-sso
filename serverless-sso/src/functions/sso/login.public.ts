/**
 *
 * Test URL:
 *
 *   https://serverless-sso-5088-dev.twil.io/sso/login?id=ONELOGIN_c6481bf2-b87f-4e75-9013-3dcfbd643c3d&RelayState=AAAAAS5GQVNfUzNfS01TX3YxOjo66rGrLYQONcmv2k4LUSxOgzRDNUE%2FxsFWM10t7XJHtrjWwFMywxwLXWdirYxj%2BeexVH%2FZ%2BbcpVKcCkzsglNooqa7T1%2BuRGDxbWvP%2BLE0P2ADGi90Ajgtl
 */
import '@twilio-labs/serverless-runtime-types';
import { ServerlessCallback, ServerlessFunctionSignature } from '@twilio-labs/serverless-runtime-types/types';
import { SamlLib } from 'samlify';
import * as HelperType from '../utils/helper.protected';

const { ohNoCatch, myRequire } = <typeof HelperType>require(Runtime.getFunctions()['utils/helper'].path);

type MyEvent = {
  id: string;
  RelayState: string;
};

type MyContext = {
  SYNC_SERVICE_SID: string;
  DOMAIN_WHILE_WORKING_LOCALLY?: string;
  ACCOUNT_SID: string;
};

const htmlTemplate = myRequire('template-login.html');

export const handler: ServerlessFunctionSignature<MyContext, MyEvent> = async (context, event, callback: ServerlessCallback) => {
  try {
    const { DOMAIN_NAME, DOMAIN_WHILE_WORKING_LOCALLY, ACCOUNT_SID } = context;
    const whichDomain = DOMAIN_WHILE_WORKING_LOCALLY ? DOMAIN_WHILE_WORKING_LOCALLY : DOMAIN_NAME;

    console.log('event login:', event);

    const toReplace = {
      DOMAIN_NAME: whichDomain,
      ACCOUNT_SID,
    };

    const html = SamlLib.replaceTagsByValue(htmlTemplate, toReplace);

    const response = new Twilio.Response();
    response.setBody(html);
    response.setStatusCode(200);
    response.appendHeader('Content-Type', 'text/html');
    return callback(null, response);
  } catch (e) {
    ohNoCatch(e, callback);
  }
};
