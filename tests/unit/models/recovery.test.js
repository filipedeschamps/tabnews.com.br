import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("models/user.js", () => {
  const findOneByEmail = vi.fn();
  const findOneByUsername = vi.fn();
  return {
    default: { findOneByEmail, findOneByUsername },
    findOneByEmail,
    findOneByUsername,
    __esModule: true,
  };
});

vi.mock("infra/database.js", () => {
  const query = vi.fn();
  return { default: { query }, query, __esModule: true };
});

vi.mock("infra/email.js", () => {
  const triggerSend = vi.fn();
  return { default: { triggerSend }, triggerSend, __esModule: true };
});

vi.mock("models/transactional", () => {
  return {
    RecoveryEmail: vi.fn(() => ({
      html: "<p>ok</p>",
      text: "ok",
    })),
    __esModule: true,
  };
});

vi.mock("infra/webserver.js", () => {
  return { default: { host: "http://localhost:3000" }, __esModule: true };
});

vi.mock("errors", () => {
  class NotFoundError extends Error {
    constructor({ key, message = "NotFound" } = {}) {
      super(message);
      this.name = "NotFoundError";
      this.key = key;
    }
  }
  class InternalServerError extends Error {
    constructor({ message = "Internal" } = {}) {
      super(message);
      this.name = "InternalServerError";
    }
  }
  return { NotFoundError, InternalServerError, __esModule: true };
});

import recovery from "models/recovery.js";
import user from "models/user.js";
import database from "infra/database.js";
import email from "infra/email.js";
import { NotFoundError as NotFoundErrorReal } from "errors";

const { requestPasswordRecovery } = recovery;

const UUID_USER = "00000000-0000-0000-0000-000000000001";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("requestPasswordRecovery (mínimo)", () => {
  it("CT1: cria token e não usa fake quando há < 2 tokens válidos", async () => {
    user.findOneByEmail.mockResolvedValueOnce({ id: UUID_USER, username: "u", email: "u@x.com" });
    const tokenRow = {
      id: "11111111-1111-1111-1111-111111111111",
      user_id: UUID_USER,
      used: false,
      expires_at: new Date(Date.now() + 15 * 60 * 1000),
      created_at: new Date(),
      updated_at: new Date(),
    };
    database.query
      .mockResolvedValueOnce({ rows: [{ count: "1" }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [tokenRow], rowCount: 1 });

    const result = await requestPasswordRecovery({ email: "u@x.com" });

    expect(result).toEqual(tokenRow);
    expect(database.query).toHaveBeenCalledTimes(2);
    expect(email.triggerSend).toHaveBeenCalledTimes(1);
  });

  it("CT2: retorna token fake quando há >= 2 tokens válidos", async () => {
    user.findOneByEmail.mockResolvedValueOnce({ id: UUID_USER, username: "u", email: "u@x.com" });
    database.query.mockResolvedValueOnce({ rows: [{ count: "2" }], rowCount: 1 });

    const result = await requestPasswordRecovery({ email: "u@x.com" });

    expect(result).toMatchObject({
      used: false,
      expires_at: expect.any(Date),
      created_at: expect.any(Date),
      updated_at: expect.any(Date),
    });
    expect(database.query).toHaveBeenCalledTimes(1);
    expect(email.triggerSend).not.toHaveBeenCalled();
  });

  it("CT3: e-mail inexistente → retorna fake (anti-enumeração)", async () => {
    user.findOneByEmail.mockRejectedValueOnce(new NotFoundErrorReal({ key: "email" }));

    const result = await requestPasswordRecovery({ email: "naoexiste@x.com" });

    expect(result).toMatchObject({
      used: false,
      expires_at: expect.any(Date),
      created_at: expect.any(Date),
      updated_at: expect.any(Date),
    });
    expect(database.query).not.toHaveBeenCalled();
    expect(email.triggerSend).not.toHaveBeenCalled();
  });

  it("CT4: erro genérico com key=email → propaga", async () => {
    const e = new Error("generic");
    e.key = "email";
    user.findOneByEmail.mockRejectedValueOnce(e);

    await expect(requestPasswordRecovery({ email: "x@y.com" })).rejects.toBe(e);

    expect(database.query).not.toHaveBeenCalled();
    expect(email.triggerSend).not.toHaveBeenCalled();
  });

  it("CT5: NotFoundError com key != 'email' → propaga", async () => {
    user.findOneByUsername.mockRejectedValueOnce(new NotFoundErrorReal({ key: "username" }));

    await expect(requestPasswordRecovery({ username: "abc" })).rejects.toBeInstanceOf(NotFoundErrorReal);

    expect(database.query).not.toHaveBeenCalled();
    expect(email.triggerSend).not.toHaveBeenCalled();
  });
});
