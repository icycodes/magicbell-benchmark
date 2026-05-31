FROM ubuntu:24.04

RUN apt-get update -y && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        curl wget ca-certificates git python3 python3-pip python3-pytest bash ripgrep && \
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    pip3 install --break-system-packages pytest-json-ctrf && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN mkdir -p /home/user && chmod 0755 /home/user

# Create project directory
RUN mkdir -p /home/user/myproject/src

# Set up package.json
RUN cd /home/user/myproject && \
    cat >package.json <<'EOF'
{
  "name": "magicbell-react-tabs-exercise",
  "version": "1.0.0",
  "scripts": {
    "test": "jest --no-cache"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@babel/core": "^7.22.0",
    "@babel/preset-env": "^7.22.0",
    "@babel/preset-react": "^7.22.0",
    "@magicbell/magicbell-react": "^10.9.8",
    "@testing-library/react": "^14.0.0",
    "babel-jest": "^29.5.0",
    "jest": "^29.5.0",
    "jest-environment-jsdom": "^29.5.0"
  }
}
EOF

# Set up babel.config.js
RUN cd /home/user/myproject && \
    cat >babel.config.js <<'EOF'
module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    ['@babel/preset-react', { runtime: 'automatic' }]
  ],
};
EOF

# Set up jest.config.js
RUN cd /home/user/myproject && \
    cat >jest.config.js <<'EOF'
module.exports = {
  testEnvironment: 'jsdom',
};
EOF

# Set up verify.test.js
RUN cd /home/user/myproject && \
    cat >verify.test.js <<'EOF'
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
EOF

# Install dependencies
RUN cd /home/user/myproject && npm install

LABEL Author="generate-harbor-tasks"
LABEL Description="React custom notification inbox tabs with MagicBell"

CMD ["/bin/bash", "-c", "trap : TERM INT; sleep infinity & wait"]

# Container contents:
#   - always required apt packages: curl wget ca-certificates git python3 python3-pip python3-pytest bash ripgrep
#   - always required pip3 packages: pytest-json-ctrf
#   - Node.js v24 installed
#   - /home/user/myproject: configured React project with @magicbell/magicbell-react and Jest tests
