/**
 * R2 receipt cleanup tests
 *
 * Verifies that deleteWorkOrder removes photos from Cloudflare R2
 * in addition to the database record.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Session fixture ───────────────────────────────────────────────────────────

const adminSession = { user: { id: "admin-1", role: "admin", email: "admin@test.com" } };

// ─── Receipt fixtures ──────────────────────────────────────────────────────────

const URL_A = "https://r2.example.com/work-orders/1/combustible-111-aaa.jpg";
const URL_B = "https://r2.example.com/work-orders/1/hielo-222-bbb.jpg";

const orderWithReceipts = {
  id: 1,
  nombre: "Juan",
  captainId: "captain-1",
  receipts: [
    { id: "r1", url: URL_A },
    { id: "r2", url: URL_B },
  ],
};

const orderWithNoReceipts = {
  ...orderWithReceipts,
  receipts: [],
};

// ─── Module mocks ──────────────────────────────────────────────────────────────

vi.mock("@/lib/prisma-client/client", () => ({
  Prisma: {
    Decimal: class {
      _v: unknown;
      constructor(v: unknown) { this._v = v; }
      toString() { return String(this._v); }
    },
  },
}));

vi.mock("@/lib/db", () => ({
  default: {
    workOrder: {
      findUnique: vi.fn().mockResolvedValue(orderWithReceipts),
      delete:     vi.fn().mockResolvedValue(orderWithReceipts),
    },
    user: {
      findMany:  vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
    },
    receipt: {
      create: vi.fn(),
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

// The key mock — lets us assert what URLs were passed to R2 deletion
vi.mock("@/lib/r2-client", () => ({
  uploadPhotoToR2:      vi.fn().mockResolvedValue({ success: true }),
  deleteReceiptsFromR2: vi.fn().mockResolvedValue(undefined),
}));

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe("deleteWorkOrder — R2 receipt cleanup", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Reset to happy-path defaults after each clearAllMocks
    const { auth } = await import("@/lib/auth");
    vi.mocked(auth.api.getSession).mockResolvedValue(adminSession as any);

    const prisma = (await import("@/lib/db")).default;
    vi.mocked(prisma.workOrder.findUnique).mockResolvedValue(orderWithReceipts as any);
    vi.mocked(prisma.workOrder.delete).mockResolvedValue(orderWithReceipts as any);
  });

  it("calls deleteReceiptsFromR2 with the receipt URLs from the order", async () => {
    const { deleteReceiptsFromR2 } = await import("@/lib/r2-client");
    const { deleteWorkOrder } = await import("@/app/actions/work-order");

    await deleteWorkOrder(1);

    expect(deleteReceiptsFromR2).toHaveBeenCalledOnce();
    expect(deleteReceiptsFromR2).toHaveBeenCalledWith([URL_A, URL_B]);
  });

  it("calls deleteReceiptsFromR2 with an empty array when the order has no receipts", async () => {
    const prisma = (await import("@/lib/db")).default;
    vi.mocked(prisma.workOrder.findUnique).mockResolvedValueOnce(orderWithNoReceipts as any);

    const { deleteReceiptsFromR2 } = await import("@/lib/r2-client");
    const { deleteWorkOrder } = await import("@/app/actions/work-order");

    await deleteWorkOrder(1);

    expect(deleteReceiptsFromR2).toHaveBeenCalledOnce();
    expect(deleteReceiptsFromR2).toHaveBeenCalledWith([]);
  });

  it("deletes the DB record after calling deleteReceiptsFromR2", async () => {
    const { deleteReceiptsFromR2 } = await import("@/lib/r2-client");
    const prisma = (await import("@/lib/db")).default;
    const { deleteWorkOrder } = await import("@/app/actions/work-order");

    const callOrder: string[] = [];
    vi.mocked(deleteReceiptsFromR2).mockImplementationOnce(async () => {
      callOrder.push("r2");
    });
    vi.mocked(prisma.workOrder.delete).mockImplementationOnce(async () => {
      callOrder.push("db");
      return orderWithReceipts as any;
    });

    const result = await deleteWorkOrder(1);

    expect(result.success).toBe(true);
    expect(callOrder).toEqual(["r2", "db"]); // R2 deletion happens first
    expect(prisma.workOrder.delete).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  it("does not call deleteReceiptsFromR2 when the order does not exist", async () => {
    const prisma = (await import("@/lib/db")).default;
    vi.mocked(prisma.workOrder.findUnique).mockResolvedValueOnce(null);

    const { deleteReceiptsFromR2 } = await import("@/lib/r2-client");
    const { deleteWorkOrder } = await import("@/app/actions/work-order");

    const result = await deleteWorkOrder(1);

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/not found/i);
    expect(deleteReceiptsFromR2).not.toHaveBeenCalled();
  });
});
