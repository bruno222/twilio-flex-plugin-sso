import '@twilio-labs/serverless-runtime-types';
import { ServerlessCallback, ServerlessFunctionSignature } from '@twilio-labs/serverless-runtime-types/types';
import * as HelperType from '../utils/helper.protected';

const { TaskRouterClass, ResponseOK, ohNoCatch, SyncClass, isSupervisor } = <typeof HelperType>require(Runtime.getFunctions()['utils/helper'].path);

type MyEvent = {
  phoneNumber: string;
  token: string;
};

type MyContext = {
  SYNC_SERVICE_SID: string;
  ACCOUNT_SID: string;
  AUTH_TOKEN: string;
};

const deleteWorkerFromTaskrouter = async (twilioClient: any, friendlyName: string) => {
  const taskrouter = await TaskRouterClass(twilioClient);
  const workers = await taskrouter.workers.list({ friendlyName, limit: 1 });

  // when user never logged in or it was deleted manually from Twilio Console
  if (workers.length !== 1) {
    return;
  }

  const { sid } = workers[0];
  await taskrouter.workers(sid).remove();
};

export const handler: ServerlessFunctionSignature<MyContext, MyEvent> = async (context, event, callback: ServerlessCallback) => {
  try {
    console.log('event:', event);
    const twilioClient = context.getTwilioClient();
    const { SYNC_SERVICE_SID } = context;
    const sync = new SyncClass(twilioClient, SYNC_SERVICE_SID);

    const { phoneNumber } = event;

    await isSupervisor(event, context, sync);

    if (!phoneNumber) {
      throw new Error('"phoneNumber" is empty');
    }

    await deleteWorkerFromTaskrouter(twilioClient, `user-${phoneNumber}`);
    await sync.deleteDocument(`user-${phoneNumber}`);

    return ResponseOK({ ok: 1 }, callback);
  } catch (e) {
    ohNoCatch(e, callback);
  }
};
