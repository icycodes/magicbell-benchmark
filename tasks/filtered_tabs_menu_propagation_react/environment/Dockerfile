FROM ubuntu:24.04

# Install all required apt packages and browser verification dependencies
RUN apt-get update -y && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        curl wget ca-certificates git python3 python3-pip python3-pytest bash ripgrep \
        ffmpeg libxcb-shm0 libx11-xcb1 libx11-6 libxcb1 libxext6 libxrandr2 libxcomposite1 libxcursor1 libxdamage1 libxfixes3 libxi6 libgtk-3-0t64 libpangocairo-1.0-0 libpango-1.0-0 libatk1.0-0t64 libcairo-gobject2 libcairo2 libgdk-pixbuf-2.0-0 libxrender1 libasound2t64 libfreetype6 libfontconfig1 libdbus-1-3 libnss3 libnspr4 libatk-bridge2.0-0t64 libdrm2 libxkbcommon0 libatspi2.0-0t64 libcups2t64 libxshmfence1 libgbm1 && \
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    npm i -g agent-browser && \
    agent-browser install && \
    pip3 install --break-system-packages pytest-json-ctrf pochi-verifier requests pyjwt pytest-xprocess && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Set up user directory
RUN mkdir -p /home/user && chmod 0755 /home/user

# Initialize custom React project
RUN mkdir -p /home/user/myproject/src
WORKDIR /home/user/myproject

# Create package.json
RUN cat >package.json <<'EOF'
{
  "name": "magicbell-filtered-tabs",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite --host 0.0.0.0 --port 3000",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@magicbell/react": "^10.0.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "vite": "^5.3.1"
  }
}
EOF

# Create vite.config.js
RUN cat >vite.config.js <<'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
  }
})
EOF

# Create index.html
RUN cat >index.html <<'EOF'
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>MagicBell Filtered Tabs</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
EOF

# Create src/main.jsx
RUN cat >src/main.jsx <<'EOF'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
EOF

# Create src/index.css
RUN cat >src/index.css <<'EOF'
body {
  margin: 0;
  font-family: sans-serif;
  background-color: #f3f4f6;
  color: #1f2937;
}
EOF

# Create src/App.jsx (Broken implementation missing event.stopPropagation())
RUN cat >src/App.jsx <<'EOF'
import React, { useState } from 'react';
import Provider from '@magicbell/react/context-provider';
import { useNotifications, useNotification } from '@magicbell/react';

function NotificationItem({ notification }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const myNotification = useNotification(notification);

  const handleNotificationClick = () => {
    myNotification.markAsRead();
  };

  const handleMenuClick = (e) => {
    // TODO: Fix the event bubble-up issue by calling e.stopPropagation()
    setMenuOpen(!menuOpen);
  };

  return (
    <div className="notification-item" onClick={handleNotificationClick} style={{ border: '1px solid #ccc', padding: '10px', margin: '5px', cursor: 'pointer' }}>
      <div className="notification-title">{notification.title}</div>
      <button className="three-dots-menu-btn" onClick={handleMenuClick}>
        ...
      </button>
      {menuOpen && (
        <div className="menu-dropdown" style={{ background: '#f9f9f9', padding: '5px', marginTop: '5px' }}>
          <button onClick={() => myNotification.delete()}>Delete</button>
        </div>
      )}
    </div>
  );
}

function NotificationList() {
  const store = useNotifications('unread');
  if (!store) return <div>Loading...</div>;

  return (
    <div className="notification-list" style={{ padding: '20px' }}>
      <h2>Unread Notifications</h2>
      {store.notifications.length === 0 ? (
        <p className="no-notifications">No unread notifications</p>
      ) : (
        store.notifications.map((notification) => (
          <NotificationItem key={notification.id} notification={notification} />
        ))
      )}
    </div>
  );
}

export default function App() {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token') || '';

  return (
    <Provider
      token={token}
      stores={[
        { id: 'unread', defaultQueryParams: { read: false } }
      ]}
    >
      <NotificationList />
    </Provider>
  );
}
EOF

# Pre-install npm dependencies to speed up startup
RUN npm install

LABEL Author="generate-harbor-tasks"
LABEL Description="React task environment with Node.js v24 and MagicBell SDK installed to fix the event bubble-up issue."

CMD ["/bin/bash", "-c", "trap : TERM INT; sleep infinity & wait"]

# Container contents:
#   - always required apt packages: curl wget ca-certificates git python3 python3-pip python3-pytest bash ripgrep
#   - always required pip3 packages: pytest-json-ctrf
#   - Node.js v24 and MagicBell React SDK
#   - browser verification dependencies: pochi-verifier, agent-browser, ffmpeg, and more
#   - /home/user/myproject: custom React project pre-configured with a broken App.jsx
