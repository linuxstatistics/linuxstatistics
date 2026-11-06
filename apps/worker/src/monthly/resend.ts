import type { FetchLike } from "../http.js";

export interface BroadcastDraft {
  segmentId: string;
  from: string;
  subject: string;
  html: string;
  text: string;
  name: string;
}

/**
 * Create a Resend Broadcast as a DRAFT (no `send` flag). The owner reviews and
 * sends it from the Resend dashboard. Returns the broadcast id.
 */
export async function createBroadcastDraft(
  draft: BroadcastDraft,
  apiKey: string,
  doFetch: FetchLike = fetch,
): Promise<string> {
  const res = await doFetch("https://api.resend.com/broadcasts", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      segment_id: draft.segmentId,
      from: draft.from,
      subject: draft.subject,
      html: draft.html,
      text: draft.text,
      name: draft.name,
    }),
  });
  if (!res.ok) throw new Error(`Resend HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const body = (await res.json()) as { id?: string };
  if (!body.id) throw new Error("Resend response had no broadcast id");
  return body.id;
}
