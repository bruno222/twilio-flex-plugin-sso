import React from 'react';
import * as Flex from '@twilio/flex-ui';
import { FlexPlugin } from 'flex-plugin';
import SideBarButton from './components/SideBarButton';
import SsoComponent from './components/Panel';
import { View } from '@twilio/flex-ui';

const PLUGIN_NAME = 'FlexSsoPlugin';

export default class FlexSsoPlugin extends FlexPlugin {
  constructor() {
    super(PLUGIN_NAME);
  }

  private isSupervisor(manager: Flex.Manager) {
    return manager.workerClient.attributes.roles.includes('admin') || manager.workerClient.attributes.roles.includes('supervisor');
  }

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
        <SsoComponent key="SsoPage" />
      </View>
    );

    this.registerAlerts(flex, manager);
  }
}
