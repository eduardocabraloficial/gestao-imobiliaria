import { safeInternalPath } from "./security.ts";

export const PASSWORD_RECOVERY_PATH = "/redefinir-senha";
export const PASSWORD_RECOVERY_MARKER = "cabral-house-password-recovery";

export function passwordRecoveryRedirectUrl(siteOrigin: string) {
  return new URL(PASSWORD_RECOVERY_PATH, siteOrigin).toString();
}

export function authCallbackDestination(type: string | null, next: string | null) {
  if (type === "recovery") return PASSWORD_RECOVERY_PATH;
  return safeInternalPath(next);
}

export function isPasswordRecoveryEvent(event: string) {
  return event === "PASSWORD_RECOVERY";
}

export function hasPasswordRecoveryParams(search: string, hash: string) {
  const searchParams = new URLSearchParams(search);
  const hashParams = new URLSearchParams(hash.replace(/^#/, ""));
  return searchParams.has("code") || searchParams.get("type") === "recovery" || hashParams.get("type") === "recovery";
}
