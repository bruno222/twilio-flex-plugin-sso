import React from 'react';
import * as Flex from '@twilio/flex-ui';
import { FlexPlugin } from '@twilio/flex-plugin';
import SideBarButton from './components/SideBarButton';
import Panel from './components/Panel';
import { View } from '@twilio/flex-ui';
import { hasManyCompanies } from './helpers/config';

const PLUGIN_NAME = 'FlexSsoPlugin';

export default class FlexSsoPlugin extends FlexPlugin {
  constructor() {
    super(PLUGIN_NAME);
  }

  private isSupervisor(manager: Flex.Manager) {
    // admin role is when you log on Flex from Twilio Console
    const { attributes } = manager.workerClient;
    if (attributes.roles.includes('admin')) {
      return true;
    }

    // check if the supervisor has "canAddAgents" flag.
    if (attributes.roles.includes('supervisor') && attributes.canAddAgents) {
      return true;
    }

    return false;
  }

  private applyTeamViewFilters = (flex: typeof Flex, manager: Flex.Manager) => {
    // if "no bpo concept", if "admin role" or "supervisor role but internal", then no filter is applied
    const { attributes } = manager.workerClient;
    const { department_name, roles } = attributes;
    if (!hasManyCompanies || roles.includes('admin') || department_name === 'internal') {
      return;
    }

    // if department name is null when role = supervisor, something is wrong
    if (!department_name) {
      throw new Error('SSO Plugin: Ops, something is wrong. This Worker has no attribute "department_name". How come?!');
    }

    // apply the filter
    flex.TeamsView.defaultProps.hiddenFilter = `data.attributes.department_name == "${department_name}"`;
  };

  private registerAlerts(flex: typeof Flex, manager: Flex.Manager) {
    (manager.strings as any).ssoError = 'SSO Plugin Error: {{msg}}';
    (manager.strings as any).ssoOK = '{{msg}}';

    flex.Notifications.registerNotification({
      id: 'ssoError',
      content: 'ssoError',
      type: flex.NotificationType.error,
    });

    flex.Notifications.registerNotification({
      id: 'ssoOK',
      content: 'ssoOK',
      type: flex.NotificationType.success,
    });
  }

  init(flex: typeof Flex, manager: Flex.Manager) {
    if (!this.isSupervisor(manager)) {
      return;
    }

    flex.SideNav.Content.add(<SideBarButton key="access-overview-button" />, {
      // if: () => this.isSupervisor(manager),
    });

    flex.ViewCollection.Content.add(
      <View name="access-overview" key="access-overview">
        <Panel key="SsoPage" />
      </View>
    );

    this.applyTeamViewFilters(flex, manager);
    this.registerAlerts(flex, manager);
  }
}
