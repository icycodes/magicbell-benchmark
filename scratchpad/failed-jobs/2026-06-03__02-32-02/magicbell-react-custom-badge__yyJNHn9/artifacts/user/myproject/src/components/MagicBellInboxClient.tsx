"use client";

import "@magicbell/react/styles/floating-inbox.css";
import "@magicbell/react/styles/inbox.css";
import "@magicbell/react/styles/inline-notification.css";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import Provider from "@magicbell/react/context-provider";
import FloatingInbox from "@magicbell/react/floating-inbox";
import { Client } from "magicbell-js/user-client";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Notification {
  id: string;
  title?: string | null;
  content?: string | null;
  readAt?: string | null;
  sentAt?: string | null;
  archivedAt?: string | null;
  discardedAt?: string | null;
  actionUrl?: string | null;
}

type TabId = "all" | "unread";

interface TabDef {
  label: string;
  /**
   * storeId identifies the tab.
   * Using "all" as the first/default tab ensures the badge count (driven by the
   * @magicbell/react Provider's global notification store) is not hidden.
   */
  storeId: TabId;
}

const TABS: TabDef[] = [
  { label: "All", storeId: "all" },
  { label: "Unread", storeId: "unread" },
];

// ─── UserClient Context ───────────────────────────────────────────────────────

interface UserClientContextValue {
  client: Client | null;
  token: string;
}

const UserClientContext = createContext<UserClientContextValue>({
  client: null,
  token: "",
});

function UserClientProvider({
  token,
  children,
}: {
  token: string;
  children: React.ReactNode;
}) {
  const [client] = useState(() => new Client({ token }));
  return (
    <UserClientContext.Provider value={{ client, token }}>
      {children}
    </UserClientContext.Provider>
  );
}

// ─── Notification Item ────────────────────────────────────────────────────────

