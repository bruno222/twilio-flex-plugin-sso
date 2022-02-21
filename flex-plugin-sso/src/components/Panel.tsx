import { Box } from '@twilio-paste/core/box';
import { Theme } from '@twilio-paste/core/theme';
import React from 'react';
import { Tab, TabList, TabPanel, TabPanels, Tabs, useTabState } from '@twilio-paste/core';
import { TabAgents } from './TabAgents';
import { TabAuditlogs } from './TabAuditlogs';

export default () => {
  const tab = useTabState();
  const isAuditTabSelected = tab.currentId?.endsWith('-2');
  return (
    <Theme.Provider theme="default">
      <Box margin="space50">
        <Tabs state={tab}>
          <TabList aria-label="State hook tabs">
            <Tab>Manage</Tab>
            <Tab>Audit logs</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <TabAgents />
            </TabPanel>
            <TabPanel>{isAuditTabSelected ? <TabAuditlogs /> : null}</TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </Theme.Provider>
  );
};
