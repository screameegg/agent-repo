export interface NpsPromptState {
  submitted: boolean;
  dismissed: boolean;
}

export const npsDismissedStorageKey = (userId?: string | null) => {
  return `lobster-feedback-nps-dismissed-${userId || 'anonymous'}`;
};

export const shouldShowNpsPrompt = ({ submitted, dismissed }: NpsPromptState) => {
  return !submitted && !dismissed;
};

export const readNpsDismissed = (userId?: string | null) => {
  if (typeof window === 'undefined') {
    return false;
  }
  return window.localStorage.getItem(npsDismissedStorageKey(userId)) === 'true';
};

export const markNpsDismissed = (userId?: string | null) => {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(npsDismissedStorageKey(userId), 'true');
};
