"use client";
import { useRef, useState } from "react";
import { checkWorkspaceConnection } from "@/lib/connection";

export function ConnectionCheck({
  onRecovered,
}: {
  /** Safe GET refresh only; never repeat a mutation here. */
  onRecovered?: () => Promise<void>;
}) {
  const inProgress = useRef(false);
  const [checking, setChecking] = useState(false);
  const [progress, setProgress] = useState("");
  async function check() {
    if (inProgress.current) return;
    inProgress.current = true;
    setChecking(true);
    setProgress("Checking the workspace service…");
    try {
      await checkWorkspaceConnection((attempt, maximum) =>
        setProgress(`Connection check ${attempt} of ${maximum}…`),
      );
      if (onRecovered) await onRecovered();
      setProgress("Connected. Your work was not resubmitted.");
    } catch {
      setProgress(
        "Still unavailable. Your entered data is preserved. Check again later; do not repeat uncertain writes.",
      );
    } finally {
      inProgress.current = false;
      setChecking(false);
    }
  }
  return (
    <div className="connection-check">
      <button
        type="button"
        className="secondary"
        disabled={checking}
        onClick={() => void check()}
      >
        {checking ? "Checking connection…" : "Check connection"}
      </button>
      <p className="small" role="status" aria-live="polite" aria-atomic="true">
        {progress}
      </p>
    </div>
  );
}
