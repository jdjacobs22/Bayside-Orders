import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSession = {
  user: { id: "admin-1", role: "admin", email: "admin@test.com" },
};
const mockCaptainSession = {
  user: { id: "captain-1", role: "captain", email: "cap@test.com" },
};

const mockOrder = {
  id: 1,
  nombre: "Juan",
  apellido: "Pérez",
  captainId: "captain-1",
  receipts: [],
};

vi.mock("@/lib/prisma-client/client", () => ({
  Prisma: {
    Decimal: class MockDecimal {
      _val: unknown;
      constructor(val: unknown) {
        this._val = val;
      }
      toString() {
        return String(this._val);
      }
    },
  },
}));

vi.mock("@/lib/db", () => ({
  default: {
    workOrder: {
      create: vi.fn().mockResolvedValue(mockOrder),
      findMany: vi.fn().mockResolvedValue([mockOrder]),
      findUnique: vi.fn().mockResolvedValue(mockOrder),
      update: vi.fn().mockResolvedValue(mockOrder),
      delete: vi.fn().mockResolvedValue(mockOrder),
    },
    user: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
    },
    receipt: {
      create: vi.fn().mockResolvedValue({ id: 1, url: "https://example.com/1.jpg" }),
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn().mockResolvedValue(mockSession),
    },
  },
}));

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const validAdminData = {
  nombre: "Juan",
  apellido: "Pérez",
  email: "juan@test.com",
  cell: "1234567890",
  cliente: "Maria Lopez",
  clienteCell: "0987654321",
  clienteEmail: "maria@test.com",
  fechaEmbarque: "15/03/2025",
  horaEmbarque: "14:30",
  destino: "Yelapa",
  puntoEncuentro: "Marina Vallarta",
  pasajeros: 4,
  horasAcordadas: 6,
  tarifaHora: 1500,
  deposito: 3000,
  pagoCapitana: 4000,
  pagoMarinero: 1000,
};

describe("work-order actions", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { auth } = await import("@/lib/auth");
    const prisma = (await import("@/lib/db")).default;
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as any);
    vi.mocked(prisma.workOrder.findUnique).mockResolvedValue(mockOrder as any);
    vi.mocked(prisma.workOrder.create).mockResolvedValue(mockOrder as any);
    vi.mocked(prisma.workOrder.update).mockResolvedValue(mockOrder as any);
    vi.mocked(prisma.workOrder.findMany).mockResolvedValue([mockOrder] as any);
  });

  describe("getWorkOrder", () => {
    it("returns error for invalid id", async () => {
      const { getWorkOrder } = await import("@/app/actions/work-order");
      const result = await getWorkOrder(0);
      expect(result.success).toBe(false);
      expect(result.error).toContain("ID de orden inválido");
    });

    it("returns error when order does not exist", async () => {
      const prisma = (await import("@/lib/db")).default;
      vi.mocked(prisma.workOrder.findUnique).mockResolvedValueOnce(null);

      const { getWorkOrder } = await import("@/app/actions/work-order");
      const result = await getWorkOrder(999);
      expect(result.success).toBe(false);
      expect(result.error).toContain("La orden #999 no existe");
    });

    it("returns error when captain accesses another captain order", async () => {
      const { auth } = await import("@/lib/auth");
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockCaptainSession as any);

      const prisma = (await import("@/lib/db")).default;
      vi.mocked(prisma.workOrder.findUnique).mockResolvedValueOnce({
        ...mockOrder,
        captainId: "other-captain-id",
      } as any);

      const { getWorkOrder } = await import("@/app/actions/work-order");
      const result = await getWorkOrder(1);
      expect(result.success).toBe(false);
      expect(result.error).toContain("No tienes autorización");
    });

    it("returns order for authorized admin", async () => {
      const prisma = (await import("@/lib/db")).default;
      vi.mocked(prisma.workOrder.findUnique).mockResolvedValueOnce(mockOrder as any);

      const { getWorkOrder } = await import("@/app/actions/work-order");
      const result = await getWorkOrder(1);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });

  describe("createWorkOrder", () => {
    it("returns validation error for invalid data", async () => {
      const { createWorkOrder } = await import("@/app/actions/work-order");
      const result = await createWorkOrder({ nombre: "" }, "admin");
      expect(result.success).toBe(false);
      expect(result.error).toContain("Validación fallida");
    });

    it("creates order with valid admin data", async () => {
      const prisma = (await import("@/lib/db")).default;
      const { createWorkOrder } = await import("@/app/actions/work-order");
      const result = await createWorkOrder(validAdminData, "admin");
      expect(result.success).toBe(true);
      expect(prisma.workOrder.create).toHaveBeenCalled();
    });
  });

  describe("getClientApellidosByNombre", () => {
    it("returns empty array for empty nombre", async () => {
      const { getClientApellidosByNombre } = await import("@/app/actions/work-order");
      const result = await getClientApellidosByNombre("");
      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it("returns apellidos from users", async () => {
      const prisma = (await import("@/lib/db")).default;
      vi.mocked(prisma.user.findMany).mockResolvedValueOnce([
        { apellido: "García" },
        { apellido: "Lopez" },
      ] as any);

      const { getClientApellidosByNombre } = await import("@/app/actions/work-order");
      const result = await getClientApellidosByNombre("Juan");
      expect(result.success).toBe(true);
      expect(result.data).toContain("García");
      expect(result.data).toContain("Lopez");
    });
  });

  describe("getClientDetails", () => {
    it("returns error when nombre or apellido missing", async () => {
      const { getClientDetails } = await import("@/app/actions/work-order");
      const result = await getClientDetails("", "García");
      expect(result.success).toBe(false);
      expect(result.error).toContain("Missing");
    });

    it("returns client data when found", async () => {
      const prisma = (await import("@/lib/db")).default;
      const clientData = { id: "1", email: "j@test.com", cell: "123" };
      vi.mocked(prisma.user.findFirst).mockResolvedValueOnce(clientData as any);

      const { getClientDetails } = await import("@/app/actions/work-order");
      const result = await getClientDetails("Juan", "García");
      expect(result.success).toBe(true);
      expect(result.data).toEqual(clientData);
    });
  });

  describe("getUniqueNombresFromUsers", () => {
    it("returns sorted unique nombres", async () => {
      const prisma = (await import("@/lib/db")).default;
      vi.mocked(prisma.user.findMany).mockResolvedValueOnce([
        { nombre: "Ana" },
        { nombre: "Juan" },
        { nombre: "Ana" },
      ] as any);

      const { getUniqueNombresFromUsers } = await import("@/app/actions/work-order");
      const result = await getUniqueNombresFromUsers();
      expect(result.success).toBe(true);
      expect(result.data).toEqual(["Ana", "Juan"]);
    });
  });
});
