export const ASSISTANT_ACTION_EVENT = "guardian:assistant-action";

export type AssistantAction =
  | {
      type: "toggle_reminder";
      label: string;
    }
  | {
      type: "add_reminder";
      label: string;
      time: string;
    }
  | {
      type: "send_family_update";
      message: string;
    }
  | {
      type: "sos_trigger";
    }
  | {
      type: "sos_cancel";
    };

export const dispatchAssistantAction = (action: AssistantAction) => {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent<AssistantAction>(ASSISTANT_ACTION_EVENT, { detail: action }));
};
