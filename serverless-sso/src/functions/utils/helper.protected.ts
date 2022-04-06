import { IdentityProvider, SamlLib, ServiceProvider, setSchemaValidator } from 'samlify';
import memoizerific from 'memoizerific';
const assets = Runtime.getAssets();
import { validator } from 'twilio-flex-token-validator';
import { ServerlessCallback } from '@twilio-labs/serverless-runtime-types/types';
import { Twilio as TwilioInterface } from 'twilio';
import { format } from 'timeago.js';

interface User {
  name: string;
  role: string;
  canAddAgents: boolean;
  department: string;
}

export const MIN = 1000 * 60;

export const startCachedStuff = memoizerific(1)((twilioClient: TwilioInterface, SYNC_SERVICE_SID: string, DOMAIN_NAME: string) => {
  //
  // Validations
  //
  if (!twilioClient) {
    throw new Error('twilioClient is null. How come?!');
  }

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

  return { idp, sp };
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
  constructor(private twilioClient: TwilioInterface, private serviceSid: string, private syncListSid?: string) {}

  //
  // Sync Document methods
  //
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
        data: { name, department, role, canAddAgents },
      } = await this.fetchDocument(user);
      if (!name || !role) {
        throw new Error('Bug: Name of the agent or its role wasnt found.');
      }
      return { name, department, role, canAddAgents };
    } catch (e) {
      if (e.status === 404) {
        throw new Error('Agent not found using this phone number.');
      }
      throw e;
    }
  }

  //
  // Sync List Methods
  //
  // section: "admin" or "login"
  async addLog(section: string, msg: string, department: string) {
    if (!this.syncListSid) {
      throw new Error('syncListSid wasnt initialized correctly.');
    }

    const data = {
      department,
      section,
      msg,
    };

    return this.twilioClient.sync.services(this.serviceSid).syncLists(this.syncListSid).syncListItems.create({ data });
  }

  async listLogs(filterByDepartment: string) {
    if (!this.syncListSid) {
      throw new Error('syncListSid wasnt initialized correctly.');
    }

    const logs = await this.twilioClient.sync
      .services(this.serviceSid)
      .syncLists(this.syncListSid)
      .syncListItems.list({ order: 'desc', pageSize: 200, limit: 1000 });

    return logs
      .map(({ index, dateCreated, data: { msg, section, department } }) => {
        return { index, section, timeAgo: format(dateCreated), msg, department };
      })
      .filter(({ department }) => filterByDepartment === 'internal' || filterByDepartment === department);
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
  const { roles, valid, realm_user_id: user, identity } = <any>await validator(event.token, context.ACCOUNT_SID, context.AUTH_TOKEN);
  let supervisorName = identity; // when Admin role
  let supervisorDepartment = 'internal';

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

    const { canAddAgents, name, department } = await sync.getUser(user);
    supervisorName = name; //when Supervisor role
    supervisorDepartment = department;
    if (!canAddAgents) {
      throw new Error('This supervisor cannot manage (add/del/list) agents.');
    }

    if (!supervisorDepartment) {
      throw new Error('This supervisor for some buggy-reason does not have an department configured. Undefined department may be insecure.');
    }
  }

  return { supervisorName, supervisorDepartment };
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

  const regEx = /^\+[1-9]\d{9,14}$/;
  if (!regEx.test(phoneNumber)) {
    throw new Error('This phone number does not seem to be formatted into the international E164 format.');
  }

  return phoneNumber;
};
