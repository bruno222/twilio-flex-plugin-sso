// import { SideLink, Actions, View } from '@twilio/flex-ui';
import { DataGrid, DataGridHead, DataGridRow, DataGridHeader, DataGridBody, DataGridCell, DataGridFoot } from '@twilio-paste/core/data-grid';
import { Box } from '@twilio-paste/core/box';
import { Theme } from '@twilio-paste/core/theme';
import React, { StrictMode, useEffect } from 'react';
import { Grid } from './Grid';
import { Button, Input, Label, Spinner, Stack } from '@twilio-paste/core';
import { Text } from '@twilio-paste/text';
import { ModalDialogPrimitiveOverlay, ModalDialogPrimitiveContent } from '@twilio-paste/modal-dialog-primitive';
import { styled } from '@twilio-paste/styling-library';
import { Select, Option } from '@twilio-paste/core/select';
import { NewWorker } from './NewWorker';
import { LoadingIcon } from '@twilio-paste/icons/esm/LoadingIcon';
import { apiDeleteWorker, apiListWorkers, Worker } from '../helpers/apis';

export default () => {
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
        <Box margin="space80">
          <Button variant="secondary" onClick={handleOpen}>
            Add new Agent 🥰
          </Button>
        </Box>
        <Box display="flex" width="100%" position="absolute" alignItems="center" justifyContent="center">
          <div style={{ width: '98%' }}>
            <Grid data={data} handleDeleteWorker={handleDeleteWorker} />
          </div>
        </Box>
        <NewWorker isOpen={isOpen} handleClose={handleClose} refreshTable={handleRefreshTable} />
      </Theme.Provider>
    </StrictMode>
  );
};
