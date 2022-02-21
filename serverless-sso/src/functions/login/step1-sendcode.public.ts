import '@twilio-labs/serverless-runtime-types';
import { ServerlessCallback, ServerlessFunctionSignature } from '@twilio-labs/serverless-runtime-types/types';
import * as HelperType from '../utils/helper.protected';

const { ohNoCatch, formatNumberToE164, SyncClass } = <typeof HelperType>require(Runtime.getFunctions()['utils/helper'].path);

type MyEvent = {
  phoneNumber: string;
};

type MyContext = {
  SYNC_SERVICE_SID: string;
  SYNC_LIST_SID: string;
  VERIFY_SERVICE_SID: string;
};

export const handler: ServerlessFunctionSignature<MyContext, MyEvent> = async (context, event, callback: ServerlessCallback) => {
  try {
    const twilioClient = context.getTwilioClient();
    const { SYNC_SERVICE_SID, SYNC_LIST_SID, VERIFY_SERVICE_SID } = context;
    const sync = new SyncClass(twilioClient, SYNC_SERVICE_SID, SYNC_LIST_SID);

    console.log('event:', event);
    const { phoneNumber: notNormalizedMobile } = event;
    const phoneNumber = formatNumberToE164(notNormalizedMobile);

    // Check if agent exists
    const user = await sync.getUser(`user-${phoneNumber}`);

    // Send the Code
    const verification = await twilioClient.verify
      .services(VERIFY_SERVICE_SID)
      .verifications.create({ to: phoneNumber, channel: 'sms', locale: 'en' });

    // Log
    await sync.addLog('login', `"${user.name}" has received the SMS code and is trying to login...`);

    return callback(null, { ok: 1 });
  } catch (e) {
    ohNoCatch(e, callback);
  }
};
