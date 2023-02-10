import * as Flex from '@twilio/flex-ui';
import { Manager } from '@twilio/flex-ui';

export interface AuditLog {
  index: number;
  department: string;
  section: string;
  timeAgo: string;
  msg: string;
}
export interface Worker {
  name: string;
  department: string;
  phoneNumber: string;
  gbmId: string;
  role: string;
  canAddAgents: boolean;
}

interface ListWorkers {
  users: {
    uniqueName: string;
    data: Worker;
  }[];
}

interface ListAuditLogs {
  auditLogs: AuditLog[];
}

export const apiListWorkers = async () => {
  try {
    const { users } = <ListWorkers>await request('/admin/worker-list');
    return users.map(({ data }) => data);
  } catch (e: any) {
    Flex.Notifications.showNotification('ssoError', { msg: e.message });
    return [];
  }
};

export const apiListAuditLogs = async () => {
  try {
    const { auditLogs } = <ListAuditLogs>await request(`/admin/auditlogs-list`);
    return auditLogs;
  } catch (e: any) {
    Flex.Notifications.showNotification('ssoError', { msg: e.message });
    return [];
  }
};

export const apiSaveWorker = async (name: string, phoneNumber: string, gbmId: string, role: string, department: string, canAddAgents: boolean) => {
  try {
    await request('/admin/worker-add', { name, phoneNumber, gbmId, role, department, canAddAgents: +canAddAgents });
    Flex.Notifications.showNotification('ssoOK', { msg: `Agent ${name} was added.` });
  } catch (e: any) {
    Flex.Notifications.showNotification('ssoError', { msg: e.message });
  }
};

export const apiDeleteWorker = async (phoneNumber: string) => {
  try {
    await request('/admin/worker-del', { phoneNumber });
    Flex.Notifications.showNotification('ssoOK', { msg: `Agent with the phoneNumber number '${phoneNumber}' has been deleted from our system.` });
  } catch (e: any) {
    Flex.Notifications.showNotification('ssoError', { msg: e.message });
  }
};

const request = async (path: string, params = {}) => {
  const manager = Manager.getInstance();
  const token = manager.store.getState().flex.session.ssoTokenPayload.token;
  const { REACT_APP_SERVICE_BASE_URL } = process.env;

  const url = `${REACT_APP_SERVICE_BASE_URL}${path}`;

  const body = {
    ...params,
    token,
  };

  const options = {
    method: 'POST',
    body: new URLSearchParams(body),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
    },
  };

  const respRaw = await fetch(url, options);
  const resp = await respRaw.json();

  if (resp.error) {
    throw new Error(resp.error);
  }

  return resp;
};
