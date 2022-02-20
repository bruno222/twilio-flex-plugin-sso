import { SideLink, Actions } from '@twilio/flex-ui';

interface Props {
  activeView?: string;
  key: string;
}

export default ({ activeView }: Props) => {
  function navigate() {
    Actions.invokeAction('NavigateToView', { viewName: 'access-overview' });
  }

  return (
    <SideLink showLabel={true} icon="DefaultAvatar" iconActive="DefaultAvatarBold" isActive={activeView === 'access-overview'} onClick={navigate}>
      Manage Agents
    </SideLink>
  );
};
