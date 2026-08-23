"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function Audit() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/audit")
      .then((res) => res.json())
      .then((data) => {
        setEntries(data.entries);
        setLoading(false);
      });
  }, []);

  return (
    <main className="p-8 max-w-4xl">
      <nav className="mb-6 flex gap-4 text-sm">
        <Link href="/" className="underline">Query</Link>
        <Link href="/documents" className="underline">Documents</Link>
        <Link href="/audit" className="underline">Audit</Link>
      </nav>

      <h1 className="text-2xl font-bold">Audit Log</h1>
      <p className="mt-1 text-gray-600 text-sm">{entries.length} queries recorded</p>

      {loading && <p className="mt-4 text-gray-500">Loading...</p>}

      <div className="mt-6">
        {entries.map((e) => (
          <div key={e.id} className="border-b py-3">
            <div className="flex gap-3 items-center">
              <span className={
                e.tier === "GOLD" ? "px-2 py-0.5 rounded text-xs font-bold bg-yellow-100 text-yellow-800" :
                e.tier === "SILVER" ? "px-2 py-0.5 rounded text-xs font-bold bg-gray-200 text-gray-800" :
                "px-2 py-0.5 rounded text-xs font-bold bg-orange-100 text-orange-800"
              }>
                {e.tier}
              </span>
              <span className="text-xs text-gray-500">{e.timestamp}</span>
              <span className="text-xs text-gray-500">distance {e.top_distance.toFixed(3)}</span>
            </div>

            <p className="mt-2">{e.question}</p>
            <p className="text-sm text-gray-600">{e.reason}</p>

            {e.warnings.length > 0 && (
              <ul className="mt-1 text-xs text-red-700">
                {e.warnings.map((w, i) => <li key={i}>⚠ {w}</li>)}
              </ul>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}