import UserSettings from '@app/components/UserProfile/UserSettings';
import UserApiKeySettings from '@app/components/UserProfile/UserSettings/UserApiKeySettings';
import type { NextPage } from 'next';

const UserApiKeyPage: NextPage = () => {
  return (
    <UserSettings>
      <UserApiKeySettings />
    </UserSettings>
  );
};

export default UserApiKeyPage;
