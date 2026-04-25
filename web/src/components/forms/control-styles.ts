const FORM_CONTROL_BASE_CLASS =
  "h-[50px] w-full rounded-lg border bg-white px-4 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const FORM_CONTROL_DISABLED_CLASS =
  "disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400";

function joinClasses(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

type FormControlClassNameOptions = {
  invalid?: boolean;
  disabled?: boolean;
  shadow?: boolean;
  className?: string;
};

export function getFormControlClassName({
  invalid = false,
  disabled = false,
  shadow = false,
  className,
}: FormControlClassNameOptions = {}) {
  return joinClasses(
    FORM_CONTROL_BASE_CLASS,
    invalid ? "border-red-400" : "border-gray-300",
    disabled && FORM_CONTROL_DISABLED_CLASS,
    shadow && "text-gray-950 shadow-sm",
    className,
  );
}

export function getFormControlWrapperClassName(
  invalid = false,
  className?: string,
) {
  return joinClasses(
    "flex h-[50px] items-center rounded-lg border bg-white pr-4 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100",
    invalid ? "border-red-400" : "border-gray-300",
    className,
  );
}

export const FORM_CONTROL_INNER_INPUT_CLASS =
  "h-full w-full rounded-lg bg-transparent px-4 text-gray-900 outline-none disabled:cursor-not-allowed";

export const FORM_CONTROL_COLOR_SCHEME_CLASS = "[color-scheme:light]";

export const FORM_COLOR_PICKER_WRAPPER_CLASS =
  "flex h-[50px] items-center gap-3 rounded-xl border border-gray-300 bg-white px-4";
