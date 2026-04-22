/**
 * Role-Based Access Control (RBAC) tests
 *
 * Verifies that every server action enforces the correct role permissions:
 *
 *   admin        — full access
 *   representante — same as admin EXCEPT cannot manage users or print nota
 *   captain       — can only access their own work orders; cannot delete, manage
 *                   users, or send emails
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Shared session fixtures ───────────────────────────────────────────────────

const adminSession    = { user: { id: "admin-1",   role: "admin",          email: "admin@test.com" } };
const repSession      = { user: { id: "rep-1",     role: "representante",  email: "rep@test.com"   } };
const captainSession  = { user: { id: "captain-1", role: "captain",        email: "cap@test.com"   } };

const mockOrder = {
  id: 1,
  nombre: "Juan",
  apellido: "Pérez",
  captainId: "captain-1",
  receipts: [{ id: "r1", url: "https://example.com/work-orders/1/hielo-123.jpg" }],
};

// ─── Module mocks ──────────────────────────────────────────────────────────────

vi.mock("@/lib/prisma-client/client", () => ({
  Prisma: {
    Decimal: class MockDecimal {
      _val: unknown;
      constructor(val: unknown) { this._val = val; }
      toString() { return String(this._val); }
    },
  },
}));

vi.mock("@/lib/db", () => ({
  default: {
    workOrder: {
      create:     vi.fn().mockResolvedValue(mockOrder),
      findMany:   vi.fn().mockResolvedValue([mockOrder]),
      findUnique: vi.fn().mockResolvedValue(mockOrder),
      update:     vi.fn().mockResolvedValue(mockOrder),
      delete:     vi.fn().mockResolvedValue(mockOrder),
    },
    user: {
      findMany:  vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
      delete:    vi.fn().mockResolvedValue({}),
      update:    vi.fn().mockResolvedValue({}),
    },
    receipt: {
      create: vi.fn().mockResolvedValue({ id: "r1", url: "https://example.com/1.jpg" }),
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn().mockResolvedValue(adminSession),
    },
  },
}));

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// R2 delete — prevents real network calls
vi.mock("@/lib/r2-client", () => ({
  uploadPhotoToR2:      vi.fn().mockResolvedValue({ success: true, url: "https://example.com/1.jpg" }),
  deleteReceiptsFromR2: vi.fn().mockResolvedValue(undefined),
}));

// Resend — prevents real email sends
vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: vi.fn().mockResolvedValue({ data: { id: "email-1" }, error: null }),
    },
  })),
}));

// ReceiptEmail component — not needed for role checks
vi.mock("@/components/emails/ReceiptEmail", () => ({
  ReceiptEmail: vi.fn().mockReturnValue(null),
}));

// fs — avoid reading logo file from disk
vi.mock("fs", () => ({
  default: {
    existsSync:   vi.fn().mockReturnValue(false),
    readFileSync: vi.fn().mockReturnValue(Buffer.from("logo")),
  },
  existsSync:   vi.fn().mockReturnValue(false),
  readFileSync: vi.fn().mockReturnValue(Buffer.from("logo")),
}));

// react/jsx-runtime — needed by email template mock
vi.mock("react/jsx-runtime", () => ({
  jsx: vi.fn(),
  jsxs: vi.fn(),
  Fragment: Symbol("Fragment"),
}));

// ─── Helpers ───────────────────────────────────────────────────────────────────

async function setSession(session: typeof adminSession) {
  const { auth } = await import("@/lib/auth");
  vi.mocked(auth.api.getSession).mockResolvedValueOnce(session as any);
}

const emailPayload = {
  folio: "1001",
  fecha: "01/01/2025",
  cliente: "Test Client",
  concepto: "Charter",
  total: 5000,
  deposito: 2500,
  balance: 2500,
  formaPago: "Efectivo",
  recibio: "Jim",
  email: "client@test.com",
};

// ─── deleteWorkOrder ───────────────────────────────────────────────────────────

describe("deleteWorkOrder — role access", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { auth } = await import("@/lib/auth");
    const prisma = (await import("@/lib/db")).default;
    vi.mocked(auth.api.getSession).mockResolvedValue(adminSession as any);
    vi.mocked(prisma.workOrder.findUnique).mockResolvedValue(mockOrder as any);
  });

  it("admin can delete a work order", async () => {
    await setSession(adminSession);
    vi.mocked((await import("@/lib/db")).default.workOrder.findUnique).mockResolvedValueOnce(mockOrder as any);
    const { deleteWorkOrder } = await import("@/app/actions/work-order");
    const result = await deleteWorkOrder(1);
    expect(result.success).toBe(true);
  });

  it("representante can delete a work order", async () => {
    await setSession(repSession);
    vi.mocked((await import("@/lib/db")).default.workOrder.findUnique).mockResolvedValueOnce(mockOrder as any);
    const { deleteWorkOrder } = await import("@/app/actions/work-order");
    const result = await deleteWorkOrder(1);
    expect(result.success).toBe(true);
  });

  it("captain cannot delete a work order", async () => {
    await setSession(captainSession);
    const { deleteWorkOrder } = await import("@/app/actions/work-order");
    const result = await deleteWorkOrder(1);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/unauthorized/i);
  });
});

// ─── getWorkOrder — captain own-order restriction ──────────────────────────────

describe("getWorkOrder — captain own-order restriction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("captain can access their own order", async () => {
    await setSession(captainSession);
    vi.mocked((await import("@/lib/db")).default.workOrder.findUnique).mockResolvedValueOnce({
      ...mockOrder,
      captainId: "captain-1",
    } as any);
    const { getWorkOrder } = await import("@/app/actions/work-order");
    const result = await getWorkOrder(1);
    expect(result.success).toBe(true);
  });

  it("captain cannot access another captain's order", async () => {
    await setSession(captainSession);
    vi.mocked((await import("@/lib/db")).default.workOrder.findUnique).mockResolvedValueOnce({
      ...mockOrder,
      captainId: "other-captain-99",
    } as any);
    const { getWorkOrder } = await import("@/app/actions/work-order");
    const result = await getWorkOrder(1);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/autorización/i);
  });

  it("admin can access any order", async () => {
    await setSession(adminSession);
    vi.mocked((await import("@/lib/db")).default.workOrder.findUnique).mockResolvedValueOnce({
      ...mockOrder,
      captainId: "some-other-captain",
    } as any);
    const { getWorkOrder } = await import("@/app/actions/work-order");
    const result = await getWorkOrder(1);
    expect(result.success).toBe(true);
  });

  it("representante can access any order", async () => {
    await setSession(repSession);
    vi.mocked((await import("@/lib/db")).default.workOrder.findUnique).mockResolvedValueOnce({
      ...mockOrder,
      captainId: "some-other-captain",
    } as any);
    const { getWorkOrder } = await import("@/app/actions/work-order");
    const result = await getWorkOrder(1);
    expect(result.success).toBe(true);
  });
});

// ─── sendReceiptEmail ──────────────────────────────────────────────────────────

describe("sendReceiptEmail — role access", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("admin can send receipt email", async () => {
    await setSession(adminSession);
    const { sendReceiptEmail } = await import("@/app/actions/email");
    const result = await sendReceiptEmail(emailPayload);
    expect(result.success).toBe(true);
  });

  it("representante can send receipt email", async () => {
    await setSession(repSession);
    const { sendReceiptEmail } = await import("@/app/actions/email");
    const result = await sendReceiptEmail(emailPayload);
    expect(result.success).toBe(true);
  });

  it("captain cannot send receipt email", async () => {
    await setSession(captainSession);
    const { sendReceiptEmail } = await import("@/app/actions/email");
    const result = await sendReceiptEmail(emailPayload);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/unauthorized/i);
  });
});

// ─── createUser ───────────────────────────────────────────────────────────────

describe("createUser — role access", () => {
  const newUser = {
    nombre: "Ana",
    apellido: "García",
    email: "ana@test.com",
    cell: "3221234567",
    password: "secret123",
    role: "captain" as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("representante cannot create users", async () => {
    await setSession(repSession);
    const { createUser } = await import("@/app/actions/createUser");
    const result = await createUser(newUser);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/unauthorized/i);
  });

  it("captain cannot create users", async () => {
    await setSession(captainSession);
    const { createUser } = await import("@/app/actions/createUser");
    const result = await createUser(newUser);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/unauthorized/i);
  });
});

// ─── getUsers ─────────────────────────────────────────────────────────────────

describe("getUsers — role access", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("admin can list users", async () => {
    await setSession(adminSession);
    vi.mocked((await import("@/lib/db")).default.user.findMany).mockResolvedValueOnce([
      { id: "u1", email: "a@test.com" } as any,
    ]);
    const { getUsers } = await import("@/app/actions/createUser");
    const result = await getUsers();
    expect(result.success).toBe(true);
  });

  it("representante cannot list users", async () => {
    await setSession(repSession);
    const { getUsers } = await import("@/app/actions/createUser");
    const result = await getUsers();
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/unauthorized/i);
  });

  it("captain cannot list users", async () => {
    await setSession(captainSession);
    const { getUsers } = await import("@/app/actions/createUser");
    const result = await getUsers();
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/unauthorized/i);
  });
});

// ─── deleteUser ───────────────────────────────────────────────────────────────

describe("deleteUser — role access", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("admin can delete a user", async () => {
    await setSession(adminSession);
    const { deleteUser } = await import("@/app/actions/createUser");
    const result = await deleteUser("user-99");
    expect(result.success).toBe(true);
  });

  it("representante cannot delete users", async () => {
    await setSession(repSession);
    const { deleteUser } = await import("@/app/actions/createUser");
    const result = await deleteUser("user-99");
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/unauthorized/i);
  });

  it("captain cannot delete users", async () => {
    await setSession(captainSession);
    const { deleteUser } = await import("@/app/actions/createUser");
    const result = await deleteUser("user-99");
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/unauthorized/i);
  });
});

// ─── changeUserPassword ────────────────────────────────────────────────────────

describe("changeUserPassword — role access", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("representante cannot change passwords", async () => {
    await setSession(repSession);
    const { changeUserPassword } = await import("@/app/actions/createUser");
    const result = await changeUserPassword("user-99", "newpass123");
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/unauthorized/i);
  });

  it("captain cannot change passwords", async () => {
    await setSession(captainSession);
    const { changeUserPassword } = await import("@/app/actions/createUser");
    const result = await changeUserPassword("user-99", "newpass123");
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/unauthorized/i);
  });
});
