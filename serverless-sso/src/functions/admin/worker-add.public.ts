import '@twilio-labs/serverless-runtime-types';
import { ServerlessCallback, ServerlessFunctionSignature } from '@twilio-labs/serverless-runtime-types/types';
import * as HelperType from '../utils/helper.protected';

const { ResponseOK, formatNumberToE164, ohNoCatch, SyncClass, isSupervisor } = <typeof HelperType>(
  require(Runtime.getFunctions()['utils/helper'].path)
);

type MyEvent = {
  name: string;
  phoneNumber: string;
  gbmId: string;
  role: string;
  canAddAgents: number;
  token: string;
  department: string;
};

type MyContext = {
  SYNC_SERVICE_SID: string;
  SYNC_LIST_SID: string;
  ACCOUNT_SID: string;
  AUTH_TOKEN: string;
};

export const handler: ServerlessFunctionSignature<MyContext, MyEvent> = async (context, event, callback: ServerlessCallback) => {
  try {
    console.log('event:', event);

    const twilioClient = context.getTwilioClient();
    const { SYNC_SERVICE_SID, SYNC_LIST_SID } = context;
    const sync = new SyncClass(twilioClient, SYNC_SERVICE_SID, SYNC_LIST_SID);

    const { name, phoneNumber: notNormalizedMobile, gbmId, role, department, canAddAgents } = event;
    const phoneNumber = formatNumberToE164(notNormalizedMobile);

    const { supervisorName, supervisorDepartment } = await isSupervisor(event, context, sync);

    if (!name || !phoneNumber || !role) {
      throw new Error("Some fields came empty. Please check in the Network tab of Chrome. I need 'name', 'phoneNumber' and 'role'.");
    }

    if (gbmId && !gbmId.startsWith('gbm:')) {
      throw new Error("Strange mate, your Google Business Messages ID must start with 'gbm:'");
    }

    if (role !== 'agent' && !role.startsWith('supervisor')) {
      throw new Error("Invalid 'role'. Only 'agent' or 'supervisor, something' are valid.");
    }

    // For security reasons, avoiding an Supervisor from BPO elevating his accesses
    const newWorkerDepartment = supervisorDepartment === 'internal' ? department : supervisorDepartment;

    await sync.createDocument(`user-${phoneNumber}`, {
      name,
      phoneNumber,
      gbmId,
      role,
      department: newWorkerDepartment,
      canAddAgents: !!+canAddAgents,
    });
    await sync.addLog(
      'admin',
      `Supervisor "${supervisorName}" added "${name}" [cellphone: ${phoneNumber}] [gbmId: ${gbmId}][role: ${role}] [company: ${department}].`,
      supervisorDepartment
    );
    return ResponseOK({ ok: 1 }, callback);
  } catch (e) {
    ohNoCatch(e, callback);
  }
};
