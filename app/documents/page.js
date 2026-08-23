"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function Documents() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/documents")
      .then((res) => res.json())
      .then((data) => {
        setDocs(data.documents);
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

      <h1 className="text-2xl font-bold">Document Inventory</h1>

      {loading && <p className="mt-4 text-gray-500">Loading...</p>}

      {!loading && (
        <table className="mt-6 w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2">Document</th>
              <th>Owner</th>
              <th>Version</th>
              <th>Review date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {docs.map((d) => (
              <tr key={d.filename} className="border-b">
                <td className="py-2">{d.filename}</td>
                <td>{d.owner}</td>
                <td>{d.version}</td>
                <td>{d.review_date}</td>
                <td>
                  {!d.approved && <span className="text-orange-700">UNAPPROVED</span>}
                  {d.expired && <span className="text-red-700">EXPIRED</span>}
                  {d.approved && !d.expired && <span className="text-green-700">CURRENT</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}