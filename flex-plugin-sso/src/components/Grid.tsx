import * as React from 'react';
import { Box } from '@twilio-paste/core/box';
import { Input } from '@twilio-paste/core/input';
import { Menu, useMenuState, MenuButton, MenuItem, MenuSeparator } from '@twilio-paste/core/menu';
import { MoreIcon } from '@twilio-paste/icons/esm/MoreIcon';
import { Select, Option } from '@twilio-paste/core/select';
import { DataGrid, DataGridHead, DataGridRow, DataGridHeader, DataGridBody, DataGridCell } from '@twilio-paste/core/data-grid';
import { Worker, apiDeleteWorker } from '../helpers/apis';

interface Menu {
  phoneNumber: string;
  handleDeleteWorker: (phoneNumber: string) => void;
}

const ActionMenu: React.FC<Menu> = ({ phoneNumber, handleDeleteWorker }) => {
  // const [isVisible, setVisible] = React.useState(false);
  const menu = useMenuState();
  const onClick = (phoneNumber: string) => async () => {
    handleDeleteWorker(phoneNumber);
  };
  console.log('menu', menu);
  return (
    <Box display="flex" justifyContent="center">
      <MenuButton {...menu} variant="reset" size="reset">
        <MoreIcon decorative={false} title="More options" />
      </MenuButton>
      <Menu {...menu} aria-label="Preferences">
        <MenuItem {...menu} onClick={onClick(phoneNumber)}>
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
};

interface GridProps {
  data: Worker[];
  handleDeleteWorker: (phoneNumber: string) => void;
}

export const Grid: React.FC<GridProps> = ({ data, handleDeleteWorker }) => {
  /* eslint-disable react/no-array-index-key */
  return (
    <DataGrid aria-label="User list" data-testid="data-grid">
      <DataGridHead>
        <DataGridRow>
          <DataGridHeader data-testid="header-1">Agent name</DataGridHeader>
          <DataGridHeader>Phone Number</DataGridHeader>
          <DataGridHeader>Role</DataGridHeader>
          <DataGridHeader textAlign="center">Actions</DataGridHeader>
        </DataGridRow>
      </DataGridHead>
      <DataGridBody>
        {data.map((row, rowIndex) => (
          <DataGridRow key={`row-${rowIndex}`}>
            <DataGridCell key={`col1-${row.phoneNumber}`}>{row.name}</DataGridCell>
            <DataGridCell key={`col2-${row.phoneNumber}`}>{row.phoneNumber}</DataGridCell>
            <DataGridCell key={`col3-${row.phoneNumber}`}>{row.role}</DataGridCell>
            <DataGridCell key={`col-5`}>
              <ActionMenu phoneNumber={row.phoneNumber} handleDeleteWorker={handleDeleteWorker} />
            </DataGridCell>
          </DataGridRow>
        ))}
      </DataGridBody>
    </DataGrid>
  );
  /* eslint-enable react/no-array-index-key */
};
