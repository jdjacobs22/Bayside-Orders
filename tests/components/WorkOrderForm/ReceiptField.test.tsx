import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { useForm, FormProvider } from "react-hook-form";
import { FormField } from "@/components/ui/form";
import { ReceiptField } from "@/components/WorkOrderForm/ReceiptField";

const mockReceipts = [
  { url: "https://cdn.example.com/receipt-1.jpg", gastoType: "hielo" },
  { url: "https://cdn.example.com/receipt-2.jpg", gastoType: "hielo" },
];

function Wrapper({
  receipts = [] as typeof mockReceipts,
  showCamera = false,
  disabled = false,
  uploading = false,
  onPhotoClick = vi.fn(),
  onFileSelect = vi.fn(),
} = {}) {
  const form = useForm({ defaultValues: { hielo: 0 } });
  return (
    <FormProvider {...form}>
      <form>
        <FormField
          control={form.control}
          name="hielo"
          render={({ field }) => (
            <ReceiptField
              label="Hielo"
              field={field}
              gastoType="hielo"
              receipts={receipts}
              disabled={disabled}
              showCamera={showCamera}
              uploading={uploading}
              onFileSelect={onFileSelect}
              onPhotoClick={onPhotoClick}
            />
          )}
        />
      </form>
    </FormProvider>
  );
}

describe("ReceiptField — camera icon visibility", () => {
  it("shows camera icon when showCamera is true", () => {
    render(<Wrapper showCamera={true} />);
    // Camera input is hidden but its label/wrapper exists
    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();
  });

  it("hides camera icon when showCamera is false", () => {
    render(<Wrapper showCamera={false} />);
    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).not.toBeInTheDocument();
  });

  it("disables the file input when uploading is true", () => {
    render(<Wrapper showCamera={true} uploading={true} />);
    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    expect(fileInput).toBeDisabled();
  });

  it("enables the file input when uploading is false", () => {
    render(<Wrapper showCamera={true} uploading={false} />);
    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    expect(fileInput).not.toBeDisabled();
  });
});

describe("ReceiptField — number input disabled state", () => {
  it("disables the number input when disabled=true", () => {
    render(<Wrapper disabled={true} />);
    const input = screen.getByRole("spinbutton");
    expect(input).toBeDisabled();
  });

  it("enables the number input when disabled=false", () => {
    render(<Wrapper disabled={false} />);
    const input = screen.getByRole("spinbutton");
    expect(input).not.toBeDisabled();
  });
});

describe("ReceiptField — receipt thumbnails", () => {
  it("renders no thumbnails when receipts is empty", () => {
    render(<Wrapper receipts={[]} />);
    expect(screen.queryAllByRole("img")).toHaveLength(0);
  });

  it("renders one thumbnail per receipt", () => {
    render(<Wrapper receipts={mockReceipts} />);
    expect(screen.getAllByRole("img")).toHaveLength(2);
  });

  it("renders each thumbnail with the correct src URL", () => {
    render(<Wrapper receipts={mockReceipts} />);
    const imgs = screen.getAllByRole("img") as HTMLImageElement[];
    expect(imgs[0].src).toBe("https://cdn.example.com/receipt-1.jpg");
    expect(imgs[1].src).toBe("https://cdn.example.com/receipt-2.jpg");
  });

  it("calls onPhotoClick with the receipt URL when thumbnail is clicked", async () => {
    const onPhotoClick = vi.fn();
    const { getByRole } = render(
      <Wrapper receipts={[mockReceipts[0]]} onPhotoClick={onPhotoClick} />
    );
    const button = getByRole("button");
    button.click();
    expect(onPhotoClick).toHaveBeenCalledWith(mockReceipts[0].url);
  });
});
