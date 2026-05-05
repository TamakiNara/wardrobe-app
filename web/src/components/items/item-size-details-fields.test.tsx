// @vitest-environment jsdom

import React, { act } from "react";
import ReactDOM from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import ItemSizeDetailsFields from "@/components/items/item-size-details-fields";
import type {
  EditableCustomSizeField,
  EditableSizeDetailValue,
  StructuredSizeFieldDefinition,
} from "@/lib/items/size-details";
import type { StructuredSizeFieldName } from "@/types/items";

const structuredSizeFieldDefinitions: StructuredSizeFieldDefinition[] = [
  { name: "shoulder_width", label: "肩幅" },
];

function createStructuredSizeValues(
  overrides: Partial<
    Record<StructuredSizeFieldName, EditableSizeDetailValue>
  > = {},
): Partial<Record<StructuredSizeFieldName, EditableSizeDetailValue>> {
  return overrides;
}

function createCustomSizeField(
  overrides: Partial<EditableCustomSizeField> = {},
): EditableCustomSizeField {
  return {
    id: "custom-1",
    label: "袖口",
    value: "",
    min: "",
    max: "",
    note: "",
    ...overrides,
  };
}

function renderFields({
  structuredSizeValues = createStructuredSizeValues(),
  customSizeFields = [] as EditableCustomSizeField[],
}: {
  structuredSizeValues?: Partial<
    Record<StructuredSizeFieldName, EditableSizeDetailValue>
  >;
  customSizeFields?: EditableCustomSizeField[];
} = {}) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = ReactDOM.createRoot(container);

  act(() => {
    root.render(
      <ItemSizeDetailsFields
        structuredSizeFieldDefinitions={structuredSizeFieldDefinitions}
        structuredSizeValues={structuredSizeValues}
        customSizeFields={customSizeFields}
        hasDuplicateWarnings={false}
        onAddCustomSizeField={() => {}}
        onUpdateStructuredSizeValue={() => {}}
        onUpdateCustomSizeField={() => {}}
        onRemoveCustomSizeField={() => {}}
      />,
    );
  });

  const expandButton = container.querySelector(
    'button[aria-expanded="false"]',
  ) as HTMLButtonElement | null;
  act(() => {
    expandButton?.click();
  });

  return { container, root };
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("ItemSizeDetailsFields", () => {
  it("min / max が未入力の項目では範囲入力を初期表示しない", () => {
    const { container, root } = renderFields({
      structuredSizeValues: createStructuredSizeValues({
        shoulder_width: { value: "", min: "", max: "", note: "" },
      }),
    });

    expect(container.textContent).toContain("範囲も入力する");
    expect(
      container.querySelector('input[id="structured-size-shoulder_width-min"]'),
    ).toBeNull();
    expect(
      container.querySelector('input[id="structured-size-shoulder_width-max"]'),
    ).toBeNull();

    act(() => {
      root.unmount();
    });
  });

  it("範囲も入力するを押すと範囲入力を表示する", () => {
    const { container, root } = renderFields({
      structuredSizeValues: createStructuredSizeValues({
        shoulder_width: { value: "", min: "", max: "", note: "" },
      }),
    });

    const rangeToggle = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("範囲も入力する"),
    ) as HTMLButtonElement | undefined;

    act(() => {
      rangeToggle?.click();
    });

    expect(
      container.querySelector('input[id="structured-size-shoulder_width-min"]'),
    ).not.toBeNull();
    expect(
      container.querySelector('input[id="structured-size-shoulder_width-max"]'),
    ).not.toBeNull();
    expect(container.textContent).toContain("範囲入力を閉じる");

    act(() => {
      root.unmount();
    });
  });

  it("既存の範囲値がある項目は初期から範囲入力を表示する", () => {
    const { container, root } = renderFields({
      customSizeFields: [
        createCustomSizeField({
          min: "32",
          max: "35",
        }),
      ],
    });

    const minInput = container.querySelector(
      'input[placeholder="最小"]',
    ) as HTMLInputElement | null;
    const maxInput = container.querySelector(
      'input[placeholder="最大"]',
    ) as HTMLInputElement | null;

    expect(minInput?.value).toBe("32");
    expect(maxInput?.value).toBe("35");
    expect(container.textContent).toContain("範囲入力を閉じる");

    act(() => {
      root.unmount();
    });
  });

  it("自由項目でも範囲入力を開閉できる", () => {
    const { container, root } = renderFields({
      customSizeFields: [createCustomSizeField()],
    });

    const customToggle = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("範囲も入力する"),
    ) as HTMLButtonElement | undefined;

    expect(customToggle).toBeDefined();

    act(() => {
      customToggle?.click();
    });

    expect(container.querySelector('input[placeholder="最小"]')).not.toBeNull();
    expect(container.querySelector('input[placeholder="最大"]')).not.toBeNull();

    const closeToggle = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("範囲入力を閉じる"),
    ) as HTMLButtonElement | undefined;

    act(() => {
      closeToggle?.click();
    });

    expect(container.querySelector('input[placeholder="最小"]')).toBeNull();
    expect(container.querySelector('input[placeholder="最大"]')).toBeNull();

    act(() => {
      root.unmount();
    });
  });
});
