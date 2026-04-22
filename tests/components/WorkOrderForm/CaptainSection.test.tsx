import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm, FormProvider } from "react-hook-form";
import { CaptainSection } from "@/components/WorkOrderForm/CaptainSection";

const captainDefaults = {
  efectivo: false,
  transferir: false,
  pagoRecibo: 0,
  horaLlegado: "",
  combustible: 0,
  hielo: 0,
  aguaBebidas: 0,
  gastoVarios: 0,
  horasExtras: 0,
  horasExtrasEfectivo: false,
  horasExtrasTransferir: false,
  pagoHorasExtra: 0,
  detallesNotas: "",
};

function Wrapper({ defaultValues = {} }: { defaultValues?: Record<string, any> }) {
  const form = useForm({ defaultValues: { ...captainDefaults, ...defaultValues } });
  return (
    <FormProvider {...form}>
      <CaptainSection
        control={form.control}
        canEdit={() => true}
        isCaptain={true}
        mode="captain-edit"
        getReceiptsByGasto={() => []}
        uploading={false}
        handleFileSelect={vi.fn()}
        handlePhotoClick={vi.fn()}
        setValue={form.setValue}
      />
    </FormProvider>
  );
}

// ─── Pagar al Embarque mutual exclusion ────────────────────────────────────────

describe("CaptainSection — Pagar al Embarque mutual exclusion", () => {
  it("checking Efectivo unchecks Transferir", async () => {
    const user = userEvent.setup();
    render(<Wrapper defaultValues={{ efectivo: false, transferir: true }} />);

    // Scope to the "Pagar al Embarque" panel
    const panel = screen.getByText("Pagar al Embarque").closest("div[class]")!;
    const [efectivoBox, transferirBox] = within(panel).getAllByRole("checkbox");

    await user.click(efectivoBox);

    expect(efectivoBox).toBeChecked();
    expect(transferirBox).not.toBeChecked();
  });

  it("checking Transferir unchecks Efectivo", async () => {
    const user = userEvent.setup();
    render(<Wrapper defaultValues={{ efectivo: true, transferir: false }} />);

    const panel = screen.getByText("Pagar al Embarque").closest("div[class]")!;
    const [efectivoBox, transferirBox] = within(panel).getAllByRole("checkbox");

    await user.click(transferirBox);

    expect(transferirBox).toBeChecked();
    expect(efectivoBox).not.toBeChecked();
  });

  it("both can be unchecked simultaneously", async () => {
    const user = userEvent.setup();
    render(<Wrapper defaultValues={{ efectivo: true, transferir: false }} />);

    const panel = screen.getByText("Pagar al Embarque").closest("div[class]")!;
    const [efectivoBox] = within(panel).getAllByRole("checkbox");

    await user.click(efectivoBox); // uncheck

    expect(efectivoBox).not.toBeChecked();
  });
});

// ─── Pago Horas Extras mutual exclusion ────────────────────────────────────────

describe("CaptainSection — Pago Horas Extras mutual exclusion", () => {
  it("checking horasExtrasEfectivo unchecks horasExtrasTransferir", async () => {
    const user = userEvent.setup();
    render(
      <Wrapper defaultValues={{ horasExtrasEfectivo: false, horasExtrasTransferir: true }} />
    );

    const panel = screen.getByText("Pago Horas Extras").closest("div[class]")!;
    const [efBox, transBox] = within(panel).getAllByRole("checkbox");

    await user.click(efBox);

    expect(efBox).toBeChecked();
    expect(transBox).not.toBeChecked();
  });

  it("checking horasExtrasTransferir unchecks horasExtrasEfectivo", async () => {
    const user = userEvent.setup();
    render(
      <Wrapper defaultValues={{ horasExtrasEfectivo: true, horasExtrasTransferir: false }} />
    );

    const panel = screen.getByText("Pago Horas Extras").closest("div[class]")!;
    const [efBox, transBox] = within(panel).getAllByRole("checkbox");

    await user.click(transBox);

    expect(transBox).toBeChecked();
    expect(efBox).not.toBeChecked();
  });
});

// ─── Field disabled states ──────────────────────────────────────────────────

describe("CaptainSection — field disabled states", () => {
  function DisabledWrapper() {
    const form = useForm({ defaultValues: captainDefaults });
    return (
      <FormProvider {...form}>
        <CaptainSection
          control={form.control}
          canEdit={() => false}
          isCaptain={false}
          mode={undefined} // avoids triggering the "admin-edit || captain-edit" camera condition
          getReceiptsByGasto={() => []}
          uploading={false}
          handleFileSelect={vi.fn()}
          handlePhotoClick={vi.fn()}
          setValue={form.setValue}
        />
      </FormProvider>
    );
  }

  it("disables all checkboxes when canEdit returns false", () => {
    render(<DisabledWrapper />);
    const checkboxes = screen.getAllByRole("checkbox");
    checkboxes.forEach((cb) => expect(cb).toBeDisabled());
  });

  it("disables all number inputs when canEdit returns false", () => {
    render(<DisabledWrapper />);
    const spinbuttons = screen.getAllByRole("spinbutton");
    spinbuttons.forEach((input) => expect(input).toBeDisabled());
  });

  it("hides camera icons when isCaptain=false", () => {
    render(<DisabledWrapper />);
    expect(document.querySelectorAll('input[type="file"]')).toHaveLength(0);
  });
});