function NotificationItem({
  notification,
  onMarkRead,
  onNotificationClick,
}: {
  notification: Notification;
  onMarkRead: () => void;
  onNotificationClick?: (
    event: Event,
    detail: { notification: Notification }
  ) => void;
}) {
  const isUnread = !notification.readAt;

  const date = notification.sentAt
    ? new Date(notification.sentAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  const handleClick = (e: React.MouseEvent) => {
    if (isUnread) onMarkRead();
    if (onNotificationClick) {
      onNotificationClick(e.nativeEvent, { notification });
    }
    if (notification.actionUrl) {
      window.open(notification.actionUrl, "_blank");
    }
  };

  return (
    <li
      className="magicbell--inbox-item"
      data-status={isUnread ? "unread" : "read"}
      onClick={handleClick}
    >
      <div
        className="magicbell--inbox-item--title"
        style={{ fontWeight: isUnread ? 600 : 400 }}
      >
        {notification.title || "Notification"}
      </div>
      <div className="magicbell--inbox-item--date">{date}</div>
      {notification.content ? (
        <div className="magicbell--inbox-item--content">{notification.content}</div>
      ) : null}
    </li>
  );
}

// ─── Tabbed Inbox ─────────────────────────────────────────────────────────────

interface TabbedInboxProps {
  height?: number;
  width?: number;
  floating?: boolean;
  onNotificationClick?: (
    event: Event,
    detail: { notification: Notification }
  ) => void;
}

/**
 * TabbedInbox – a custom InboxComponent with "All" and "Unread" tabs.
 *
 * Badge count note:
 * The FloatingInbox's bell button renders an InlineNotification (variant="dot")
 * that queries the @magicbell/react Provider's internal notification store for
 * any notification with readAt=null. This is completely independent of the tab
 * shown here, so the badge count always reflects the global unread count.
 *
 * The storeId="all" tab is important: it means the default view shows all
 * notifications, matching what the underlying store has fetched, so the badge
 * accurately reflects real unread count.
 */
function TabbedInbox({ height = 500, floating, onNotificationClick }: TabbedInboxProps) {
  const { client } = useContext(UserClientContext);
  const [activeTab, setActiveTab] = useState<TabId>("all");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  const fetchNotifications = async (tab: TabId) => {
    if (!client) return;
    try {
      const params: { status?: string } = {};
      if (tab === "unread") {
        // The API supports status='unread' | 'read' | 'archived'
        params.status = "unread";
      }
      const response = await client.notifications.listNotifications(params);
      if (!mountedRef.current) return;
      const items = (response.data?.data ?? []) as Notification[];
      setNotifications(items);
      setError(null);
    } catch (err) {
      if (!mountedRef.current) return;
      setError((err as Error).message);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  // Poll for notifications every 30 seconds + on tab change
  useEffect(() => {
    if (!client) return;
    mountedRef.current = true;
    setLoading(true);

    void fetchNotifications(activeTab);

    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => {
      void fetchNotifications(activeTab);
    }, 30_000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, activeTab]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const markAsRead = async (id: string) => {
    if (!client) return;
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, readAt: new Date().toISOString() } : n
      )
    );
    try {
      await client.notifications.markNotificationRead(id);
    } catch {
      // revert on failure
      void fetchNotifications(activeTab);
    }
  };

  const markAllRead = async () => {
    if (!client) return;
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() }))
    );
    try {
      await client.notifications.markAllNotificationsRead();
    } catch {
      void fetchNotifications(activeTab);
    }
  };

  const HEADER_APPROX_HEIGHT = 96; // title row + tab row
  const FOOTER_HEIGHT = 40;
  const bodyHeight = Math.max(80, height - HEADER_APPROX_HEIGHT - FOOTER_HEIGHT);

  return (
    <div
      className="magicbell--inbox"
      data-floating={floating ? "true" : null}
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div
        style={{
          borderBottom: "1px solid var(--magicbell-border-muted)",
          flexShrink: 0,
        }}
      >
        {/* Title row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0.75rem 1rem",
          }}
        >
          <div className="magicbell--inbox-header--title">Notifications</div>
          <div className="magicbell--inbox-header--actions">
            <button
              title="Mark all as read"
              className="magicbell--inbox-header--button"
              onClick={markAllRead}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 11 12 14 22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ display: "flex" }}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.storeId;
            return (
              <button
                key={tab.storeId}
                onClick={() => setActiveTab(tab.storeId)}
                style={{
                  flex: 1,
                  border: "none",
                  borderBottom: isActive
                    ? "2px solid var(--magicbell-primary-bg)"
                    : "2px solid transparent",
                  background: "none",
                  padding: "0.625rem 0",
                  fontFamily: "var(--magicbell-font-family)",
                  fontSize: "0.875rem",
                  fontWeight: isActive ? 600 : 400,
                  color: isActive
                    ? "var(--magicbell-primary-bg)"
                    : "var(--magicbell-text-muted)",
                  cursor: "pointer",
                  transition: "color 0.15s, border-color 0.15s",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Notification list ───────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          minHeight: 0,
          height: `${bodyHeight}px`,
        }}
      >
        {loading ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "var(--magicbell-text-muted)",
              fontSize: "0.875rem",
            }}
          >
            Loading…
          </div>
        ) : error ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "var(--magicbell-text-error)",
              fontSize: "0.875rem",
              padding: "1rem",
              textAlign: "center",
            }}
          >
            {error}
          </div>
        ) : notifications.length === 0 ? (
          <div
            className="magicbell--inbox--empty-state"
            style={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <p>
              No {activeTab === "unread" ? "unread " : ""}notifications yet.
            </p>
          </div>
        ) : (
          <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
            {notifications.map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                onNotificationClick={onNotificationClick}
                onMarkRead={() => markAsRead(n.id)}
              />
            ))}
          </ul>
        )}
      </div>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <div
        className="magicbell--inbox-footer"
        style={{ flexShrink: 0 }}
      >
        <div className="magicbell--inbox-footer--logo">
          <span
            style={{ fontSize: "0.7rem", color: "var(--magicbell-text-muted)" }}
          >
            Powered by MagicBell
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

interface Props {
  token: string;
  email: string;
}

export default function MagicBellInboxClient({ token }: Props) {
  return (
    /**
     * Provider sets up the @magicbell/react context which drives:
     *  1. The bell badge (InlineNotification variant="dot") – global unread count
     *  2. Real-time WebSocket updates that refresh the notification store
     *
     * UserClientProvider wraps with a magicbell-js UserClient for the TabbedInbox
     * to directly fetch/update notifications with full tab filtering control.
     */
    <UserClientProvider token={token}>
      <Provider token={token}>
        <FloatingInbox
          placement="bottom-end"
          height={500}
          width={420}
          InboxComponent={TabbedInbox}
        />
      </Provider>
    </UserClientProvider>
  );
}
