"use client";
import { useEffect, useRef, useState } from "react";
import {
  requestAccess,
  getNetworkDetails,
  signTransaction,
} from "@stellar/freighter-api";
import { api, Project, serviceUnavailable, submissionUncertain } from "@/lib/api";
import { ConnectionCheck } from "@/components/connection-check";

const TESTNET = "Test SDF Network ; September 2015";
type Action = "deploy" | "accept" | "faucet" | "fund" | "release" | "refund";
type Intent = {
  id: string;
  action: Action;
  hash: string;
  state: string;
  userId: string;
  expiresAt: string;
};
type Status = {
  approvedSubmissionId: string | null;
  clientWallet: string | null;
  freelancerWallet: string | null;
  escrow: null | {
    contractId: string | null;
    termsHash: string;
    amountBaseUnits: string;
    tokenContract: string;
    checkedAt: string | null;
    state: null | {
      status: number;
      clientAccepted: boolean;
      freelancerAccepted: boolean;
      clientRefund: boolean;
      freelancerRefund: boolean;
      balanceBaseUnits: string;
    };
  };
  intents: Intent[];
};
type Prepared = {
  id: string;
  xdr: string;
  hash: string;
  address: string;
  networkPassphrase: string;
  fee: string;
  expiresAt: number;
};
function units(value: string) {
  const amount = BigInt(value);
  const whole = amount / BigInt(10000000);
  const fraction = (amount % BigInt(10000000))
    .toString()
    .padStart(7, "0")
    .replace(/0+$/, "");
  return `${whole}${fraction ? "." + fraction : ""}`;
}
async function walletAddress() {
  const access = await requestAccess();
  if (access.error || !access.address)
    throw new Error(
      "Freighter access was not granted. Install or unlock Freighter, then try again.",
    );
  const network = await getNetworkDetails();
  if (network.error || network.networkPassphrase !== TESTNET)
    throw new Error("Switch Freighter to Stellar Testnet before continuing.");
  return access.address;
}
async function sign(xdr: string, address: string) {
  if ((await walletAddress()) !== address)
    throw new Error(
      "Freighter is using a different account. Select the verified wallet.",
    );
  const result = await signTransaction(xdr, {
    networkPassphrase: TESTNET,
    address,
  });
  if (result.error || !result.signedTxXdr)
    throw new Error(
      "Wallet signing was cancelled or failed. No new transaction was sent.",
    );
  if (result.signerAddress !== address)
    throw new Error("The signing wallet changed.");
  return result.signedTxXdr;
}
export function TestnetEscrow({
  project,
  userId,
  onChange,
}: {
  project: Project;
  userId: string;
  onChange: () => Promise<unknown>;
}) {
  const [wallet, setWallet] = useState<{
    address: string | null;
    enabled: boolean;
  } | null>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [prepared, setPrepared] = useState<Prepared | null>(null);
  const [action, setAction] = useState<Action | null>(null);
  const [busy, setBusy] = useState(false);
  const running = useRef(false);
  const [unavailable, setUnavailable] = useState(false);
  // This contains only public transaction identifiers, never signed XDR or keys.
  // Session storage survives refresh in this browser profile so lost responses
  // cannot accidentally enable a second signed payment.
  const intentKey = `accordbridge:uncertain-testnet-intent:${project.id}`;
  const preparationKey = `accordbridge:uncertain-testnet-prepare:${project.id}`;
  const [uncertain, setUncertain] = useState<{ id: string; hash: string } | null>(null);
  const [uncertainPreparation, setUncertainPreparation] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const current = project.versions.find(
    (version) => version.version === project.currentVersion,
  );
  const pending = status?.intents.find((intent) =>
    ["prepared", "submitted"].includes(intent.state),
  );
  const needsReconciliation = Boolean(uncertain || uncertainPreparation);
  const chain = status?.escrow?.state;
  const isClient = project.role === "client";
  async function refresh() {
    setStatus(await api<Status>(`/testnet/projects/${project.id}`));
    setUnavailable(false);
  }
  useEffect(() => {
    try {
      const remembered = window.sessionStorage.getItem(intentKey);
      setUncertain(remembered ? JSON.parse(remembered) : null);
      setUncertainPreparation(window.sessionStorage.getItem(preparationKey) === "1");
    } catch {
      // Fail closed if browser storage is blocked or corrupt.
      setUncertainPreparation(true);
    }
  }, [intentKey, preparationKey]);
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const linked = await api<{ address: string | null; enabled: boolean }>(
          "/testnet/wallet",
        );
        const state = await api<Status>(`/testnet/projects/${project.id}`);
        if (active) {
          setWallet(linked);
          setStatus(state);
        }
      } catch (cause) {
        if (active) {
          setUnavailable(serviceUnavailable(cause));
          setError(
            cause instanceof Error
              ? cause.message
              : "Unable to load testnet status.",
          );
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [project.id]);
  async function recoverStatus() {
    const [linked, state] = await Promise.all([
      api<{ address: string | null; enabled: boolean }>("/testnet/wallet"),
      api<Status>(`/testnet/projects/${project.id}`),
    ]);
    setWallet(linked);
    setStatus(state);
    setUnavailable(false);
    setError("");
    // This is intentionally read-only. A pending submission still requires
    // the explicit chain-reconciliation action below.
  }
  async function run(work: () => Promise<void>) {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await work();
      setUnavailable(false);
    } catch (cause) {
      setUnavailable(serviceUnavailable(cause));
      setError(
        cause instanceof Error ? cause.message : "Testnet request failed.",
      );
    } finally {
      running.current = false;
      setBusy(false);
    }
  }
  async function prepare(next: Action) {
    if (needsReconciliation) return;
    await run(async () => {
      let transaction: Prepared;
      try {
        transaction = await api<Prepared>(
          `/testnet/projects/${project.id}/prepare`,
          "POST",
          { action: next, version: project.currentVersion },
        );
      } catch (cause) {
        if (submissionUncertain(cause)) {
          setUncertainPreparation(true);
          window.sessionStorage.setItem(preparationKey, "1");
        }
        throw cause;
      }
      setPrepared(transaction);
      setAction(next);
      await refresh();
      await onChange();
    });
  }
  async function check() {
    await run(async () => {
      // Explicit user action: the backend reconciles the EXISTING intent
      // against retained ledger history. No transaction is resubmitted.
      const checked = await api<Status>(
        `/testnet/projects/${project.id}/check`,
        "POST",
      );
      setStatus(checked);
      setPrepared(null);
      if (uncertainPreparation) {
        window.sessionStorage.removeItem(preparationKey);
        setUncertainPreparation(false);
      }
      if (uncertain) {
        const recorded = checked.intents.find((item) => item.id === uncertain.id);
        if (recorded && ["confirmed", "failed", "expired"].includes(recorded.state)) {
          window.sessionStorage.removeItem(intentKey);
          setUncertain(null);
        }
      }
      await onChange();
      setMessage(
        uncertain && !checked.intents.some((item) =>
          item.id === uncertain.id && ["confirmed", "failed", "expired"].includes(item.state),
        )
          ? "The existing submission is not yet confirmed failed or settled. Do not sign again; check this same intent after the network recovers."
          : "Checked the existing transaction and contract against Stellar testnet.",
      );
    });
  }
  return (
    <section
      className="panel agreement-review testnet-card"
      aria-labelledby="testnet-title"
    >
      <div className="section-heading">
        <h2 id="testnet-title">Stellar testnet escrow</h2>
        <span className="badge warning">Test tokens · no monetary value</span>
      </div>
      <p>
        Only the first milestone is supported. Its nominal USDC amount is tested
        using the same number of ABUSD tokens; no USDC or real money moves. This
        experimental escrow charges no platform or provider fee. Test XLM pays
        network fees.
      </p>
      <p className="small">
        Both wallets approve the frozen terms. The client can release to the
        freelancer; a refund needs both participants. No operator or resolver
        can move tokens, and there is no automatic timeout release. Preparing
        deployment locks this agreement even if you cancel wallet signing.
      </p>
      {busy && (
        <p className="small" role="status" aria-live="polite">
          Checking or preparing a testnet action… Do not submit another request.
        </p>
      )}
      {error && (
        <div className="workspace-error" role="alert">
          <p>{error}</p>
          {unavailable && <ConnectionCheck onRecovered={recoverStatus} />}
          <p className="small">
            A timed-out signed submission is not a confirmed failure. Check the
            existing intent and its chain state before any new payment action.
          </p>
        </div>
      )}
      {message && (
        <p className="workspace-notice" role="status">
          {message}
        </p>
      )}
      {!wallet ? (
        <p>Loading testnet configuration…</p>
      ) : !wallet.enabled ? (
        <p className="policy-note">
          Testnet deployment is not configured on this server. Saved agreements
          remain available.
        </p>
      ) : (
        <>
          <div className="wallet-details">
            <strong>Your verified testnet wallet</strong>
            {wallet.address ? (
              <>
                <code>{wallet.address}</code>
                <a
                  className="text-button"
                  href={`https://friendbot.stellar.org?addr=${wallet.address}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Get free test XLM from Stellar Friendbot ↗
                </a>
              </>
            ) : (
              <>
                <p>
                  Use Freighter on desktop. Linking signs a zero-fee,
                  sequence-zero ownership challenge which is never broadcast.
                  Only standard single-key G-addresses are supported; wallet
                  replacement is not implemented.
                </p>
                <button
                  className="secondary"
                  disabled={busy}
                  onClick={() =>
                    run(async () => {
                      const address = await walletAddress();
                      const challenge = await api<{ id: string; xdr: string }>(
                        "/testnet/wallet/challenge",
                        "POST",
                        { address },
                      );
                      const signedXdr = await sign(challenge.xdr, address);
                      await api("/testnet/wallet/verify", "POST", {
                        id: challenge.id,
                        signedXdr,
                      });
                      setWallet({ address, enabled: true });
                      await refresh();
                      setMessage("Wallet ownership verified for this account.");
                    })
                  }
                >
                  Connect & verify Freighter
                </button>
              </>
            )}
          </div>
          <div className="terms-grid">
            <div>
              <span>Client wallet</span>
              <code>{status?.clientWallet ?? "Not linked yet"}</code>
            </div>
            <div>
              <span>Freelancer wallet</span>
              <code>{status?.freelancerWallet ?? "Not linked yet"}</code>
            </div>
          </div>
          <p className="small">
            Current chain status:{" "}
            <strong>
              {!status?.escrow?.contractId
                ? "Escrow not confirmed"
                : !chain
                  ? "Awaiting verified state"
                  : chain.status === 0
                    ? "Awaiting token funding"
                    : chain.status === 1
                      ? "Funded on testnet"
                      : chain.status === 2
                        ? "Released on testnet"
                        : "Refunded on testnet"}
            </strong>
            {status?.escrow?.checkedAt &&
              ` · last checked ${new Date(status.escrow.checkedAt).toLocaleString()}`}
          </p>
          {status?.escrow && (
            <details>
              <summary>Inspect frozen terms and contract</summary>
              <div className="wallet-details">
                <span>Test-token contract</span>
                <code>{status.escrow.tokenContract}</code>
                <span>Escrow contract</span>
                <code>
                  {status.escrow.contractId ?? "Deployment not confirmed"}
                </code>
                <span>Terms hash</span>
                <code>{status.escrow.termsHash}</code>
                <p>
                  Milestone: {units(status.escrow.amountBaseUnits)} ABUSD · net
                  on release: {units(status.escrow.amountBaseUnits)} ABUSD
                </p>
                <p>
                  Verified held balance:{" "}
                  {chain
                    ? `${units(chain.balanceBaseUnits)} ABUSD`
                    : "Unavailable"}
                </p>
              </div>
            </details>
          )}
          {needsReconciliation && (
            <div className="workspace-error" role="alert">
              <strong>Transaction outcome not yet reconciled</strong>
              <p>
                The response was interrupted. A signed transaction may already
                have reached testnet. Only use “Check transaction & chain state”;
                do not sign, fund, release or refund again yet.
              </p>
              {uncertain && <code>{uncertain.hash}</code>}
            </div>
          )}
          {pending || needsReconciliation ? (
            <div className="policy-note">
              <p>
                {pending?.action ?? "Existing intent"}:{" "}
                {pending?.state === "prepared"
                  ? "Awaiting wallet signing or expiry"
                  : pending?.state === "submitted"
                    ? "Submitted; outcome not yet confirmed"
                    : "Interrupted submission; outcome not yet confirmed"}
                . Check the existing transaction before another action.
              </p>
              <code>{pending?.hash ?? uncertain?.hash ?? "Check the current intent"}</code>
              {pending?.userId === userId &&
                pending.state === "prepared" &&
                !prepared &&
                !needsReconciliation && (
                  <button
                    className="secondary"
                    disabled={busy}
                    onClick={() => prepare(pending.action)}
                  >
                    Resume wallet signing
                  </button>
                )}
              <p className="small">
                If signing was cancelled, wait for the three-minute transaction
                deadline, then check again. The server verifies expiry against
                retained ledger history.
              </p>
            </div>
          ) : (
            <div className="button-row">
              {!status?.escrow?.contractId && isClient && (
                <button
                  className="primary"
                  disabled={
                    busy ||
                    !wallet.address ||
                    !status?.clientWallet ||
                    !status?.freelancerWallet ||
                    current?.acceptances.length !== 2
                  }
                  onClick={() => prepare("deploy")}
                >
                  Prepare milestone escrow
                </button>
              )}
              {chain?.status === 0 && wallet.address && (
                <>
                  <button
                    className="secondary"
                    disabled={
                      busy ||
                      (isClient
                        ? chain.clientAccepted
                        : chain.freelancerAccepted)
                    }
                    onClick={() => prepare("accept")}
                  >
                    {(
                      isClient ? chain.clientAccepted : chain.freelancerAccepted
                    )
                      ? "Your on-chain approval is confirmed"
                      : "Approve terms with wallet"}
                  </button>
                  <button
                    className="secondary"
                    disabled={busy}
                    onClick={() => prepare("faucet")}
                  >
                    Get 1,000 ABUSD test tokens
                  </button>
                  {isClient && (
                    <button
                      className="primary"
                      disabled={
                        busy ||
                        !chain.clientAccepted ||
                        !chain.freelancerAccepted
                      }
                      onClick={() => prepare("fund")}
                    >
                      Prepare test-token funding
                    </button>
                  )}
                </>
              )}
              {chain?.status === 1 && wallet.address && (
                <>
                  {isClient && (
                    <button
                      className="primary"
                      disabled={busy || !status?.approvedSubmissionId}
                      onClick={() => prepare("release")}
                    >
                      {status?.approvedSubmissionId
                        ? "Review release to freelancer"
                        : "Approve submitted work before release"}
                    </button>
                  )}
                  <button
                    className="secondary"
                    disabled={
                      busy ||
                      (isClient ? chain.clientRefund : chain.freelancerRefund)
                    }
                    onClick={() => prepare("refund")}
                  >
                    Approve mutual refund
                  </button>
                </>
              )}
            </div>
          )}
          {prepared && (
            <section
              className="confirmation"
              aria-label="Testnet transaction review"
            >
              <h3>Review {action} on Stellar Testnet</h3>
              <p>
                Network fee limit: {units(prepared.fee)} test XLM. Wallet:{" "}
                <code>{prepared.address}</code>
              </p>
              <p>
                {action === "deploy"
                  ? "Preparing this escrow locks the current agreement version."
                  : action === "release"
                    ? "This authorizes the full test-token amount to the freelancer."
                    : action === "refund"
                      ? "Your refund vote is recorded; tokens return to the client once both parties agree."
                      : action === "fund"
                        ? `Deposit ${current?.agreement.milestones[0].amount} ABUSD into this milestone escrow.`
                        : "This is a testnet transaction using tokens with no monetary value."}
              </p>
              <button
                className="primary"
                disabled={busy || needsReconciliation}
                onClick={() =>
                  run(async () => {
                    const signedXdr = await sign(
                      prepared.xdr,
                      prepared.address,
                    );
                    // Set the guard *before* sending; even a lost response or
                    // page refresh must not trigger a second signature.
                    const marker = { id: prepared.id, hash: prepared.hash };
                    window.sessionStorage.setItem(intentKey, JSON.stringify(marker));
                    setUncertain(marker);
                    setPrepared(null);
                    const result = await api<{ state: string }>(
                      `/testnet/projects/${project.id}/submit`,
                      "POST",
                      { intentId: marker.id, signedXdr },
                    );
                    await refresh();
                    setMessage(
                      result.state === "unknown"
                        ? "Submission outcome unknown. Check this same transaction before retrying."
                        : "Submission recorded. Check the existing transaction to confirm its result.",
                    );
                  })
                }
              >
                Sign with Freighter & submit
              </button>
            </section>
          )}
          <div className="button-row">
            <button className="secondary" disabled={busy} onClick={check}>
              {busy ? "Working…" : "Check transaction & chain state"}
            </button>
          </div>
          {status?.intents.length ? (
            <details>
              <summary>Testnet transaction records</summary>
              {status.intents.map((intent) => (
                <p className="small" key={intent.id}>
                  {intent.action} · {intent.state} ·{" "}
                  <a
                    target="_blank"
                    rel="noreferrer"
                    href={`https://stellar.expert/explorer/testnet/tx/${intent.hash}`}
                  >
                    {intent.hash}
                  </a>
                </p>
              ))}
            </details>
          ) : null}
        </>
      )}
    </section>
  );
}
