import '@twilio-labs/serverless-runtime-types';
import { ServerlessCallback, ServerlessFunctionSignature } from '@twilio-labs/serverless-runtime-types/types';
import { Helper } from '../utils/helper';

const { ResponseOK, isSupervisor, SyncClass, ohNoCatch } = <Helper>require(Runtime.getFunctions()['utils/helper'].path);

type MyEvent = {
  token: string;
};

type MyContext = {
  SYNC_SERVICE_SID: string;
  ACCOUNT_SID: string;
  AUTH_TOKEN: string;
};

export const handler: ServerlessFunctionSignature<MyContext, MyEvent> = async (context, event, callback: ServerlessCallback) => {
  try {
    console.log('event:', event);
    await isSupervisor(event, context);

    const twilioClient = context.getTwilioClient();
    const { SYNC_SERVICE_SID } = context;
    const sync = new SyncClass(twilioClient, SYNC_SERVICE_SID);

    const users = await sync.listDocuments();

    return ResponseOK({ users }, callback);
  } catch (e) {
    ohNoCatch(e, callback);
  }
};
