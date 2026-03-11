import TshirtPreviewSvg from "./tshirt-preview-svg";

type TopsPreviewSvgProps = {
  shape?: string;
  sleeve?: string;
  design?: string;
  fit?: string;
  mainColor?: string;
  subColor?: string;
};

export default function TopsPreviewSvg({
  shape,
  sleeve,
  design,
  fit,
  mainColor,
  subColor,
}: TopsPreviewSvgProps) {
  if (!shape) return null;

  if (shape === "tshirt") {
    return (
      <TshirtPreviewSvg
        mainColor={mainColor ?? "#CBD5E1"}
        subColor={subColor}
        sleeve={sleeve}
        design={design}
        fit={fit}
      />
    );
  }

  return (
    <div className="text-center">
      <div
        className="mx-auto h-16 w-16 rounded-2xl border border-gray-300"
        style={{ backgroundColor: mainColor ?? "#E5E7EB" }}
      />
      {subColor && (
        <div
          className="mt-2 ml-auto h-4 w-4 rounded-full border border-gray-300"
          style={{ backgroundColor: subColor }}
        />
      )}
      <p className="mt-2 text-xs text-gray-500">SVG準備中</p>
    </div>
  );
}
