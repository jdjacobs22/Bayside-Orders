import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { CaptainSelect } from "@/components/CaptainSelect";

const mockCaptains = [
  { id: "cap-1", nombre: "Ana", apellido: "García", role: "captain", cell: "111" },
  { id: "cap-2", nombre: "Luis", apellido: "López", role: "captain", cell: "222" },
];

describe("CaptainSelect", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ users: mockCaptains }),
      })
    );
  });

  it("shows loading state initially", () => {
    render(<CaptainSelect onValueChange={() => {}} />);
    expect(screen.getByText(/Cargando capitanes/)).toBeInTheDocument();
  });

  it("fetches captains from API and renders select after load", async () => {
    render(<CaptainSelect onValueChange={() => {}} />);
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/users?role=captain");
    });
    await waitFor(() => {
      expect(screen.queryByText(/Cargando capitanes/)).not.toBeInTheDocument();
    });
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("shows placeholder when no value selected", async () => {
    render(<CaptainSelect onValueChange={() => {}} value="" />);
    await waitFor(() => {
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });
    expect(screen.getByText(/Seleccionar capitana/)).toBeInTheDocument();
  });
});
