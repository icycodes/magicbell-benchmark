"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// Dynamically import the MagicBell component to prevent SSR issues
const MagicBellInboxClient = dynamic(
  () => import("./MagicBellInboxClient"),
  { ssr: false }
);

interface Config {
  token: string;
  email: string;
  apiKey: string;
}

export default function MagicBellInbox() {
  const [config, setConfig] = useState<Config | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/config")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setConfig(data);
        }
      })
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return <div style={{ color: "red", fontSize: "0.75rem" }}>Error: {error}</div>;
  }

  if (!config) {
    return <div style={{ width: 40, height: 40 }} />;
  }

  return <MagicBellInboxClient token={config.token} email={config.email} />;
}
