import type {
  AnalyzeFrameRequest,
  AnalyzeFrameResponse,
  DebriefRequest,
  DebriefResponse,
  ProcedureDefinition,
} from "@/lib/types";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1"
).replace(/\/$/, "");

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const fallbackMessage = `Request failed with status ${response.status}.`;

    try {
      const data = (await response.json()) as { detail?: string };
      throw new Error(data.detail ?? fallbackMessage);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }

      throw new Error(fallbackMessage);
    }
  }

  return (await response.json()) as T;
}

export async function getProcedure(procedureId: string): Promise<ProcedureDefinition> {
  const response = await fetch(`${API_BASE_URL}/procedures/${procedureId}`, {
    cache: "no-store",
  });

  return readJson<ProcedureDefinition>(response);
}

export async function analyzeFrame(
  payload: AnalyzeFrameRequest,
): Promise<AnalyzeFrameResponse> {
  const response = await fetch(`${API_BASE_URL}/analyze-frame`, {
    body: JSON.stringify(payload),
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  return readJson<AnalyzeFrameResponse>(response);
}

export async function generateDebrief(
  payload: DebriefRequest,
): Promise<DebriefResponse> {
  const response = await fetch(`${API_BASE_URL}/debrief`, {
    body: JSON.stringify(payload),
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  return readJson<DebriefResponse>(response);
}
