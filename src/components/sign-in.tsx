import { useEffect, useRef } from "react";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import { ErrorNotice } from "./ui";
import GlareHover from "./react-bits/GlareHover/GlareHover";

const authMessages: Record<string, string> = {
  login_denied:
    "Microsoft sign-in was cancelled or access was denied. Try again or contact your administrator.",
  invalid_login:
    "This sign-in attempt expired or could not be verified. Start again.",
  not_whitelisted:
    "Your work account does not have access to WorkStation. Contact your administrator.",
  invalid_identity: "We could not complete sign-in. Please try again.",
  login_failed: "We could not complete sign-in. Please try again.",
  identity_unavailable:
    "Sign-in is temporarily unavailable. Please try again shortly.",
  directory_unavailable:
    "Sign-in is temporarily unavailable. Please try again shortly.",
  database_unavailable:
    "Sign-in is temporarily unavailable. Please try again shortly.",
  development_identity_required:
    "Microsoft sign-in is not configured in this local development environment. Choose an explicitly labeled development identity.",
  development_auth_disabled:
    "This sign-in link is not available. Return to the login page and try again.",
  invalid_redirect:
    "This sign-in link is not available. Return to the login page and try again.",
};
export function getLoginHint() {
  const code = new URLSearchParams(window.location.search).get("auth_error");
  if (code === null) return undefined;
  return {
    message: Object.hasOwn(authMessages, code)
      ? authMessages[code]
      : "We could not complete sign-in. Please try again.",
    development: code === "development_identity_required",
  };
}
export type LoginHint = ReturnType<typeof getLoginHint>;
export function SignIn({
  state,
  error,
  retry,
  hint,
}: {
  state: "signed-out" | "denied" | "expired" | "error";
  error?: unknown;
  retry: () => void;
  hint?: LoginHint;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  const title =
    state === "denied"
      ? "Access is restricted"
      : state === "expired"
        ? "Your session has expired"
        : state === "error"
          ? "We couldn’t connect"
          : "Work\nStation";
  useEffect(() => {
    if (hint || state !== "signed-out") heading.current?.focus();
  }, [hint, state]);
  const development =
    import.meta.env.DEV &&
    (hint?.development || import.meta.env.VITE_SHOW_DEV_SIGNIN === "true");
  return (
    <main
      className={`studio-login ${state !== "signed-out" ? "studio-status" : ""}`}
    >
      <img
        className="studio-room"
        src="/assets/studio-room-v3.webp"
        alt=""
        fetchPriority="high"
      />
      <header className="studio-top">
        <a
          href="/"
          className="studio-brand"
          aria-label="MindSept WorkStation home"
        >
          <img src="/assets/mind7-brass-v2.webp" alt="" />
          <span>
            MindSept<small>TEAM WORKSPACE</small>
          </span>
        </a>
        <span className="studio-top-note">A place for our work</span>
      </header>
      <div className="studio-intro">
        <span className="eyebrow">WELCOME TO MINDSEPT</span>
        <h1 ref={heading} tabIndex={-1}>
          {title}
        </h1>
        <p>
          {state === "denied"
            ? "Your account needs to be on the MindSept team whitelist. Contact your administrator for access."
            : state === "expired"
              ? "Sign in again to return to your projects and shared documentation."
              : state === "error"
                ? "The workspace service is unavailable. Check your connection and try again."
                : "The projects. The people.\nThe thinking that connects them."}
        </p>
        {hint && (
          <p className="studio-auth-notice" role="alert">
            {hint.message}
          </p>
        )}
        {state === "error" && <ErrorNotice error={error} />}
      </div>
      <div className="studio-computer">
        <div className="computer-shadow" aria-hidden="true" />
        <img
          className="computer-frame"
          src="/assets/studio-mac-v3.webp"
          alt=""
          fetchPriority="high"
        />
        <GlareHover
          className="computer-screen"
          width="auto"
          height="auto"
          background="transparent"
          borderColor="transparent"
          borderRadius="2px"
          glareColor="#f5deb4"
          glareOpacity={0.13}
          glareSize={180}
          transitionDuration={900}
        >
          <div className="screen-landscape" aria-hidden="true" />
          <div className="screen-content">
            <img
              className="screen-mark"
              src="/assets/mind7-brass-v2.webp"
              alt=""
            />
            <span className="screen-eyebrow">MINDSEPT WORKSTATION</span>
            <h2>Your workspace awaits</h2>
            <div className="studio-login-action">
              {state === "error" ? (
                <button className="button microsoft" onClick={retry}>
                  Try again
                  <ArrowUpRight size={18} />
                </button>
              ) : (
                <a href="/api/v1/auth/login" className="button microsoft">
                  <span className="ms-mark" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                    <i />
                  </span>
                  Continue with Microsoft
                  <ArrowUpRight size={18} />
                </a>
              )}
              <p>Use your work Outlook account</p>
            </div>
          </div>
        </GlareHover>
      </div>
      {development && (
        <aside
          className="development-signin"
          aria-label="Local development sign-in"
        >
          <strong>Local development only</strong>
          <a href="/api/v1/auth/login?dev_user=member">Development member</a>
          <a href="/api/v1/auth/login?dev_user=admin">
            Development administrator
          </a>
        </aside>
      )}
      <footer className="studio-footer">
        <span>
          <ShieldCheck size={15} />
          Private access for the MindSept team
        </span>
        <span>Projects · Knowledge · Croissantage</span>
      </footer>
    </main>
  );
}
