import {
  Links,
  Meta,
  MetaFunction,
  Outlet,
  Scripts,
  ScrollRestoration,
  defer,
  useFetcher,
  useLoaderData,
  useLocation,
  useNavigation,
} from "@remix-run/react";
import "./tailwind.css";
import "./index.css";
// import React from "react"; 2024修改
import React, { useState } from "react";
import { Toaster } from "react-hot-toast";
import CogTooth from "./assets/cog-tooth";
import { SettingsForm } from "./components/form/settings-form";
import AllHandsLogo from "#/assets/branding/all-hands-logo.svg?react";
import { ModalBackdrop } from "#/components/modals/modal-backdrop";
import { isGitHubErrorReponse, retrieveGitHubUser } from "./api/github";
import OpenHands from "./api/open-hands";
import LoadingProjectModal from "./components/modals/LoadingProject";
import { getSettings, settingsAreUpToDate } from "./services/settings";
import AccountSettingsModal from "./components/modals/AccountSettingsModal";
import NewProjectIcon from "./assets/new-project.svg?react";
import DocsIcon from "./assets/docs.svg?react";
import VSOpenIcon from './assets/vsopen.svg?react'; // 2024新增
import DialogModeIcon from './assets/dialogmode.svg?react'; // 2024新增
import i18n from "./i18n";
import { useSocket } from "./context/socket";
import { UserAvatar } from "./components/user-avatar";
import { DangerModal } from "./components/modals/confirmation-modals/danger-modal";
import { DialogModeForm } from "./components/DialogModeForm"; // 2024新增

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
        <Toaster />
      </body>
    </html>
  );
}

export const meta: MetaFunction = () => [
  { title: "OpenHands" },
  { name: "description", content: "Let's Start Building!" },
];

export const clientLoader = async () => {
  let token = localStorage.getItem("token");
  const ghToken = localStorage.getItem("ghToken");

  let user: GitHubUser | GitHubErrorReponse | null = null;
  if (ghToken) user = await retrieveGitHubUser(ghToken);

  const settings = getSettings();
  await i18n.changeLanguage(settings.LANGUAGE);

  const settingsIsUpdated = settingsAreUpToDate();
  if (!settingsIsUpdated) {
    localStorage.removeItem("token");
    token = null;
  }

  return defer({
    token,
    ghToken,
    user,
    settingsIsUpdated,
    settings,
  });
};


