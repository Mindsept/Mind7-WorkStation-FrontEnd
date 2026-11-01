import React, { Suspense, lazy, useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import {
  BrowserRouter,
  Link,
  NavLink,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import * as Dropdown from "@radix-ui/react-dropdown-menu";
import {
  ChevronDown,
  ChevronRight,
  Coffee,
  FolderKanban,
  LogOut,
  UserRound,
} from "lucide-react";
import { api, ApiError, clearSession, mockMode } from "./api/client";
import type { Session } from "./api/types";
import { ErrorNotice, Loading, initials } from "./components/ui";
import { Avatar } from "./features/profile/avatar";
import { ProfileDialog } from "./features/profile/profile-dialog";
const ProjectsPage = lazy(() =>
  import("./pages/projects").then((m) => ({ default: m.ProjectsPage })),
);
const ProjectPage = lazy(() =>
  import("./pages/projects").then((m) => ({ default: m.ProjectPage })),
);
const ResourceViewer = lazy(() =>
  import("./pages/resources").then((m) => ({ default: m.ResourceViewer })),
);
const AttendancePage = lazy(() =>
  import("./pages/attendance").then((m) => ({ default: m.AttendancePage })),
);
import "@fontsource/outfit/latin-400.css";
import "@fontsource/outfit/latin-500.css";
import "@fontsource/outfit/latin-600.css";
import "@fontsource/dm-sans/latin-400.css";
import "@fontsource/dm-sans/latin-500.css";
import "@fontsource/dm-sans/latin-600.css";
import "@fontsource/josefin-sans/latin-400.css";
import "@fontsource/josefin-sans/latin-500.css";
import "./styles.css";
import "./deco.css";
import "./studio-v3.css";
import "./portal-v3.css";
import "./portal-v4.css";
import "./features/workspace-files.css";
import "./portal-material.css";
import { SignIn, getLoginHint } from "./components/sign-in";
const initialLoginHint = getLoginHint();
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (count, error) =>
        !(error instanceof ApiError && error.status < 500) && count < 1,
      refetchOnWindowFocus: false,
    },
    mutations: { retry: false },
  },
});
function Brand() {
  return (
    <Link
      className="brand"
      to="/projects"
      aria-label="MindSept WorkStation home"
    >
      <img src="/assets/mind7-brass-v2.webp" alt="" />
      <span>
        MindSept <small>WORKSTATION</small>
      </span>
    </Link>
  );
}
function DemoControl({ onReset }: { onReset: () => void }) {
  return (
    <div className="demo-bar">
      <span>
        DEMO WORKSPACE{" "}
        <span className="demo-note">· Sample data resets on reload</span>
      </span>
      <label>
        View as{" "}
        <select
          defaultValue={
            new URLSearchParams(window.location.search).get("preview") ===
            "signed-out"
              ? "signed-out"
              : "member"
          }
          onChange={async (e) => {
            if (!import.meta.env.DEV) return;
            const { setMockIdentity } = await import("./mocks/adapter");
            setMockIdentity(
              e.target.value as Parameters<typeof setMockIdentity>[0],
            );
            onReset();
          }}
        >
          <option value="member">Member</option>
          <option value="signed-out">Signed out</option>
          <option value="denied">Access denied</option>
          <option value="expired">Session expired</option>
        </select>
      </label>
    </div>
  );
}
function Shell({
  session,
  onLogout,
}: {
  session: Session;
  onLogout: () => void;
}) {
  const [logoutError, setLogoutError] = useState<unknown>();
  const [loggingOut, setLoggingOut] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const accountTrigger = useRef<HTMLButtonElement>(null);
  const location = useLocation();
  const projectId = location.pathname.match(/^\/projects\/([^/]+)/)?.[1];
  // Use React Query's scheduled observer notifications, not synchronous global
  // cache events emitted while descendant queries are constructed in render.
  const { data: projectTitle } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => api.project(projectId!),
    enabled: Boolean(projectId),
    select: (project) => project.title,
  });

  useEffect(() => {
    const preventFileNavigation = (event: DragEvent) => {
      if (event.dataTransfer?.types.includes("Files")) event.preventDefault();
    };
    window.addEventListener("dragover", preventFileNavigation);
    window.addEventListener("drop", preventFileNavigation);
    return () => {
      window.removeEventListener("dragover", preventFileNavigation);
      window.removeEventListener("drop", preventFileNavigation);
    };
  }, []);
  useEffect(() => {
    document.getElementById("main-content")?.focus();
    window.scrollTo(0, 0);
  }, [location.pathname]);
  const attendance = location.pathname.startsWith("/croissantage");
  return (
    <div
      className={`app-shell ${attendance ? "attendance-shell" : "projects-shell"}`}
    >
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <div className="portal-atmosphere" aria-hidden="true" />
      <div className="workspace">
        <header className="portal-header">
          <div className="portal-header-row">
            <Brand />
            <nav className="primary-navigation" aria-label="Main navigation">
              <NavLink to="/projects">
                <FolderKanban size={18} />
                Projects
              </NavLink>
              <NavLink to="/croissantage">
                <Coffee size={18} />
                Croissantage
              </NavLink>
            </nav>
            <Dropdown.Root>
              <Dropdown.Trigger
                className="user-trigger"
                ref={accountTrigger}
                aria-label={`${initials(session.user.display_name)} ${session.user.display_name} ${session.user.role === "admin" ? "Administrator" : "Team member"} account menu`}
              >
                <Avatar
                  name={session.user.display_name}
                  url={session.user.avatar_url}
                />{" "}
                <span className="user-name">
                  {session.user.display_name}{" "}
                  <small>
                    {session.user.role === "admin"
                      ? "Administrator"
                      : "Team member"}
                  </small>
                </span>
                <ChevronDown size={15} />
              </Dropdown.Trigger>
              <Dropdown.Portal>
                <Dropdown.Content
                  className="dropdown"
                  sideOffset={8}
                  align="end"
                >
                  <Dropdown.Label>
                    {session.user.email || session.user.display_name}
                  </Dropdown.Label>
                  <Dropdown.Separator />
                  <Dropdown.Item onSelect={() => setShowProfile(true)}>
                    <UserRound size={16} />
                    Profile & appearance
                  </Dropdown.Item>
                  <Dropdown.Item
                    disabled={loggingOut}
                    onSelect={async () => {
                      setLoggingOut(true);
                      try {
                        await api.logout();
                        onLogout();
                      } catch (e) {
                        if (e instanceof ApiError && e.status === 401)
                          onLogout();
                        else setLogoutError(e);
                      } finally {
                        setLoggingOut(false);
                      }
                    }}
                  >
                    <LogOut size={16} />
                    {loggingOut ? "Signing out…" : "Sign out"}
                  </Dropdown.Item>
                </Dropdown.Content>
              </Dropdown.Portal>
            </Dropdown.Root>
          </div>
          {(projectId ||
            (attendance && location.pathname !== "/croissantage")) && (
            <nav className="location-trail" aria-label="Workspace location">
              <ol>
                <li>
                  <Link
                    to={attendance ? "/croissantage" : "/projects"}
                    aria-current={
                      !projectId &&
                      !location.pathname.match(/^\/croissantage\//)
                        ? "page"
                        : undefined
                    }
                  >
                    {attendance ? "Croissantage" : "Projects"}
                  </Link>
                </li>
                {projectId && (
                  <>
                    <li className="location-project">
                      <ChevronRight size={13} aria-hidden="true" />
                      <Link
                        title={projectTitle || "Project"}
                        to={`/projects/${projectId}`}
                      >
                        {projectTitle || "Project"}
                      </Link>
                    </li>
                    <li className="location-section">
                      <ChevronRight size={13} aria-hidden="true" />
                      <span aria-current="page">
                        {location.pathname.endsWith("/documentation")
                          ? "Documentation"
                          : "Resources"}
                      </span>
                    </li>
                  </>
                )}
                {attendance && location.pathname !== "/croissantage" && (
                  <li className="location-section">
                    <ChevronRight size={13} aria-hidden="true" />
                    <span aria-current="page">Member history</span>
                  </li>
                )}
              </ol>
            </nav>
          )}
        </header>
        <main id="main-content" tabIndex={-1} className="main-content">
          <ErrorNotice error={logoutError} />
          <Suspense fallback={<Loading label="Opening view…" />}>
            <Routes>
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/projects/:projectId" element={<ProjectPage />} />
              <Route
                path="/projects/:projectId/documentation"
                element={<ProjectPage documentation />}
              />
              <Route
                path="/projects/:projectId/resources/:resourceId"
                element={<ResourceViewer />}
              />
              <Route
                path="/croissantage"
                element={
                  <AttendancePage
                    canManageAttendance={
                      session.user.can_manage_attendance === true
                    }
                  />
                }
              />
              <Route
                path="/croissantage/:memberId"
                element={
                  <AttendancePage
                    canManageAttendance={
                      session.user.can_manage_attendance === true
                    }
                  />
                }
              />
              <Route path="/" element={<Navigate to="/projects" replace />} />
              <Route
                path="*"
                element={
                  <div className="empty">
                    <h1>Page not found</h1>
                    <p>This page may have moved or been removed.</p>
                    <Link className="button primary" to="/projects">
                      Back to projects
                    </Link>
                  </div>
                }
              />
            </Routes>
          </Suspense>
        </main>
        <footer className="workspace-footer">
          MINDSEPT <span>Private team workspace</span>
          <span>WorkStation</span>
        </footer>
        {showProfile && (
          <ProfileDialog
            user={session.user}
            onClose={() => {
              setShowProfile(false);
              requestAnimationFrame(() => accountTrigger.current?.focus());
            }}
          />
        )}
      </div>
    </div>
  );
}
function App() {
  const [loginHint, setLoginHint] = useState(initialLoginHint);
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.has("auth_error")) {
      url.searchParams.delete("auth_error");
      window.history.replaceState(
        window.history.state,
        "",
        `${url.pathname}${url.search}${url.hash}`,
      );
    }
  }, []);
  const client = useQueryClient();
  const [sessionEpoch, setSessionEpoch] = useState(0);
  const [state, setState] = useState<"signed-out" | "expired" | "denied">(
    "signed-out",
  );
  const session = useQuery({
    queryKey: ["session", sessionEpoch],
    queryFn: api.session,
    retry: false,
  });
  const reset = () => {
    clearSession();
    client.clear();
    setSessionEpoch((n) => n + 1);
    setState("signed-out");
    void client.invalidateQueries();
  };
  useEffect(() => {
    if (!session.data) return;
    setLoginHint(undefined);
    const expired = () => {
      clearSession();
      setState("expired");
      client.clear();
      setSessionEpoch((n) => n + 1);
    };
    const denied = () => {
      clearSession();
      setState("denied");
      client.clear();
      setSessionEpoch((n) => n + 1);
    };
    window.addEventListener("session-expired", expired);
    window.addEventListener("access-denied", denied);
    return () => {
      window.removeEventListener("session-expired", expired);
      window.removeEventListener("access-denied", denied);
    };
  }, [client, session.data]);
  const error = session.error;
  const authState =
    error instanceof ApiError && error.status === 403
      ? "denied"
      : error instanceof ApiError && error.code === "session_expired"
        ? "expired"
        : error && (!(error instanceof ApiError) || error.status !== 401)
          ? "error"
          : state;
  return (
    <>
      {mockMode && <DemoControl onReset={reset} />}{" "}
      {session.isPending ? (
        <Loading label="Opening WorkStation…" />
      ) : session.data ? (
        <Shell session={session.data} onLogout={reset} />
      ) : (
        <SignIn
          hint={loginHint}
          state={authState}
          error={error}
          retry={() => void session.refetch()}
        />
      )}
    </>
  );
}
class AppBoundary extends React.Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <main className="empty">
        <h1>Something interrupted this view</h1>
        <p>Reload the workspace to try again.</p>
        <button
          className="button primary"
          onClick={() => window.location.reload()}
        >
          Reload workspace
        </button>
      </main>
    ) : (
      this.props.children
    );
  }
}
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </AppBoundary>
  </React.StrictMode>,
);
