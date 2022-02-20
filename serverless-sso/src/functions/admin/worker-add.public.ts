import '@twilio-labs/serverless-runtime-types';
import { ServerlessCallback, ServerlessFunctionSignature } from '@twilio-labs/serverless-runtime-types/types';
import * as HelperType from '../utils/helper.protected';

const { ResponseOK, formatNumberToE164, ohNoCatch, SyncClass, isSupervisor } = <typeof HelperType>(
  require(Runtime.getFunctions()['utils/helper'].path)
);

type MyEvent = {
  name: string;
  phoneNumber: string;
  role: string;
  canAddAgents: number;
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

    const { name, phoneNumber: notNormalizedMobile, role, canAddAgents } = event;
    const phoneNumber = formatNumberToE164(notNormalizedMobile);

    await isSupervisor(event, context, sync);

    if (!name || !phoneNumber || !role) {
      throw new Error("Some fields came empty. Please check in the Network tab of Chrome. I need 'name', 'phoneNumber' and 'role'.");
    }

    if (role !== 'agent' && !role.startsWith('supervisor')) {
      throw new Error("Invalid 'role'. Only 'agent' or 'supervisor, something' are valid.");
    }

    await sync.createDocument(`user-${phoneNumber}`, { name, phoneNumber, role, canAddAgents: !!+canAddAgents });

    return ResponseOK({ ok: 1 }, callback);
  } catch (e) {
    ohNoCatch(e, callback);
  }
};