export default function App() {
  const { stop, isConnected } = useSocket();
  const navigation = useNavigation();
  const location = useLocation();
  const { token, user, settingsIsUpdated, settings } =
    useLoaderData<typeof clientLoader>();
  const loginFetcher = useFetcher({ key: "login" });
  const logoutFetcher = useFetcher({ key: "logout" });
  const endSessionFetcher = useFetcher({ key: "end-session" });

  const [vscodePath, setVscodePath] = useState("");
  const [isVscodeModalOpen, setIsVscodeModalOpen] = useState(false);

  const [dialogModeModalIsOpen, setDialogModeModalIsOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const handleVscodeButtonClick = () => {
    setIsVscodeModalOpen(true);
  };

  const handleVscodeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVscodePath(e.target.value);
  };

  const handleVscodeOpen = async () => {
    if (!vscodePath) {
      alert("Please enter a valid path.");
      return;
    }
    setLoading(true);
    const token = localStorage.getItem("token");
    if(token) {
      try {
        await OpenHands.openVscode(token, vscodePath); // 调用后端API
        setIsVscodeModalOpen(false); // 关闭模态框
      } catch (error) {
        console.error("Error opening VS Code", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleVscodeModalClose = () => {
    setIsVscodeModalOpen(false);
  };

  const [accountSettingsModalOpen, setAccountSettingsModalOpen] =
    React.useState(false);
  const [settingsModalIsOpen, setSettingsModalIsOpen] = React.useState(false);
  const [startNewProjectModalIsOpen, setStartNewProjectModalIsOpen] =
    React.useState(false);
  const [data, setData] = React.useState<{
    models: string[];
    agents: string[];
    securityAnalyzers: string[];
  }>({
    models: [],
    agents: [],
    securityAnalyzers: [],
  });

  React.useEffect(() => {
    // We fetch this here instead of the data loader because the server seems to block
    // the retrieval when the session is closing -- preventing the screen from rendering until
    // the fetch is complete
    (async () => {
      const [models, agents, securityAnalyzers] = await Promise.all([
        OpenHands.getModels(),
        OpenHands.getAgents(),
        OpenHands.getSecurityAnalyzers(),
      ]);

      setData({ models, agents, securityAnalyzers });
    })();
  }, []);

  React.useEffect(() => {
    // If the github token is invalid, open the account settings modal again
    if (isGitHubErrorReponse(user)) {
      setAccountSettingsModalOpen(true);
    }
  }, [user]);

  React.useEffect(() => {
    if (location.pathname === "/") {
      // If the user is on the home page, we should stop the socket connection.
      // This is relevant when the user redirects here for whatever reason.
      if (isConnected) stop();
    }
  }, [location.pathname]);

  const handleUserLogout = () => {
    logoutFetcher.submit(
      {},
      {
        method: "POST",
        action: "/logout",
      },
    );
  };

  const handleAccountSettingsModalClose = () => {
    // If the user closes the modal without connecting to GitHub,
    // we need to log them out to clear the invalid token from the
    // local storage
    if (isGitHubErrorReponse(user)) handleUserLogout();
    setAccountSettingsModalOpen(false);
  };

  const handleEndSession = () => {
    setStartNewProjectModalIsOpen(false);
    // call new session action and redirect to '/'
    endSessionFetcher.submit(new FormData(), {
      method: "POST",
      action: "/end-session",
    });
  };

  //<Toaster position="bottom-center" />

  return (

    <div className="bg-root-primary p-3 h-screen min-w-[1024px] overflow-x-hidden flex gap-3">

      <aside className="px-1 flex flex-col gap-[15px]">
        <button
          type="button"
          aria-label="All Hands Logo"
          onClick={() => {
            if (location.pathname !== "/") setStartNewProjectModalIsOpen(true);
          }}
        >
          <AllHandsLogo width={34} height={23} />
        </button>
        <nav className="py-[18px] flex flex-col items-center gap-[18px]">
          <UserAvatar
            user={user}
            isLoading={loginFetcher.state !== "idle"}
            onLogout={handleUserLogout}
            handleOpenAccountSettingsModal={() =>
              setAccountSettingsModalOpen(true)
            }
          />
          <button
            type="button"
            className="w-8 h-8 rounded-full hover:opacity-80 flex items-center justify-center"
            onClick={() => setSettingsModalIsOpen(true)}
            aria-label="Settings"
          >
            <CogTooth />
          </button>
          <a
            href="https://docs.all-hands.dev"
            target="_blank"
            rel="noreferrer noopener"
            className="w-8 h-8 rounded-full hover:opacity-80 flex items-center justify-center"
            aria-label="Documentation"
          >
            <DocsIcon width={28} height={28} />
          </a>
          {!!token && (
            <button
              type="button"
              aria-label="Start new project"
              onClick={() => setStartNewProjectModalIsOpen(true)}
            >
              <NewProjectIcon width={28} height={28} />
            </button>
          )}
          <button
            type="button"
            className="w-8 h-8 rounded-full hover:opacity-80 flex items-center justify-center"
            onClick={handleVscodeButtonClick}
            aria-label="VSOpen"
          >
            <VSOpenIcon width={28} height={28} />
          </button>
          <button
            type="button"
            className="w-8 h-8 rounded-full hover:opacity-80 flex items-center justify-center"
            onClick={() => setDialogModeModalIsOpen(true)}  // 点击时打开对话模式设置
            aria-label="Dialog Mode Settings"
          >
            <DialogModeIcon width={28} height={28} />  {/* 可以使用一个新的图标 */}
          </button>
        </nav>
      </aside>

      <div className="h-full w-full relative">
        <Outlet />
        {navigation.state === "loading" && location.pathname !== "/" && (
          <ModalBackdrop>
            <LoadingProjectModal
              message={
                endSessionFetcher.state === "loading"
                  ? "Ending session, please wait..."
                  : undefined
              }
            />
          </ModalBackdrop>
        )}
        {(!settingsIsUpdated || settingsModalIsOpen) && (
          <ModalBackdrop onClose={() => setSettingsModalIsOpen(false)}>
            <div className="bg-root-primary w-[384px] p-6 rounded-xl flex flex-col gap-2">
              <span className="text-xl leading-6 font-semibold -tracking-[0.01em">
                AI Provider Configuration
              </span>
              <p className="text-xs text-[#A3A3A3]">
                To continue, connect an OpenAI, Anthropic, or other LLM account
              </p>
              {isConnected && (
                <p className="text-xs text-danger">
                  Changing settings during an active session will end the
                  session
                </p>
              )}
              <SettingsForm
                settings={settings}
                models={data.models}
                agents={data.agents}
                securityAnalyzers={data.securityAnalyzers}
                onClose={() => setSettingsModalIsOpen(false)}
              />
            </div>
          </ModalBackdrop>
        )}
        {accountSettingsModalOpen && (
          <ModalBackdrop onClose={handleAccountSettingsModalClose}>
            <AccountSettingsModal
              onClose={handleAccountSettingsModalClose}
              selectedLanguage={settings.LANGUAGE}
              gitHubError={isGitHubErrorReponse(user)}
            />
          </ModalBackdrop>
        )}
        {startNewProjectModalIsOpen && (
          <ModalBackdrop onClose={() => setStartNewProjectModalIsOpen(false)}>
            <DangerModal
              title="Are you sure you want to exit?"
              description="You will lose any unsaved information."
              buttons={{
                danger: {
                  text: "Exit Project",
                  onClick: handleEndSession,
                },
                cancel: {
                  text: "Cancel",
                  onClick: () => setStartNewProjectModalIsOpen(false),
                },
              }}
            />
          </ModalBackdrop>
        )}

      {isVscodeModalOpen && (
        <ModalBackdrop onClose={handleVscodeModalClose}>
          <div className="bg-root-primary w-[384px] p-6 rounded-xl flex flex-col gap-2">
            <span className="text-xl leading-6 font-semibold -tracking-[0.01em]">
              Open VS Code
            </span>
            <p className="text-xs text-[#A3A3A3]">
              Enter the path of the project you want to open in VS Code.
            </p>
            <input
              type="text"
              value={vscodePath}
              onChange={handleVscodeInputChange}
              className="p-2 border rounded-md"
              placeholder="/path/to/your/project"
            />
            <div className="flex justify-between gap-2 mt-4">
              <button
                className="bg-gray-500 text-white p-2 rounded"
                onClick={handleVscodeModalClose}
              >
                Cancel
              </button>
              <button
                className={`bg-blue-500 text-white p-2 rounded ${
                  loading ? "opacity-50" : ""
                }`}
                onClick={handleVscodeOpen}
                disabled={loading}
              >
                {loading ? "Opening..." : "Open VS Code"}
              </button>
            </div>
          </div>
        </ModalBackdrop>
      )}
      {/* 对话模式设置模态框 */}
      {dialogModeModalIsOpen && (
        <ModalBackdrop onClose={() => setDialogModeModalIsOpen(false)}>
          <DialogModeForm onClose={() => setDialogModeModalIsOpen(false)} />
        </ModalBackdrop>
      )}

      </div>

    </div>
  );
}
