import '@twilio-labs/serverless-runtime-types';
import { ServerlessCallback, ServerlessFunctionSignature } from '@twilio-labs/serverless-runtime-types/types';
import * as HelperType from '../utils/helper.protected';

const { ResponseOK, isSupervisor, SyncClass, ohNoCatch } = <typeof HelperType>require(Runtime.getFunctions()['utils/helper'].path);

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

    const twilioClient = context.getTwilioClient();
    const { SYNC_SERVICE_SID } = context;
    const sync = new SyncClass(twilioClient, SYNC_SERVICE_SID);

    await isSupervisor(event, context, sync);

    const users = await sync.listDocuments();

    return ResponseOK({ users }, callback);
  } catch (e) {
    ohNoCatch(e, callback);
  }
};
