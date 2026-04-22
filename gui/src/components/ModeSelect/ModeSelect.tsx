import {
  CheckIcon,
  ChevronDownIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { MessageModes } from "core";
import { isRecommendedAgentModel } from "core/llm/toolSupport";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/Auth";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import {
  selectConfig,
  selectSelectedChatModel,
} from "../../redux/slices/configSlice";
import {
  setMode,
  setSelectedOnlineAgent,
} from "../../redux/slices/sessionSlice";
import { getFontSize, getMetaKeyLabel } from "../../util";
import { ToolTip } from "../gui/Tooltip";
import { useMainEditor } from "../mainInput/TipTapEditor";
import { Menu, MenuButton, MenuItem, MenuItems, SubMenu } from "../ui";
import { ModeIcon } from "./ModeIcon";

export function ModeSelect() {
  const dispatch = useAppDispatch();
  const mode = useAppSelector((store) => store.session.mode);
  const selectedOnlineAgentName = useAppSelector(
    (store) => store.session.selectedOnlineAgentName,
  );
  const selectedModel = useAppSelector(selectSelectedChatModel);
  const config = useAppSelector(selectConfig);
  const { selectedProfile } = useAuth();

  const [onlineAgents, setOnlineAgents] = useState<
    { id: string; name: string }[]
  >([]);
  const [loadingAgents, setLoadingAgents] = useState(false);

  const onlineAgentConfig = config.experimental?.onlineAgent;

  const fetchOnlineAgents = useCallback(async () => {
    if (!onlineAgentConfig?.apiKey || !onlineAgentConfig?.baseUrl) return;
    setLoadingAgents(true);
    try {
      const response = await fetch(
        `${onlineAgentConfig.baseUrl}/api/agents/v1/models`,
        {
          headers: {
            Authorization: `Bearer ${onlineAgentConfig.apiKey}`,
          },
        },
      );
      if (response.ok) {
        const data = await response.json();
        setOnlineAgents(data.data || []);
      }
    } catch (e) {
      console.error("Failed to fetch online agents", e);
    } finally {
      setLoadingAgents(false);
    }
  }, [onlineAgentConfig]);

  useEffect(() => {
    if (onlineAgentConfig?.apiKey && onlineAgentConfig?.baseUrl) {
      fetchOnlineAgents();
    }
  }, [fetchOnlineAgents]);

  const isGoodAtAgentMode = useMemo(() => {
    if (!selectedModel) {
      return undefined;
    }
    return isRecommendedAgentModel(selectedModel.model);
  }, [selectedModel]);

  const isLocalAgent = useMemo(() => {
    return selectedProfile?.profileType === "local";
  }, [selectedProfile]);

  const { mainEditor } = useMainEditor();
  const metaKeyLabel = useMemo(() => {
    return getMetaKeyLabel();
  }, []);

  const cycleMode = useCallback(() => {
    if (mode === "chat") {
      dispatch(setMode("plan"));
    } else if (mode === "plan") {
      dispatch(setMode("agent"));
    } else if (mode === "agent") {
      dispatch(setMode("validator"));
    } else if (mode === "validator") {
      dispatch(setMode(isLocalAgent ? "chat" : "background"));
    } else {
      dispatch(setMode("chat"));
    }
    if (!document.activeElement?.classList?.contains("ProseMirror")) {
      mainEditor?.commands.focus();
    }
  }, [mode, mainEditor, isLocalAgent]);

  const selectMode = useCallback(
    (newMode: MessageModes) => {
      if (newMode === mode) {
        return;
      }
      dispatch(setMode(newMode));
      if (newMode !== "onlineAgent") {
        dispatch(setSelectedOnlineAgent({ id: undefined, name: undefined }));
      }
      mainEditor?.commands.focus();
    },
    [mode, mainEditor],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "." && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        void cycleMode();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [cycleMode]);

  useEffect(() => {
    if (mode === "background" && isLocalAgent) {
      dispatch(setMode("agent"));
    }
  }, [mode, isLocalAgent, dispatch]);

  const notGreatAtAgent = (mode: string) => (
    <ToolTip
      style={{ zIndex: 200001 }}
      className="flex items-center gap-1"
      content={`${mode} might not work well with this model.`}
    >
      <ExclamationTriangleIcon className="text-warning h-2.5 w-2.5" />
    </ToolTip>
  );

  return (
    <Menu as="div" className="relative inline-block text-left">
      <MenuButton
        data-testid="mode-select-button"
        className="xs:px-2 text-description bg-lightgray/20 flex flex-row items-center gap-1 rounded-full border-none px-1.5 py-0.5 transition-colors duration-200 hover:brightness-110"
      >
        <ModeIcon mode={mode} />
        <span className="hidden sm:block">
          {mode === "chat"
            ? "Chat"
            : mode === "agent"
              ? "Agent"
              : mode === "background"
                ? "Background"
                : mode === "validator"
                  ? "Validator Agent"
                  : mode === "onlineAgent"
                    ? selectedOnlineAgentName || "Online Agent"
                    : "Plan"}
        </span>
        <ChevronDownIcon className="h-2 w-2 flex-shrink-0" aria-hidden="true" />
      </MenuButton>

      <MenuItems className="min-w-32 max-w-64">
        <MenuItem onClick={() => selectMode("chat")}>
          <div className="flex flex-row items-center gap-1.5">
            <ModeIcon mode="chat" />
            <span className="">Chat</span>
            <ToolTip style={{ zIndex: 200001 }} content="All tools disabled">
              <InformationCircleIcon className="h-2.5 w-2.5 flex-shrink-0" />
            </ToolTip>
            <span
              className={`text-description-muted text-[${getFontSize() - 3}px] mr-auto`}
            >
              {getMetaKeyLabel()}L
            </span>
            {mode === "chat" && <CheckIcon className="h-3 w-3" />}
          </div>
        </MenuItem>

        <MenuItem onClick={() => selectMode("plan")}>
          <div className="flex flex-row items-center gap-1.5">
            <ModeIcon mode="plan" />
            <span className="">Plan</span>
            <ToolTip
              style={{ zIndex: 200001 }}
              content="Read-only/MCP tools available"
            >
              <InformationCircleIcon className="h-2.5 w-2.5 flex-shrink-0" />
            </ToolTip>
            {!isGoodAtAgentMode && notGreatAtAgent("Plan")}
            {mode === "plan" && <CheckIcon className="ml-auto h-3 w-3" />}
          </div>
        </MenuItem>

        <MenuItem onClick={() => selectMode("agent")}>
          <div className="flex flex-row items-center gap-1.5">
            <ModeIcon mode="agent" />
            <span className="">Agent</span>
            <ToolTip style={{ zIndex: 200001 }} content="All tools available">
              <InformationCircleIcon className="h-2.5 w-2.5 flex-shrink-0" />
            </ToolTip>
            {!isGoodAtAgentMode && notGreatAtAgent("Agent")}
            {mode === "agent" && <CheckIcon className="ml-auto h-3 w-3" />}
          </div>
        </MenuItem>

        <MenuItem
          disabled={isLocalAgent}
          onClick={() => !isLocalAgent && selectMode("background")}
          className={isLocalAgent ? "opacity-50" : ""}
        >
          <div className="flex flex-row items-center gap-1.5">
            <ModeIcon mode="background" />
            <span className="">Background</span>
            <ToolTip
              style={{ zIndex: 200001 }}
              content="Background mode cannot be used with local agents."
            >
              <InformationCircleIcon className="h-2.5 w-2.5 flex-shrink-0" />
            </ToolTip>
            {isLocalAgent && (
              <ExclamationTriangleIcon className="text-warning h-2.5 w-2.5" />
            )}
            {mode === "background" && <CheckIcon className="ml-auto h-3 w-3" />}
          </div>
        </MenuItem>

        <MenuItem onClick={() => selectMode("validator")}>
          <div className="flex flex-row items-center gap-1.5">
            <ModeIcon mode="validator" />
            <span className="">Validator Agent</span>
            <ToolTip
              style={{ zIndex: 200001 }}
              content="Validates code changes via terminal tests"
            >
              <InformationCircleIcon className="h-2.5 w-2.5 flex-shrink-0" />
            </ToolTip>
            {mode === "validator" && <CheckIcon className="ml-auto h-3 w-3" />}
          </div>
        </MenuItem>

        <div className="border-vsc-input-border my-1 border-t" />

        <SubMenu
          label="Online Agents"
          icon={() => <ModeIcon mode="onlineAgent" />}
          disabled={!onlineAgentConfig || loadingAgents}
        >
          {onlineAgents.length === 0 ? (
            <div className="text-description-muted px-2 py-1 italic">
              {loadingAgents ? "Loading..." : "No agents found"}
            </div>
          ) : (
            onlineAgents.map((agent) => (
              <MenuItem
                key={agent.id}
                onClick={() => {
                  dispatch(setMode("onlineAgent"));
                  dispatch(
                    setSelectedOnlineAgent({ id: agent.id, name: agent.name }),
                  );
                  mainEditor?.commands.focus();
                }}
              >
                <div className="flex w-full items-center justify-between">
                  <span>{agent.name}</span>
                  {mode === "onlineAgent" &&
                    selectedOnlineAgentName === agent.name && (
                      <CheckIcon className="h-3 w-3" />
                    )}
                </div>
              </MenuItem>
            ))
          )}
        </SubMenu>

        <div className="text-description-muted mt-1 px-2 py-1 text-[10px]">
          {`${metaKeyLabel} . for next mode`}
        </div>
      </MenuItems>
    </Menu>
  );
}
