"use client";

import { useState } from "react";

export default function Home() {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function ask() {
    setLoading(true);
    const res = await fetch("http://127.0.0.1:8000/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: question }),
    });
    const data = await res.json();
    setResult(data);
    setLoading(false);
  }

  return (
    <main className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold">Source-Governed RAG</h1>
      <p className="mt-2 text-gray-600">Compliance document intelligence</p>

      <div className="mt-6 flex gap-2">
        <input
          className="flex-1 border rounded px-3 py-2"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a compliance question"
        />
        <button
          className="bg-black text-white px-4 py-2 rounded"
          onClick={ask}
        >
          Ask
        </button>
      </div>

      {loading && <p className="mt-4">Thinking...</p>}

      {result && (
  <div className="mt-6">
    <span className={
      result.tier === "GOLD" ? "px-3 py-1 rounded text-sm font-bold bg-yellow-100 text-yellow-800" :
      result.tier === "SILVER" ? "px-3 py-1 rounded text-sm font-bold bg-gray-200 text-gray-800" :
      "px-3 py-1 rounded text-sm font-bold bg-orange-100 text-orange-800"
    }>
      {result.tier}
    </span>

    {result.warnings.length > 0 && (
      <ul className="mt-3 text-sm text-red-700">
        {result.warnings.map((w, i) => <li key={i}>⚠ {w}</li>)}
      </ul>
    )}

    <p className="mt-4 whitespace-pre-wrap">{result.answer}</p>
  </div>
)}
    </main>
  );
}