import type { Agreement } from "./agreement";
export type Account = { id: string; name: string; email: string };
export type ProjectSummary = {
  id: string;
  currentVersion: number;
  title: string | null;
  draftTitle: string | null;
  role: "client" | "freelancer";
  clientName: string;
  freelancerName: string;
};
export type Version = {
  version: number;
  agreement: Agreement;
  publishedBy: string;
  publishedAt: string;
  acceptances: { userId: string; role: string; acceptedAt: string }[];
};
export type Project = {
  id: string;
  currentVersion: number;
  fundingStarted: boolean;
  role: "client" | "freelancer";
  client: Pick<Account, "id" | "name">;
  freelancer: Pick<Account, "id" | "name">;
  versions: Version[];
  draft: {
    agreement: Agreement;
    baseVersion: number;
    revision: number;
    updatedAt: string;
  } | null;
};
export type RequestOutcome = "read_unavailable" | "unknown" | "failed";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly outcome: RequestOutcome = "failed",
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function serviceUnavailable(cause: unknown): boolean {
  return cause instanceof ApiError && cause.status === 503;
}

export function submissionUncertain(cause: unknown): boolean {
  return cause instanceof ApiError && cause.outcome === "unknown";
}

export async function api<T>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const read = method === "GET" || method === "HEAD";
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      credentials: "same-origin",
      cache: "no-store",
      headers: {
        "content-type": "application/json",
        "x-accordbridge-request": "1",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(
      read
        ? "The workspace service cannot be reached. Check the connection when ready."
        : "The request was interrupted. Its outcome is unknown; check saved state before another action.",
      503,
      read ? "read_unavailable" : "unknown",
    );
  }
  // A gateway or sleeping backend can also return an empty/non-JSON body.
  let data: {
    message?: string;
    outcome?: RequestOutcome;
    errors?: { field: string; message: string }[];
  };
  try {
    data = await response.json();
  } catch {
    // A missing/truncated successful write response cannot prove the write failed.
    throw new ApiError(
      read
        ? "The workspace service returned an unreadable response. Check the connection."
        : "The server response was interrupted. The action may have succeeded; inspect saved or on-chain state before retrying.",
      503,
      read ? "read_unavailable" : "unknown",
    );
  }
  if (!response.ok)
    throw new ApiError(
      data.errors
        ?.map((item) => `${item.field}: ${item.message}`)
        .join(" · ") ||
        data.message ||
        (response.status === 503
          ? "The workspace service is unavailable. Check the connection when ready."
          : "The request failed."),
      response.status,
      response.status === 503
        ? read
          ? "read_unavailable"
          : "unknown"
        : (data.outcome ?? "failed"),
    );
  return data as T;
}
