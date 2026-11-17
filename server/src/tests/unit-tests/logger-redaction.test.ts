import { describe, test, expect } from "vitest";
import pino from "pino";
import { LOG_REDACT_PATHS } from "../../utils/logger";

// ใช้ path ชุดเดียวกับ logger จริง แต่เขียนลง memory แทน stdout
function logRequestHeaders(headers: Record<string, string>) {
  const lines: string[] = [];
  const testLogger = pino(
    { redact: { paths: LOG_REDACT_PATHS, censor: "[REDACTED]" } },
    { write: (line: string) => void lines.push(line) },
  );
  testLogger.info({ req: { headers } }, "request");
  return lines.join("");
}

describe("logger redaction", () => {
  test("🔴 should hide the internal proxy secret header", () => {
    const output = logRequestHeaders({
      "x-internal-proxy-secret": "super-secret-value",
      "x-vercel-forwarded-for": "203.0.113.9",
    });

    expect(output).not.toContain("super-secret-value");
    expect(output).toContain("[REDACTED]");
    expect(output).toContain("203.0.113.9");
  });

  test("🔴 should still hide cookies and authorization", () => {
    const output = logRequestHeaders({
      cookie: "auth_token=abc",
      authorization: "Bearer xyz",
    });

    expect(output).not.toContain("auth_token=abc");
    expect(output).not.toContain("Bearer xyz");
  });
});
