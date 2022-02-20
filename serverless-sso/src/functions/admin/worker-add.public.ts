import '@twilio-labs/serverless-runtime-types';
import { ServerlessCallback, ServerlessFunctionSignature } from '@twilio-labs/serverless-runtime-types/types';
import { Helper } from '../utils/helper';

const { ResponseOK, formatNumberToE164, ohNoCatch, SyncClass, isSupervisor } = <Helper>require(Runtime.getFunctions()['utils/helper'].path);

type MyEvent = {
  name: string;
  phoneNumber: string;
  role: string;
  canAddAgents: number;
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

    const { name, phoneNumber: notNormalizedMobile, role, canAddAgents } = event;
    const phoneNumber = formatNumberToE164(notNormalizedMobile);

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
