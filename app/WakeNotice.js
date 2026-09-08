"use client";

import { useState, useEffect } from "react";

export default function WakeNotice() {
  const [warming, setWarming] = useState(true);

  useEffect(() => {
    fetch(process.env.NEXT_PUBLIC_API_URL + "/health")
      .then(() => setWarming(false))
      .catch(() => setWarming(false));
  }, []);

  if (!warming) return null;

  return (
    <div className="mb-4 rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
      Waking the backend. It runs on a free tier that sleeps after 15 minutes
      idle, so the first request can take up to a minute. Everything after that
      is fast.
    </div>
  );
}