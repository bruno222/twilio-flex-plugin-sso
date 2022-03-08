import React from 'react';
import * as Flex from '@twilio/flex-ui';
import { FlexPlugin } from '@twilio/flex-plugin';
import SideBarButton from './components/SideBarButton';
import Panel from './components/Panel';
import { View } from '@twilio/flex-ui';
import { isSupervisor, isWorkerInternal } from './helpers/helpers';

const PLUGIN_NAME = 'FlexSsoPlugin';

export default class FlexSsoPlugin extends FlexPlugin {
  constructor() {
    super(PLUGIN_NAME);
  }

  private adjustFlexInsights = (flex: typeof Flex, manager: Flex.Manager) => {
    if (isWorkerInternal(flex, manager)) {
      return;
    }

    // If Supervisor from other companies, remove Flex Insights for now.
    flex.SideNav.Content.remove('dashboards');
    flex.SideNav.Content.remove('analyze');
    flex.SideNav.Content.remove('questionnaires');
  };

  private applyTeamViewFilters = (flex: typeof Flex, manager: Flex.Manager) => {
    const { department_name } = manager.workerClient.attributes;

    if (isWorkerInternal(flex, manager)) {
      return;
    }
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
    if (!isSupervisor(manager)) {
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
    this.adjustFlexInsights(flex, manager);
    this.registerAlerts(flex, manager);
  }
}
