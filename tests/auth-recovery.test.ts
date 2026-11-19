import assert from "node:assert/strict";
import test from "node:test";
import {
  authCallbackDestination,
  hasPasswordRecoveryParams,
  isPasswordRecoveryEvent,
  passwordRecoveryRedirectUrl,
  PASSWORD_RECOVERY_PATH,
} from "../src/lib/auth-recovery.ts";

test("recovery usa redirectTo direto para a página de redefinição", () => {
  assert.equal(passwordRecoveryRedirectUrl("http://localhost:3000"), "http://localhost:3000/redefinir-senha");
  assert.equal(passwordRecoveryRedirectUrl("https://staging.example.com"), "https://staging.example.com/redefinir-senha");
});

test("callback de recovery permanece na redefinição e nunca cai no login", () => {
  assert.equal(authCallbackDestination("recovery", null), PASSWORD_RECOVERY_PATH);
  assert.equal(authCallbackDestination(null, PASSWORD_RECOVERY_PATH), PASSWORD_RECOVERY_PATH);
  assert.notEqual(authCallbackDestination("recovery", null), "/login");
});

test("página reconhece código PKCE e evento PASSWORD_RECOVERY", () => {
  assert.equal(hasPasswordRecoveryParams("?code=pkce-code", ""), true);
  assert.equal(hasPasswordRecoveryParams("", "#type=recovery&access_token=redacted"), true);
  assert.equal(isPasswordRecoveryEvent("PASSWORD_RECOVERY"), true);
  assert.equal(isPasswordRecoveryEvent("SIGNED_IN"), false);
});
