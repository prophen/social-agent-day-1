"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type DraftStatus = "draft" | "approved";

type Draft = {
  id: string;
  topic: string;
  content: string;
  status: DraftStatus;
  createdAt: string;
  updatedAt: string;
  approvedAt: string | null;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function DraftEditorPage() {
  const params = useParams<{ id: string }>();
  const draftId = params.id;

  const [draft, setDraft] = useState<Draft | null>(null);
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [message, setMessage] = useState("");

  async function readResponse(response: Response) {
    const text = await response.text();

    if (!text) {
      throw new Error(
        `The server returned an empty response (${response.status}).`,
      );
    }

    try {
      return JSON.parse(text);
    } catch {
      throw new Error(
        `The server returned non-JSON (${response.status}): ${text.slice(0, 200)}`,
      );
    }
  }

  async function loadDraft() {
    setIsLoading(true);
    setMessage("");

    try {
      const response = await fetch(`/api/drafts/${draftId}`);
      const data = await readResponse(response);

      if (!response.ok || !data.draft) {
        throw new Error(data.error || "Could not load this draft.");
      }

      setDraft(data.draft);
      setContent(data.draft.content);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Could not load this draft.";

      setMessage(`Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadDraft();
  }, [draftId]);

  function handleContentChange(nextContent: string) {
    setContent(nextContent);

    /*
      The visual status changes immediately when text is edited.
      The server enforces the same rule when the user saves.
    */
    if (draft?.status === "approved") {
      setDraft({
        ...draft,
        status: "draft",
        approvedAt: null,
      });
    }

    setMessage("");
  }

  async function saveChanges() {
    if (!draft || !content.trim()) {
      setMessage("The draft is empty, so there is nothing to save.");
      return;
    }

    setIsSaving(true);
    setMessage("Saving changes...");

    try {
      const response = await fetch(`/api/drafts/${draft.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
        }),
      });

      const data = await readResponse(response);

      if (!response.ok || !data.draft?.content) {
        throw new Error(data.error || "Could not save this draft.");
      }

      setDraft(data.draft);
      setContent(data.draft.content);
      setMessage("Changes saved.");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Could not save this draft.";

      setMessage(`Save failed: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  }

  async function approveDraft() {
    if (!draft) {
      return;
    }

    setIsApproving(true);
    setMessage("Approving draft...");

    try {
      const response = await fetch(`/api/drafts/${draft.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "approved",
        }),
      });

      const data = await readResponse(response);

      if (!response.ok || !data.draft) {
        throw new Error(data.error || "Could not approve this draft.");
      }

      setDraft(data.draft);
      setContent(data.draft.content);
      setMessage("Draft approved.");
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Could not approve this draft.";

      setMessage(`Approval failed: ${errorMessage}`);
    } finally {
      setIsApproving(false);
    }
  }

  if (isLoading) {
    return (
      <main className="page">
        <section className="card">
          <p className="status-message">Loading draft...</p>
        </section>
      </main>
    );
  }

  if (!draft) {
    return (
      <main className="page">
        <section className="card">
          <nav className="top-nav" aria-label="Primary navigation">
            <Link href="/drafts">Back to Draft Library</Link>
          </nav>

          <p className="eyebrow">Draft Editor</p>
          <h1>Draft unavailable</h1>
          <p className="intro">
            {message || "This draft may have been deleted or does not exist."}
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="page">
      <section className="card">
        <nav className="top-nav" aria-label="Primary navigation">
          <Link href="/drafts">Back to Draft Library</Link>
        </nav>

        <p className="eyebrow">Draft Editor</p>

        <div className="draft-heading">
          <h1>Continue editing</h1>
          <span className={`status status-${draft.status}`}>
            {draft.status}
          </span>
        </div>

        <p className="intro">
          Created {formatDate(draft.createdAt)}. Last updated{" "}
          {formatDate(draft.updatedAt)}.
        </p>

        <section className="draft-topic-panel">
          <h2>Original topic</h2>
          <p>{draft.topic}</p>
        </section>

        <label htmlFor="draft-content">Post draft</label>
        <textarea
          id="draft-content"
          value={content}
          onChange={(event) => handleContentChange(event.target.value)}
          rows={16}
        />

        <div className="editor-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={saveChanges}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save changes"}
          </button>

          <button
            type="button"
            className="approve-button"
            onClick={approveDraft}
            disabled={isApproving || draft.status === "approved"}
          >
            {draft.status === "approved"
              ? "Approved"
              : isApproving
                ? "Approving..."
                : "Approve draft"}
          </button>
        </div>

        {message && (
          <p
            className={
              message.startsWith("Error") ||
              message.startsWith("Save failed") ||
              message.startsWith("Approval failed")
                ? "error-message-inline"
                : "save-message"
            }
            role={message.startsWith("Error") ? "alert" : undefined}
          >
            {message}
          </p>
        )}

        {draft.status === "approved" && (
          <section className="approval-note">
            <h2>Ready for a future publishing step</h2>
            <p>
              This exact saved text has been approved. If you change it and
              save, approval will be removed and you will need to approve the
              new version again.
            </p>
          </section>
        )}
      </section>
    </main>
  );
}
