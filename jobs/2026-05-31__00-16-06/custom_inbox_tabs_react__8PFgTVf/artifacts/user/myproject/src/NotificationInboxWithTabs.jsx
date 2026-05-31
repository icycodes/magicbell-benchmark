import React from "react";
import { FloatingNotificationInbox, MagicBell } from "@magicbell/magicbell-react";

const NotificationInboxWithTabs = ({ apiKey, userEmail, userKey }) => {
  const stores = [
    {
      id: "default",
      defaultQueryParams: { read: false },
    },
    {
      id: "archived",
      defaultQueryParams: { archived: true },
    },
    {
      id: "all",
      defaultQueryParams: {},
    },
  ];

  const tabs = [
    { storeId: "default", label: "Unread" },
    { storeId: "archived", label: "Archived" },
    { storeId: "all", label: "All" },
  ];

  return (
    <MagicBell
      apiKey={apiKey}
      userEmail={userEmail}
      userKey={userKey}
      stores={stores}
      bellCounter="unread"
    >
      {(inboxProps) => (
        <FloatingNotificationInbox height={450} tabs={tabs} {...inboxProps} />
      )}
    </MagicBell>
  );
};

export default NotificationInboxWithTabs;
