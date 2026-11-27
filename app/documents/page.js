"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import WakeNotice from "../WakeNotice";

// Two of the API's limits (upload.py). The API checks them again: they are checked here only so that a
// file the API would refuse gets an answer at once, not after a long upload. Its page and chunk limits
// need the file's text, so only the API can check those, and its message says which one was hit.
const MAX_UPLOAD_MB = 10;
const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;
const EXTENSIONS = [".pdf", ".txt"];

const DATA_NOTICE =
  "Demo system: don't upload confidential documents. The text is stored in a hosted database, " +
  "and the passages relevant to a question are sent to Google's Gemini API.";
const UPLOADED =
  "Uploaded and searchable. It's unapproved, so answers drawn from it are BRONZE until a reviewer approves it.";
const CHECK_THE_LIST = "Reload this page in a few minutes: if the document is listed, it was saved; if not, try again.";

// What's wrong with the file, in the API's own words, or "" if it can be sent.
function fileProblem(file) {
  const name = file.name.toLowerCase();
  if (!EXTENSIONS.some((extension) => name.endsWith(extension))) {
    return "only .pdf and .txt files can be uploaded";
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return "the file is larger than " + MAX_UPLOAD_MB + " MB, the upload limit";
  }
  return "";
}

// The API's error message exactly as it wrote it. A reply that isn't the API's own, such as the
// HTML page Render sends with a 502 when the backend crashes or restarts, gets a plain explanation.
async function uploadErrorMessage(res) {
  try {
    const body = await res.json();
    if (typeof body.detail === "string") {
      return body.detail;
    }
  } catch {
    // not JSON
  }
  return "The server failed while processing the upload (HTTP " + res.status + "). " + CHECK_THE_LIST;
}

