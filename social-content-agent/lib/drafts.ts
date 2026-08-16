import { supabase } from "@/lib/supabase";

export type DraftStatus = "draft" | "approved";

export type Draft = {
  id: string;
  topic: string;
  content: string;
  status: DraftStatus;
  createdAt: string;
  updatedAt: string;
  approvedAt: string | null;
};

type DraftRow = {
  id: string;
  topic: string;
  content: string;
  status: DraftStatus;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
};

function toDraft(row: DraftRow): Draft {
  return {
    id: row.id,
    topic: row.topic,
    content: row.content,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    approvedAt: row.approved_at,
  };
}

export async function createDraft(
  topic: string,
  content: string,
): Promise<Draft> {
  const { data, error } = await supabase
    .from("drafts")
    .insert({
      topic,
      content,
      status: "draft",
      approved_at: null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Could not create draft: ${error.message}`);
  }

  return toDraft(data as DraftRow);
}

export async function getDrafts(): Promise<Draft[]> {
  const { data, error } = await supabase
    .from("drafts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Could not load drafts: ${error.message}`);
  }

  return (data as DraftRow[]).map(toDraft);
}

export async function getDraftById(id: string): Promise<Draft | undefined> {
  const { data, error } = await supabase
    .from("drafts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not load draft: ${error.message}`);
  }

  return data ? toDraft(data as DraftRow) : undefined;
}

export async function updateDraft(
  id: string,
  updates: {
    content?: string;
    status?: DraftStatus;
  },
): Promise<Draft | undefined> {
  const existingDraft = await getDraftById(id);

  if (!existingDraft) {
    return undefined;
  }

  const contentChanged =
    typeof updates.content === "string" &&
    updates.content !== existingDraft.content;

  const databaseUpdates: {
    content?: string;
    status?: DraftStatus;
    approved_at?: string | null;
  } = {};

  if (typeof updates.content === "string") {
    databaseUpdates.content = updates.content;
  }

  /*
      Safety rule:
      Any content edit invalidates prior approval.
    */
  if (contentChanged) {
    databaseUpdates.status = "draft";
    databaseUpdates.approved_at = null;
  } else if (updates.status === "approved") {
    databaseUpdates.status = "approved";
    databaseUpdates.approved_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("drafts")
    .update(databaseUpdates)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Could not update draft: ${error.message}`);
  }

  if (!data) {
    throw new Error("Could not update draft: Supabase returned no draft row.");
  }

  return toDraft(data as DraftRow);
}
