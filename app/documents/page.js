"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function Documents() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [owner, setOwner] = useState("");
  const [version, setVersion] = useState("");
  const [reviewDate, setReviewDate] = useState("");
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    fetch(process.env.NEXT_PUBLIC_API_URL + "/documents")
      .then((res) => res.json())
      .then((data) => {
        setDocs(data.documents);
        setLoading(false);
      });
  }, []);

  async function toggleApproval(filename, currentlyApproved) {
    const action = currentlyApproved ? "unapprove" : "approve";
    await fetch(process.env.NEXT_PUBLIC_API_URL + "/documents/" + filename + "/" + action, {
      method: "POST",
    });
    const res = await fetch(process.env.NEXT_PUBLIC_API_URL + "/documents");
    const data = await res.json();
    setDocs(data.documents);
  }

  async function handleUpload() {
    setUploadError("");

    const form = new FormData();
    form.append("file", file);
    form.append("owner", owner);
    form.append("version", version);
    form.append("review_date", reviewDate);

    const res = await fetch(process.env.NEXT_PUBLIC_API_URL + "/upload", {
      method: "POST",
      body: form,
    });

    if (!res.ok) {
      const err = await res.json();
      setUploadError(err.detail);
      return;
    }

    const listRes = await fetch(process.env.NEXT_PUBLIC_API_URL + "/documents");
    const data = await listRes.json();
    setDocs(data.documents);

    setFile(null);
    setOwner("");
    setVersion("");
    setReviewDate("");
  }

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
              <th>Action</th>
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
                <td>
                  <button
                    className="text-xs underline"
                    onClick={() => toggleApproval(d.filename, d.approved)}
                  >
                    {d.approved ? "Revoke" : "Approve"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="mt-10 border-t pt-6">
        <h2 className="font-bold">Upload a document</h2>
        <p className="mt-1 text-sm text-gray-600">
          Uploaded documents are unapproved until reviewed.
        </p>

        <div className="mt-4 flex flex-col gap-3 max-w-md">
          <label className="border-2 border-dashed rounded p-6 text-center text-sm text-gray-600 cursor-pointer hover:border-gray-500 hover:bg-gray-50">
            {file ? (
              <span className="font-medium text-black">{file.name}</span>
            ) : (
              <span>Click to choose a file &middot; .txt or .pdf</span>
            )}
            <input
              type="file"
              accept=".txt,.pdf"
              className="hidden"
              onChange={(e) => setFile(e.target.files[0])}
            />
          </label>

          <input
            className="border rounded px-3 py-2 text-sm"
            placeholder="Owner"
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
          />
          <input
            className="border rounded px-3 py-2 text-sm"
            placeholder="Version"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
          />
          <input
            className="border rounded px-3 py-2 text-sm"
            placeholder="Review date (YYYY-MM-DD)"
            value={reviewDate}
            onChange={(e) => setReviewDate(e.target.value)}
          />

          <button
            className="bg-black text-white px-4 py-2 rounded text-sm disabled:bg-gray-400"
            onClick={handleUpload}
            disabled={!file || !owner || !version || !reviewDate}
          >
            Upload
          </button>

          {uploadError && <p className="text-sm text-red-700">{uploadError}</p>}
        </div>
      </div>
    </main>
  );
}