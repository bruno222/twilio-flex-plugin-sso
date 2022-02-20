import { IdentityProvider, SamlLib, ServiceProvider, setSchemaValidator } from 'samlify';
import memoizerific from 'memoizerific';
const assets = Runtime.getAssets();
import { validator } from 'twilio-flex-token-validator';
import { ServerlessCallback } from '@twilio-labs/serverless-runtime-types/types';
import { Twilio as TwilioInterface } from 'twilio';

interface User {
  name: string;
  role: string;
  canAddAgents: boolean;
}

export const MIN = 1000 * 60;

export const startCachedStuff = memoizerific(1)((twilioClient: TwilioInterface, SYNC_SERVICE_SID: string, DOMAIN_NAME: string) => {
  //
  // Validations
  //
  if (!SYNC_SERVICE_SID) {
    throw new Error('SYNC_SERVICE_SID is null. Go to the ENVIRONMENTS and add a new entry there for the SYNC_SERVICE_SID.');
  }

  if (!twilioClient) {
    throw new Error('twilioClient is null. How come?!');
  }

  const sync = new SyncClass(twilioClient, SYNC_SERVICE_SID);

  //
  // Assets
  //
  const privateKey = myRequire('privatekey.cer');
  const publicKey = myRequire('publickey.cer');
  const loginResponseTemplate = myRequire('template-saml-response.xml');

  const metadataTemplate = myRequire('idpmeta.xml').trim();
  const metadata = SamlLib.replaceTagsByValue(metadataTemplate, { DOMAIN_NAME, publicKey });

  //
  // Load IdP
  //
  setSchemaValidator({
    validate: (response) => {
      /* implment your own or always returns a resolved promise to skip */
      // console.log('TODO validate: ', response);
      return Promise.resolve('skipped');
    },
  });

  const idp = IdentityProvider({
    loginResponseTemplate: { context: loginResponseTemplate.trim() },
    // encryptCert: publicKey,
    privateKey: privateKey,
    metadata,
    // privateKeyPass: 'optional if your private key file is not protected',
  });

  const sp = ServiceProvider({ isAssertionEncrypted: false });

  return { idp, sp, sync };
});

export const TaskRouterClass = <any>memoizerific(1)(async (twilioClient: TwilioInterface) => {
  const workspaces = await twilioClient.taskrouter.workspaces.list();
  if (workspaces.length !== 1) {
    throw new Error('Hum.. This is not a Flex account, is it? Why do you have more than one TaskRouter Workspace? You cant!');
  }
  const workspaceSid = workspaces[0].sid;
  return twilioClient.taskrouter.workspaces(workspaceSid);
});

export const myRequire = (file: string) => {
  try {
    return assets[`/${file}`].open().trim();
  } catch (e) {
    throw new Error(`File not found: /assets/${file}. Are you sure you added it?`);
  }
};

export class SyncClass {
  constructor(private twilioClient: any, private serviceSid: string) {}

  async fetchDocument(uniqueName: string) {
    try {
      return this.twilioClient.sync.services(this.serviceSid).documents(uniqueName).fetch();
    } catch (e) {
      throw new Error(
        `(SyncClass -> fetchDocument) Error while trying to fetch data from Twilio Sync. (uniqueName=${uniqueName}). Exception: ${e.message}`
      );
    }
  }

  async createDocument(uniqueName: string, data: any, ttl = undefined) {
    try {
      return this.twilioClient.sync.services(this.serviceSid).documents.create({
        data,
        ttl,
        uniqueName,
      });
    } catch (e) {
      throw new Error(
        `(SyncClass -> createDocument) Error while trying to save data into Twilio Sync. The uniqueName=${uniqueName} havent gone throught. Whyyy?! Exception: ${e.message}`
      );
    }
  }

  async deleteDocument(uniqueName: string) {
    try {
      return this.twilioClient.sync.services(this.serviceSid).documents(uniqueName).remove();
    } catch (e) {
      throw new Error(`(SyncClass -> deleteDocument) Exception: ${e.message}`);
    }
  }

  async updateDocument(uniqueName: string, data: any) {
    return this.twilioClient.sync.services(this.serviceSid).documents(uniqueName).update({
      data,
    });
  }

  async listDocuments() {
    const list = await this.twilioClient.sync.services(this.serviceSid).documents.list({ pageSize: 100 });
    return list.map((item: any) => {
      const { uniqueName, data } = item;
      return { uniqueName, data };
    });
  }

  // user format: `user-${phoneNumber}`
  async getUser(user: string): Promise<User> {
    try {
      const {
        data: { name, role, canAddAgents },
      } = await this.fetchDocument(user);
      if (!name || !role) {
        throw new Error('Bug: Name of the agent or its role wasnt found.');
      }
      return { name, role, canAddAgents };
    } catch (e) {
      if (e.status === 404) {
        throw new Error('Agent not found using this phone number.');
      }
      throw e;
    }
  }
}

type MyEvent = {
  token: string;
};

type MyContext = {
  ACCOUNT_SID: string;
  AUTH_TOKEN: string;
};

export const isSupervisor = async (event: MyEvent, context: MyContext, sync: SyncClass) => {
  const { roles, valid, realm_user_id: user } = <any>await validator(event.token, context.ACCOUNT_SID, context.AUTH_TOKEN);

  if (!valid) {
    throw new Error('Token not valid.');
  }

  // check if token is not from an normal agent.
  if (!roles.includes('admin') && !roles.includes('supervisor')) {
    throw new Error('You are not an Admin nor Supervisor.');
  }

  // check if supervisor has access to add/del agents
  if (roles.includes('supervisor')) {
    if (!user || !user.startsWith('user-')) {
      throw new Error('Strange, this supervisor does not have a valid realm_user_id.');
    }

    const { canAddAgents } = await sync.getUser(user);
    if (!canAddAgents) {
      throw new Error('This supervisor cannot manage (add/del/list) agents.');
    }
  }
};

export const ohNoCatch = (e: any, callback: ServerlessCallback) => {
  console.error('Exception: ', typeof e, e);
  const response = new Twilio.Response();
  response.setStatusCode(403);
  response.appendHeader('Access-Control-Allow-Origin', '*');
  response.appendHeader('Access-Control-Allow-Methods', 'OPTIONS POST GET');
  response.appendHeader('Access-Control-Allow-Headers', 'Content-Type');
  response.appendHeader('Content-Type', 'application/json');
  response.setBody({ error: typeof e === 'string' ? e : e.message });
  callback(null, response);
};

export const ResponseOK = (obj: any, callback: ServerlessCallback) => {
  console.error('Response: ', typeof obj, obj);
  const response = new Twilio.Response();
  response.setStatusCode(200);
  response.appendHeader('Access-Control-Allow-Origin', '*');
  response.appendHeader('Access-Control-Allow-Methods', 'OPTIONS POST GET');
  response.appendHeader('Access-Control-Allow-Headers', 'Content-Type');
  response.appendHeader('Content-Type', 'application/json');
  response.setBody(typeof obj === 'string' ? { obj } : obj);
  callback(null, response);
};

export const formatNumberToE164 = (_phoneNumber: string) => {
  const re = /^(0{2}|\+)(.+)/;
  const subst = `+$2`;

  let phoneNumber = _phoneNumber.replace(/[^0-9+]/gi, '');
  if (re.test(phoneNumber)) {
    phoneNumber = phoneNumber.replace(re, subst);
  }

  const regEx = /^\+[1-9]\d{10,14}$/;
  if (!regEx.test(phoneNumber)) {
    throw new Error('This phone number does not seem to be formatted into the international E164 format.');
  }

  return phoneNumber;
};
