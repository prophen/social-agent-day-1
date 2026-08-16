"use client";

import { useState } from "react";

type PostStatus = "draft" | "approved";

export default function App() {
  const [topic, setTopic] = useState("");
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState<PostStatus>("draft");
  const [isGenerating, setIsGenerating] = useState(false);

  async function generateDraft() {
    const cleanTopic = topic.trim();

    if (!cleanTopic) {
      setDraft("Please enter a topic first.");
      return;
    }

    setIsGenerating(true);
    setDraft("Generating your draft...");
    setStatus("draft");

    try {
      const response = await fetch("/api/generate-draft", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: cleanTopic,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not generate a draft.");
      }

      setDraft(data.draft);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "An unexpected error occurred.";

      setDraft(`Error: ${message}`);
    } finally {
      setIsGenerating(false);
    }
  }

  function approveDraft() {
    if (draft && !draft.startsWith("Please enter")) {
      setStatus("approved");
    }
  }

  return (
    <main className="page">
      <section className="card">
        <p className="eyebrow">Social Content Agent</p>
        <h1>Create a LinkedIn draft</h1>
        <p className="intro">
          Enter a topic, generate a local practice draft, edit it, and approve
          it. Nothing is posted anywhere.
        </p>

        <label htmlFor="topic">What do you want to post about?</label>
        <textarea
          id="topic"
          value={topic}
          onChange={(event) => setTopic(event.target.value)}
          placeholder="Example: I learned how AI agents use tools."
          rows={4}
        />

        <button type="button" onClick={generateDraft} disabled={isGenerating}>
          {isGenerating ? "Generating..." : "Generate draft"}
        </button>

        {draft && (
          <section className="draft-section">
            <div className="draft-heading">
              <h2>Draft preview</h2>
              <span className={`status status-${status}`}>{status}</span>
            </div>

            <textarea
              value={draft}
              onChange={(event) => {
                setDraft(event.target.value);
                setStatus("draft");
              }}
              rows={12}
            />

            <button
              type="button"
              className="approve-button"
              onClick={approveDraft}
              disabled={status === "approved"}
            >
              {status === "approved" ? "Approved" : "Approve draft"}
            </button>

            {status === "approved" && (
              <p className="success-message">
                Approved locally. A future version can send this approved draft
                to a scheduling or publishing backend.
              </p>
            )}
          </section>
        )}
      </section>
    </main>
  );
}
