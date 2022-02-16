import '@twilio-labs/serverless-runtime-types';
import { ServerlessCallback, ServerlessFunctionSignature } from '@twilio-labs/serverless-runtime-types/types';
// import * as uuid from 'uuid';

const { ResponseOK, ohNoCatch, SyncClass, isSupervisor } = require(Runtime.getFunctions()['utils/helper'].path);

type MyEvent = {
  phoneNumber: string;
};

type MyContext = {
  SYNC_SERVICE_SID: string;
};

export const handler: ServerlessFunctionSignature<MyContext, MyEvent> = async (context, event, callback: ServerlessCallback) => {
  try {
    console.log('event:', event);
    await isSupervisor(event, context);

    const twilioClient = context.getTwilioClient();
    const { SYNC_SERVICE_SID } = context;
    const sync = new SyncClass(twilioClient, SYNC_SERVICE_SID);

    const { phoneNumber } = event;

    if (!phoneNumber) {
      throw new Error('"phoneNumber" is empty');
    }

    await sync.deleteDocument(`user-${phoneNumber}`);

    return ResponseOK({ ok: 1 }, callback);
  } catch (e) {
    ohNoCatch(e, callback);
  }
};
