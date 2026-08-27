export const AUTH_CHANGED_EVENT = "jenns40-auth";

export function notifyAuthChanged() {
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}
