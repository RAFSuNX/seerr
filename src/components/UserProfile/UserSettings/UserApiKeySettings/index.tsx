import Button from '@app/components/Common/Button';
import LoadingSpinner from '@app/components/Common/LoadingSpinner';
import PageTitle from '@app/components/Common/PageTitle';
import SensitiveInput from '@app/components/Common/SensitiveInput';
import { Permission, useUser } from '@app/hooks/useUser';
import globalMessages from '@app/i18n/globalMessages';
import ErrorPage from '@app/pages/_error';
import defineMessages from '@app/utils/defineMessages';
import { ArrowPathIcon, TrashIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import { useRouter } from 'next/router';
import { useIntl } from 'react-intl';
import { useToasts } from 'react-toast-notifications';
import useSWR from 'swr';

const messages = defineMessages(
  'components.UserProfile.UserSettings.UserApiKeySettings',
  {
    heading: 'API Key',
    description:
      'Your personal API key acts on your behalf with your permissions. Treat it like a password.',
    noApiKey: 'No API key generated yet.',
    generate: 'Generate API Key',
    regenerate: 'Regenerate',
    revoke: 'Revoke',
    toastGenerateSuccess: 'API key generated successfully!',
    toastGenerateFailure: 'Failed to generate API key.',
    toastRevokeSuccess: 'API key revoked.',
    toastRevokeFailure: 'Failed to revoke API key.',
    nopermissionDescription:
      "You do not have permission to manage this user's API key.",
  }
);

const UserApiKeySettings = () => {
  const intl = useIntl();
  const router = useRouter();
  const { addToast } = useToasts();
  const { user: currentUser, hasPermission } = useUser();
  const { user, error } = useUser({ id: Number(router.query.userId) });

  const { data, mutate } = useSWR<{ apiKey: string | null }>(
    user ? `/api/v1/user/${user.id}/apikey` : null
  );

  if (!user && !error) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <ErrorPage statusCode={500} />;
  }

  if (
    currentUser?.id !== user.id &&
    !hasPermission(Permission.MANAGE_USERS)
  ) {
    return (
      <>
        <div className="mb-6">
          <h3 className="heading">
            {intl.formatMessage(messages.heading)}
          </h3>
        </div>
        <div className="section">
          <p>{intl.formatMessage(messages.nopermissionDescription)}</p>
        </div>
      </>
    );
  }

  const handleGenerate = async () => {
    try {
      await axios.post(`/api/v1/user/${user.id}/apikey`);
      await mutate();
      addToast(intl.formatMessage(messages.toastGenerateSuccess), {
        autoDismiss: true,
        appearance: 'success',
      });
    } catch {
      addToast(intl.formatMessage(messages.toastGenerateFailure), {
        autoDismiss: true,
        appearance: 'error',
      });
    }
  };

  const handleRevoke = async () => {
    try {
      await axios.delete(`/api/v1/user/${user.id}/apikey`);
      await mutate();
      addToast(intl.formatMessage(messages.toastRevokeSuccess), {
        autoDismiss: true,
        appearance: 'success',
      });
    } catch {
      addToast(intl.formatMessage(messages.toastRevokeFailure), {
        autoDismiss: true,
        appearance: 'error',
      });
    }
  };

  return (
    <>
      <PageTitle
        title={[
          intl.formatMessage(messages.heading),
          intl.formatMessage(globalMessages.usersettings),
          user.displayName,
        ]}
      />
      <div className="mb-6">
        <h3 className="heading">{intl.formatMessage(messages.heading)}</h3>
        <p className="description">
          {intl.formatMessage(messages.description)}
        </p>
      </div>
      <div className="section">
        {!data ? (
          <LoadingSpinner />
        ) : data.apiKey ? (
          <div className="flex flex-col gap-4">
            <SensitiveInput
              as="input"
              type="text"
              readOnly
              value={data.apiKey}
              className="w-full"
            />
            <div className="flex gap-2">
              <Button buttonType="warning" onClick={handleGenerate}>
                <ArrowPathIcon className="mr-1 h-4 w-4" />
                {intl.formatMessage(messages.regenerate)}
              </Button>
              <Button buttonType="danger" onClick={handleRevoke}>
                <TrashIcon className="mr-1 h-4 w-4" />
                {intl.formatMessage(messages.revoke)}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-gray-400">
              {intl.formatMessage(messages.noApiKey)}
            </p>
            <Button buttonType="primary" onClick={handleGenerate}>
              {intl.formatMessage(messages.generate)}
            </Button>
          </div>
        )}
      </div>
    </>
  );
};

export default UserApiKeySettings;
