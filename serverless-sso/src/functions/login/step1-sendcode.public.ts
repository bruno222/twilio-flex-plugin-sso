import '@twilio-labs/serverless-runtime-types';
import { ServerlessCallback, ServerlessFunctionSignature } from '@twilio-labs/serverless-runtime-types/types';

const { ohNoCatch, formatNumberToE164, SyncClass } = require(Runtime.getFunctions()['utils/helper'].path);

type MyEvent = {
  phoneNumber: string;
};

type MyContext = {
  SYNC_SERVICE_SID: string;
  VERIFY_SERVICE_SID: string;
};

export const handler: ServerlessFunctionSignature<MyContext, MyEvent> = async (context, event, callback: ServerlessCallback) => {
  try {
    const twilioClient = context.getTwilioClient();
    const { SYNC_SERVICE_SID, VERIFY_SERVICE_SID } = context;
    const sync = new SyncClass(twilioClient, SYNC_SERVICE_SID);

    console.log('event:', event);
    const { phoneNumber: notNormalizedMobile } = event;
    const phoneNumber = formatNumberToE164(notNormalizedMobile);

    // Check if agent exists
    await sync.getUser(phoneNumber);

    // Send the Code
    const verification = await twilioClient.verify
      .services(VERIFY_SERVICE_SID)
      .verifications.create({ to: phoneNumber, channel: 'sms', locale: 'en' });
    // console.log('verification', verification);

    return callback(null, { ok: 1 });
  } catch (e) {
    ohNoCatch(e, callback);
  }
};
