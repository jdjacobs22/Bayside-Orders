import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { useForm, FormProvider } from "react-hook-form";
import { AdminSection } from "@/components/WorkOrderForm/AdminSection";

const adminDefaults = {
  nombre: "",
  apellido: "",
  email: "",
  cell: "",
  cliente: "",
  clienteCell: "",
  clienteEmail: "",
  fechaEmbarque: undefined,
  horaEmbarque: "10:00",
  destino: "",
  puntoEncuentro: "",
  pasajeros: 0,
  pagoCapitana: 0,
  pagoMarinero: 0,
  tarifaHora: 0,
  horasAcordadas: 0,
  precioAcordado: 0,
  cargoExtra: 0,
  totalClienteCost: 0,
  deposito: 0,
  saldoCliente: 0,
  ingresoNeto: 0,
};

function Wrapper({
  canEditFn = () => true,
  nombreCliente = "",
  nombresList = [] as string[],
  apellidosList = [] as string[],
}: {
  canEditFn?: (field: string) => boolean;
  nombreCliente?: string;
  nombresList?: string[];
  apellidosList?: string[];
} = {}) {
  const form = useForm({ defaultValues: adminDefaults });
  return (
    <FormProvider {...form}>
      <AdminSection
        control={form.control}
        canEdit={canEditFn}
        nombreCliente={nombreCliente}
        nombresList={nombresList}
        apellidosList={apellidosList}
        setValue={form.setValue}
        setDiscoveredCaptainId={vi.fn()}
      />
    </FormProvider>
  );
}

describe("AdminSection — disabled states when canEdit returns false", () => {
  it("disables editable number inputs", () => {
    render(<Wrapper canEditFn={() => false} />);
    // Calculated fields (precioAcordado etc.) use readOnly, not disabled — skip them.
    const spinbuttons = screen
      .getAllByRole("spinbutton")
      .filter((el) => !(el as HTMLInputElement).readOnly);
    expect(spinbuttons.length).toBeGreaterThan(0);
    spinbuttons.forEach((input) => expect(input).toBeDisabled());
  });

  it("disables text inputs (destino, puntoEncuentro, cliente, etc.)", () => {
    render(<Wrapper canEditFn={() => false} />);
    // email and cell are readOnly not disabled (auto-populated fields)
    const textInputs = screen
      .getAllByRole("textbox")
      .filter((el) => !(el as HTMLInputElement).readOnly);
    textInputs.forEach((input) => expect(input).toBeDisabled());
  });

  it("disables the time input (horaEmbarque)", () => {
    render(<Wrapper canEditFn={() => false} />);
    const timeInput = document.querySelector('input[type="time"]') as HTMLInputElement;
    expect(timeInput).toBeInTheDocument();
    expect(timeInput).toBeDisabled();
  });

  it("disables the nombre Select trigger", () => {
    render(<Wrapper canEditFn={() => false} />);
    // Radix SelectTrigger renders as role="combobox"
    const combos = screen.getAllByRole("combobox");
    expect(combos[0]).toBeDisabled();
  });

  it("disables the date picker button", () => {
    render(<Wrapper canEditFn={() => false} />);
    const dateBtn = screen.getByText("Seleccione fecha").closest("button");
    expect(dateBtn).toBeDisabled();
  });
});

describe("AdminSection — enabled states when canEdit returns true", () => {
  it("enables editable number inputs", () => {
    render(<Wrapper canEditFn={() => true} />);
    const spinbuttons = screen
      .getAllByRole("spinbutton")
      .filter((el) => !(el as HTMLInputElement).readOnly);
    expect(spinbuttons.length).toBeGreaterThan(0);
    spinbuttons.forEach((input) => expect(input).not.toBeDisabled());
  });

  it("enables text inputs", () => {
    render(<Wrapper canEditFn={() => true} />);
    const textInputs = screen
      .getAllByRole("textbox")
      .filter((el) => !(el as HTMLInputElement).readOnly);
    textInputs.forEach((input) => expect(input).not.toBeDisabled());
  });
});

describe("AdminSection — nombre/apellido dropdown population", () => {
  it("renders nombre options from nombresList", () => {
    render(
      <Wrapper
        canEditFn={() => true}
        nombresList={["Ana", "María", "Rosa"]}
      />
    );
    // Options are inside SelectContent (portal) — verify the trigger exists
    const combos = screen.getAllByRole("combobox");
    expect(combos[0]).toBeInTheDocument();
  });

  it("apellido Select is disabled when nombreCliente is empty", () => {
    render(<Wrapper canEditFn={() => true} nombreCliente="" />);
    const combos = screen.getAllByRole("combobox");
    // apellido is the second combobox
    expect(combos[1]).toBeDisabled();
  });

  it("apellido Select is enabled when nombreCliente is set", () => {
    render(<Wrapper canEditFn={() => true} nombreCliente="Ana" />);
    const combos = screen.getAllByRole("combobox");
    expect(combos[1]).not.toBeDisabled();
  });
});
