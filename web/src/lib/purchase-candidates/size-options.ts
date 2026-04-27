export type SwappablePurchaseCandidateSizeCandidate<TDetails> = {
  label: string;
  note: string;
  details: TDetails;
};

export function swapPurchaseCandidateSizeCandidates<TDetails>(
  primary: SwappablePurchaseCandidateSizeCandidate<TDetails>,
  alternate: SwappablePurchaseCandidateSizeCandidate<TDetails>,
) {
  return {
    primary: {
      label: alternate.label,
      note: alternate.note,
      details: alternate.details,
    },
    alternate: {
      label: primary.label,
      note: primary.note,
      details: primary.details,
    },
  };
}
