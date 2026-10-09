import { api } from "./api";

/**
 * Only call this from a user-initiated connection check. The probe must be a
 * safe GET. Never pass account, project, signature or payment mutations here.
 */
export async function retrySafeRead(
  probe: () => Promise<unknown>,
  onAttempt: (attempt: number, maximum: number) => void = () => {},
  wait: (ms: number) => Promise<void> = (ms) =>
    new Promise((resolve) => setTimeout(resolve, ms)),
): Promise<void> {
  const maximum = 3;
  for (let attempt = 1; attempt <= maximum; attempt++) {
    onAttempt(attempt, maximum);
    try {
      await probe();
      return;
    } catch (cause) {
      if (attempt === maximum) throw cause;
      await wait(400 * attempt);
    }
  }
}

export async function checkWorkspaceConnection(
  onAttempt: (attempt: number, maximum: number) => void,
): Promise<void> {
  await retrySafeRead(() => api("/health"), onAttempt);
}
