import { WorkspaceContext } from 'twilio/lib/rest/taskrouter/v1/workspace';
import { WorkerListInstance } from 'twilio/lib/rest/taskrouter/v1/workspace/worker';

interface StartCachedStuffResponse {
  idp: IdentityProvider;
  sp: ServiceProvider;
  sync: SyncClassInterface;
  workers: WorkerListInstance;
}

export interface Helper {
  startCachedStuff: (twilioClient: Twilio, SYNC_SERVICE_SID: string, DOMAIN_NAME: string) => StartCachedStuffResponse;
  ResponseOK: any;
  formatNumberToE164: any;
  ohNoCatch: any;
  SyncClass: any;
  isSupervisor: any;
  TaskRouterClass: (twilioClient: Twilio) => Promise<WorkspaceContext>;
}
