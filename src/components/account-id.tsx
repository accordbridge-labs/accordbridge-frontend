"use client";

import { useState } from "react";

function RevealedAccountId({ id }: { id: string }) {
  const [feedback, setFeedback] = useState("");
  const [copying, setCopying] = useState(false);
  return (
    <div className="account-id">
      <strong>Your account ID</strong>
      <code data-testid="account-id" tabIndex={0} style={{ userSelect: "all" }}>
        {id}
      </code>
      <button
        type="button"
        className="secondary"
        disabled={copying}
        onClick={async () => {
          setCopying(true);
          setFeedback("");
          try {
            await navigator.clipboard.writeText(id);
            setFeedback("Account ID copied.");
          } catch {
            setFeedback(
              "Could not copy. Select the account ID above and copy it manually.",
            );
          } finally {
            setCopying(false);
          }
        }}
      >
        Copy account ID
      </button>
      <p role="status" aria-live="polite" aria-atomic="true">
        {feedback}
      </p>
    </div>
  );
}

export function AccountId({ id }: { id: string }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <>
      <button
        type="button"
        className="secondary"
        aria-expanded={revealed}
        onClick={() => setRevealed(!revealed)}
      >
        {revealed ? "Hide account ID" : "Show my account ID"}
      </button>
      {revealed && <RevealedAccountId id={id} />}
    </>
  );
}
