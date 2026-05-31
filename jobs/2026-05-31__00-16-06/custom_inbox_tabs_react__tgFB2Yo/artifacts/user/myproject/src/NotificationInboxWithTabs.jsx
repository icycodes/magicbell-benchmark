import React from 'react';
import MagicBell, { FloatingNotificationInbox } from '@magicbell/magicbell-react';

const stores = [
  { id: 'default', defaultQueryParams: { read: false } },
  { id: 'archived', defaultQueryParams: { archived: true } },
  { id: 'all', defaultQueryParams: {} },
];

const tabs = [
  { storeId: 'default', label: 'Unread' },
  { storeId: 'archived', label: 'Archived' },
  { storeId: 'all', label: 'All' },
];

function NotificationInboxWithTabs({ apiKey, userEmail, userKey }) {
  return (
    <MagicBell
      apiKey={apiKey}
      userEmail={userEmail}
      userKey={userKey}
      stores={stores}
      bellCounter="unread"
    >
      {(props) => <FloatingNotificationInbox height={450} tabs={tabs} {...props} />}
    </MagicBell>
  );
}

export default NotificationInboxWithTabs;