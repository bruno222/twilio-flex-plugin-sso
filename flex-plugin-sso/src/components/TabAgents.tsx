import { Box } from '@twilio-paste/core/box';
import { Theme } from '@twilio-paste/core/theme';
import React, { StrictMode, useEffect } from 'react';
import { GridAgents } from './GridAgents';
import { Button, Spinner } from '@twilio-paste/core';
import { NewWorker } from './NewWorker';
import { apiDeleteWorker, apiListWorkers } from '../helpers/apis';

export const TabAgents = () => {
  const [data, setData] = React.useState() as any;
  const [isLoading, setIsLoading] = React.useState(true);
  const [isOpen, setIsOpen] = React.useState(false);
  const handleOpen = (): void => setIsOpen(true);
  const handleClose = (): void => setIsOpen(false);
  const handleRefreshTable = (): Promise<void> => fetchData();
  const handleDeleteWorker = (phoneNumber: string): Promise<void> => deleteWorker(phoneNumber);

  const deleteWorker = async (phoneNumber: string) => {
    setIsLoading(true);
    await apiDeleteWorker(phoneNumber);
    setData(await apiListWorkers());
    setIsLoading(false);
  };

  const fetchData = async () => {
    setIsLoading(true);
    setData(await apiListWorkers());
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
        <Box display="flex" justifyContent="right" margin="space80">
          <Button variant="secondary" onClick={handleOpen}>
            Add new Agent 🥰
          </Button>
        </Box>
        <Box margin="space40" height="80vh" overflowY="auto">
          <GridAgents data={data} handleDeleteWorker={handleDeleteWorker} />
        </Box>
        <NewWorker isOpen={isOpen} handleClose={handleClose} refreshTable={handleRefreshTable} />
      </Theme.Provider>
    </StrictMode>
  );
};
