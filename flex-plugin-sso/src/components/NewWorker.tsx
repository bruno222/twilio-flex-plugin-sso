import React from 'react';
import { Button, HelpText, Input, Label, Stack } from '@twilio-paste/core';
import { Box } from '@twilio-paste/core/box';
import { ModalDialogPrimitiveOverlay, ModalDialogPrimitiveContent } from '@twilio-paste/modal-dialog-primitive';
import { styled } from '@twilio-paste/styling-library';
import { Select, Option } from '@twilio-paste/core/select';
import { apiSaveWorker } from '../helpers/apis';

interface BasicModalDialogProps {
  isOpen: boolean;
  handleClose: () => void;
  refreshTable: () => void;
}

const StyledModalDialogOverlay = styled(ModalDialogPrimitiveOverlay)({
  position: 'fixed',
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  background: 'rgba(0, 0, 0, 0.7)',
});
const StyledModalDialogContent = styled(ModalDialogPrimitiveContent)({
  width: '100%',
  maxWidth: '560px',
  maxHeight: 'calc(100% - 60px)',
  background: '#f4f5f6',
  borderRadius: '5px',
  padding: '20px',
});

export const NewWorker: React.FC<BasicModalDialogProps> = ({ isOpen, handleClose, refreshTable }) => {
  const inputRef = React.useRef() as any;
  const [isLoading, setIsLoading] = React.useState(false);
  const [name, setName] = React.useState('');
  const [phoneNumber, setPhoneNumber] = React.useState('');
  const [role, setRole] = React.useState('agent');

  const onClick = async () => {
    setIsLoading(true);
    await apiSaveWorker(name, phoneNumber, role);
    setIsLoading(false);
    refreshTable();
    handleClose();
  };

  return (
    <StyledModalDialogOverlay isOpen={isOpen} onDismiss={handleClose} allowPinchZoom={true} initialFocusRef={inputRef}>
      <StyledModalDialogContent>
        <Box margin="space40">
          <Box>
            <Label htmlFor="name">Agent Name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="John"
              onChange={(e) => {
                setName(e.target.value);
              }}
            />
          </Box>
          <Box marginTop="space80">
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input
              id="phoneNumber"
              name="phoneNumber"
              type="text"
              placeholder="+49123123123"
              onChange={(e) => {
                setPhoneNumber(e.target.value);
              }}
            />
          </Box>
          <Box marginTop="space80">
            <Label htmlFor="author">Role access</Label>
            <Select
              id="role"
              onChange={(e) => {
                setRole(e.target.value);
              }}
            >
              <Option value="agent">agent</Option>
              <Option value="supervisor,wfo.full_access">supervisor, wfo.full_access</Option>
              <Option value="supervisor,wfo.team_leader">supervisor, wfo.team_leader</Option>
              <Option value="supervisor,wfo.data_analyst">supervisor, wfo.data_analyst</Option>
              <Option value="supervisor,wfo.data_auditor">supervisor, wfo.data_auditor</Option>
              <Option value="supervisor,wfo.quality_manager">supervisor, wfo.quality_manager</Option>
              <Option value="supervisor,wfo.quality_process_manager">supervisor, wfo.quality_process_manager</Option>
              <Option value="supervisor,wfo.dashboard_viewer">supervisor, wfo.dashboard_viewer</Option>
            </Select>

            <HelpText variant="default">
              <a
                href="https://www.twilio.com/docs/flex/admin-guide/setup/sso-configuration/insights-user-roles#understanding-flex-insights-roles"
                target="_blank"
              >
                Click here
              </a>{' '}
              to understand these Roles.
            </HelpText>
          </Box>
          <Box textAlign="right" marginTop="space80">
            <Button variant="primary" loading={isLoading} onClick={onClick}>
              Save
            </Button>
          </Box>
        </Box>
      </StyledModalDialogContent>
    </StyledModalDialogOverlay>
  );
};
