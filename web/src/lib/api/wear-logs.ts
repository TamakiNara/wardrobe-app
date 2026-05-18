import { apiFetch } from "@/lib/api/client";
import type {
  WearLogFeedbackUpdatePayload,
  WearLogMutationResponse,
} from "@/types/wear-logs";

export async function updateWearLogFeedback(
  id: number | string,
  payload: WearLogFeedbackUpdatePayload,
): Promise<WearLogMutationResponse> {
  return apiFetch<WearLogMutationResponse>(`/api/wear-logs/${id}/feedback`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}
