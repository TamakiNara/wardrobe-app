"use client";

type FieldLabelProps = {
  as?: "label" | "div";
  htmlFor?: string;
  label: string;
  required?: boolean;
  className?: string;
};

export default function FieldLabel({
  as = "label",
  htmlFor,
  label,
  required = false,
  className = "mb-1",
}: FieldLabelProps) {
  const classes = `flex items-center gap-2 text-sm font-medium text-gray-700 ${className}`;

  if (as === "div") {
    return (
      <div className={classes}>
        <span>{label}</span>
        {required ? (
          <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-600">
            必須
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <label htmlFor={htmlFor} className={classes}>
      <span>{label}</span>
      {required ? (
        <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-600">
          必須
        </span>
      ) : null}
    </label>
  );
}
