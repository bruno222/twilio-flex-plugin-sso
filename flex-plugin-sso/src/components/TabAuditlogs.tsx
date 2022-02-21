import { Box } from '@twilio-paste/core/box';
import { Theme } from '@twilio-paste/core/theme';
import React, { StrictMode, useEffect } from 'react';
import { GridAuditlogs } from './GridAuditlogs';
import { apiListAuditLogs } from '../helpers/apis';
import { Spinner } from '@twilio-paste/core';

export const TabAuditlogs = () => {
  const [data, setData] = React.useState() as any;
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    setData(await apiListAuditLogs());
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <Theme.Provider theme="default">
        <Box display="flex" alignItems="center" justifyContent="center" height="100%" width="100%" position="absolute">
          <Spinner size="sizeIcon110" decorative={false} title="Loading" />
        </Box>
      </Theme.Provider>
    );
  }

  return (
    <StrictMode>
      <Theme.Provider theme="default">
        <Box margin="space40" height="85vh" overflowY="auto">
          <GridAuditlogs data={data} />
        </Box>
      </Theme.Provider>
    </StrictMode>
  );
};
