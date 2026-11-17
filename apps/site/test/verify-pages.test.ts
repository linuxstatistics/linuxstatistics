import { expect, test } from "vitest";
import { PROFILES } from "../src/lib/picker-profiles";
import { NO_VERIFY_PAGE, VERIFY_PAGES, verifyLabel } from "../src/lib/verify-pages";
import { GPG_STEPS, SHA256_STEPS } from "../src/lib/verify-guide";

test("every profiled distro has an official verify page or is listed as having none", () => {
  const none = new Set<string>(NO_VERIFY_PAGE);
  for (const p of PROFILES) {
    expect(VERIFY_PAGES[p.key] != null || none.has(p.key), p.key).toBe(true);
    expect(VERIFY_PAGES[p.key] != null && none.has(p.key), p.key).toBe(false);
  }
});

test("verify pages are https on the project's side, never a mirror we don't control", () => {
  for (const [slug, v] of Object.entries(VERIFY_PAGES)) {
    expect(v.url, slug).toMatch(/^https?:\/\//);
    expect(v.url, slug).not.toMatch(/mirror|sourceforge|fosshub|softpedia/i);
  }
});

test("labels name the hash the project actually publishes", () => {
  expect(verifyLabel({ url: "x", kind: "both", gpg: true })).toBe("SHA256 and signature");
  expect(verifyLabel({ url: "x", kind: "checksums", gpg: false, hash: "MD5" })).toBe("MD5");
  expect(verifyLabel({ url: "x", kind: "instructions", gpg: true, hash: null })).toBe("Signature");
  expect(verifyLabel(VERIFY_PAGES.q4os!)).toBe("MD5");
});

test("guide commands cover the three systems and the signature check", () => {
  expect(SHA256_STEPS.map((s) => s.os)).toEqual(["Windows", "macOS", "Linux"]);
  expect(SHA256_STEPS.find((s) => s.os === "Windows")?.command).toMatch(/^Get-FileHash .+ -Algorithm SHA256$/);
  expect(GPG_STEPS.some((s) => s.command.startsWith("gpg --verify"))).toBe(true);
});