export default function Documents() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [owner, setOwner] = useState("");
  const [version, setVersion] = useState("");
  const [reviewDate, setReviewDate] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    fetch(process.env.NEXT_PUBLIC_API_URL + "/documents")
      .then((res) => res.json())
      .then((data) => {
        setDocs(data.documents);
        setLoading(false);
      });
  }, []);

  async function refresh() {
    const res = await fetch(process.env.NEXT_PUBLIC_API_URL + "/documents");
    const data = await res.json();
    setDocs(data.documents);
  }

  async function toggleApproval(filename, currentlyApproved) {
    const action = currentlyApproved ? "unapprove" : "approve";
    await fetch(process.env.NEXT_PUBLIC_API_URL + "/documents/" + filename + "/" + action, {
      method: "POST",
    });
    await refresh();
  }

  async function retire(filename) {
    const confirmed = window.confirm(
      "Retire " + filename + "?\n\n" +
      "It will stop being used to answer questions after the next backend restart, " +
      "and it can't be un-retired from this page."
    );
    if (!confirmed) {
      return;
    }

    await fetch(process.env.NEXT_PUBLIC_API_URL + "/documents/" + filename + "/retire", {
      method: "POST",
    });
    await refresh();
  }

  function chooseFile(event) {
    const chosen = event.target.files[0] || null;
    event.target.value = ""; // so that choosing the same file again still counts as a choice
    setFile(chosen);
    setUploadMessage("");
    setUploadError(chosen ? fileProblem(chosen) : "");
  }

  async function handleUpload() {
    setUploadError("");
    setUploadMessage("");
    setUploading(true);

    const form = new FormData();
    form.append("file", file);
    form.append("owner", owner);
    form.append("version", version);
    form.append("review_date", reviewDate);

    try {
      const res = await fetch(process.env.NEXT_PUBLIC_API_URL + "/upload", {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        setUploadError(await uploadErrorMessage(res));
        return;
      }
    } catch {
      // No reply at all: the network failed, or the backend went away in the middle of the upload.
      setUploadError("Lost contact with the backend. " + CHECK_THE_LIST);
      return;
    } finally {
      setUploading(false);
    }

    setFile(null);
    setOwner("");
    setVersion("");
    setReviewDate("");
    setUploadMessage(UPLOADED);
    await refresh();
  }

  return (
    <main className="p-8 max-w-4xl">
      <nav className="mb-6 flex gap-4 text-sm">
        <Link href="/" className="underline">Query</Link>
        <Link href="/documents" className="underline">Documents</Link>
        <Link href="/audit" className="underline">Audit</Link>
      </nav>

      <WakeNotice />

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
              <tr key={d.filename} className={d.retired ? "border-b text-gray-400" : "border-b"}>
                <td className="py-2">{d.filename}</td>
                <td>{d.owner}</td>
                <td>{d.version}</td>
                <td>{d.review_date}</td>
                <td>
                  {d.retired && <span className="text-gray-500">RETIRED</span>}
                  {!d.retired && !d.approved && <span className="text-orange-700">UNAPPROVED</span>}
                  {!d.retired && !d.approved && d.expired && <span>{" · "}</span>}
                  {!d.retired && d.expired && <span className="text-red-700">EXPIRED</span>}
                  {!d.retired && d.approved && !d.expired && <span className="text-green-700">CURRENT</span>}
                </td>
                <td>
                  {!d.retired && (
                    <>
                      <button
                        className="text-xs underline"
                        onClick={() => toggleApproval(d.filename, d.approved)}
                      >
                        {d.approved ? "Revoke" : "Approve"}
                      </button>
                      <button
                        className="text-xs underline ml-3 text-gray-500"
                        onClick={() => retire(d.filename)}
                      >
                        Retire
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="mt-10 border-t pt-6">
        <h2 className="font-bold">Upload a document</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Uploaded documents are unapproved until reviewed.
        </p>
        <p className="mt-3 max-w-md rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {DATA_NOTICE}
        </p>

        <div className="mt-4 flex flex-col gap-3 max-w-md">
          <label className="border-2 border-dashed rounded p-6 text-center text-sm text-gray-600 cursor-pointer hover:border-gray-500 hover:bg-gray-50 dark:text-gray-300 dark:hover:border-gray-400 dark:hover:bg-gray-900">
            {file ? (
              <span className="font-medium text-black dark:text-white">{file.name}</span>
            ) : (
              <span>Click to choose a file &middot; .txt or .pdf, up to {MAX_UPLOAD_MB} MB</span>
            )}
            <input
              type="file"
              accept=".txt,.pdf"
              className="hidden"
              disabled={uploading}
              onChange={chooseFile}
            />
          </label>

          <input
            className="border rounded px-3 py-2 text-sm"
            placeholder="Owner"
            value={owner}
            disabled={uploading}
            onChange={(e) => setOwner(e.target.value)}
          />
          <input
            className="border rounded px-3 py-2 text-sm"
            placeholder="Version"
            value={version}
            disabled={uploading}
            onChange={(e) => setVersion(e.target.value)}
          />
          <input
            className="border rounded px-3 py-2 text-sm"
            placeholder="Review date (YYYY-MM-DD)"
            value={reviewDate}
            disabled={uploading}
            onChange={(e) => setReviewDate(e.target.value)}
          />

          <button
            className="bg-black text-white px-4 py-2 rounded text-sm disabled:bg-gray-400 dark:bg-white dark:text-black dark:disabled:bg-gray-700 dark:disabled:text-gray-400"
            onClick={handleUpload}
            disabled={!file || !owner || !version || !reviewDate || uploading || fileProblem(file) !== ""}
          >
            {uploading ? "Uploading…" : "Upload"}
          </button>

          {uploading && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Uploading and indexing… on this free server, a long document can take several minutes.
            </p>
          )}
          {uploadMessage && <p className="text-sm text-green-700 dark:text-green-400">{uploadMessage}</p>}
          {uploadError && <p className="text-sm text-red-700 dark:text-red-400">{uploadError}</p>}
        </div>
      </div>
    </main>
  );
}