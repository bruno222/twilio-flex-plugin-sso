import * as React from 'react';
import { Box } from '@twilio-paste/core/box';
import { Menu, useMenuState, MenuButton, MenuItem } from '@twilio-paste/core/menu';
import { MoreIcon } from '@twilio-paste/icons/esm/MoreIcon';
import { DataGrid, DataGridHead, DataGridRow, DataGridHeader, DataGridBody, DataGridCell } from '@twilio-paste/core/data-grid';
import { AuditLog } from '../helpers/apis';
import { hasManyCompanies } from '../helpers/config';
import { getCompanyName } from '../helpers/helpers';

interface GridProps {
  data: AuditLog[];
}

export const GridAuditlogs: React.FC<GridProps> = ({ data }) => {
  /* eslint-disable react/no-array-index-key */
  return (
    <DataGrid aria-label="User list" data-testid="data-grid">
      <DataGridHead>
        <DataGridRow>
          <DataGridHeader data-testid="header-1">When</DataGridHeader>
          {hasManyCompanies ? <DataGridHeader>From Company</DataGridHeader> : null}
          <DataGridHeader>Section</DataGridHeader>
          <DataGridHeader>Event log</DataGridHeader>
        </DataGridRow>
      </DataGridHead>
      <DataGridBody>
        {data.map((row, rowIndex) => (
          <DataGridRow key={`row-${rowIndex}`}>
            <DataGridCell key={`col1-${row.index}`}>{row.timeAgo}</DataGridCell>
            {hasManyCompanies ? <DataGridCell key={`col22-${row.index}`}>{getCompanyName(row.department)}</DataGridCell> : null}
            <DataGridCell key={`col2-${row.index}`}>{row.section}</DataGridCell>
            <DataGridCell key={`col3-${row.index}`}>{row.msg}</DataGridCell>
          </DataGridRow>
        ))}
      </DataGridBody>
    </DataGrid>
  );
  /* eslint-enable react/no-array-index-key */
};
