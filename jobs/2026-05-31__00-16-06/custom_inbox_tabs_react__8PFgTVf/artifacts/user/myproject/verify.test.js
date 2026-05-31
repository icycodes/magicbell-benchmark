import React from 'react';
import { render } from '@testing-library/react';

let mockMagicBellProps = null;
let mockFloatingInboxProps = null;

jest.mock('@magicbell/magicbell-react', () => {
  const MagicBellMock = (props) => {
    mockMagicBellProps = props;
    if (typeof props.children === 'function') {
      return props.children({
        isOpen: true,
        toggle: () => {},
        launcherRef: React.createRef(),
      });
    }
    return props.children;
  };

  const FloatingNotificationInboxMock = (props) => {
    mockFloatingInboxProps = props;
    return <div data-testid="floating-inbox" />;
  };

  return {
    __esModule: true,
    default: MagicBellMock,
    FloatingNotificationInbox: FloatingNotificationInboxMock,
  };
});

describe('NotificationInboxWithTabs Component', () => {
  it('should render MagicBell and FloatingNotificationInbox with correct tabs and stores configuration', () => {
    const NotificationInboxWithTabs = require('./src/NotificationInboxWithTabs').default;
    
    render(
      <NotificationInboxWithTabs
        apiKey="test-api-key"
        userEmail="test@example.com"
        userKey="test-user-key"
      />
    );

    expect(mockMagicBellProps).toBeDefined();
    expect(mockMagicBellProps.apiKey).toBe('test-api-key');
    expect(mockMagicBellProps.userEmail).toBe('test@example.com');
    expect(mockMagicBellProps.userKey).toBe('test-user-key');
    expect(mockMagicBellProps.bellCounter).toBe('unread');

    // Verify stores
    const stores = mockMagicBellProps.stores;
    expect(stores).toBeDefined();
    expect(Array.isArray(stores)).toBe(true);
    expect(stores.length).toBe(3);

    // Verify unread store
    const unreadStore = stores.find(s => s.id === 'default');
    expect(unreadStore).toBeDefined();
    expect(unreadStore.defaultQueryParams).toBeDefined();
    expect(unreadStore.defaultQueryParams.read).toBe(false);

    // Verify archived store
    const archivedStore = stores.find(s => s.defaultQueryParams && s.defaultQueryParams.archived === true);
    expect(archivedStore).toBeDefined();

    // Verify all store
    const allStore = stores.find(s => s.defaultQueryParams && Object.keys(s.defaultQueryParams).length === 0);
    expect(allStore).toBeDefined();

    // Verify tabs
    expect(mockFloatingInboxProps).toBeDefined();
    expect(mockFloatingInboxProps.height).toBe(450);
    const tabs = mockFloatingInboxProps.tabs;
    expect(tabs).toBeDefined();
    expect(Array.isArray(tabs)).toBe(true);
    expect(tabs.length).toBe(3);

    // Verify tab mapping
    const unreadTab = tabs.find(t => t.storeId === 'default');
    expect(unreadTab).toBeDefined();
    expect(unreadTab.label.toLowerCase()).toContain('unread');

    const archivedTab = tabs.find(t => t.storeId === archivedStore.id);
    expect(archivedTab).toBeDefined();
    expect(archivedTab.label.toLowerCase()).toContain('archive');

    const allTab = tabs.find(t => t.storeId === allStore.id);
    expect(allTab).toBeDefined();
    expect(allTab.label.toLowerCase()).toContain('all');
  });
});
