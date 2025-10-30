import { z } from "zod";

export const ManifestKind = z.enum(["LessonEnv", "PresetEnv"]).catch("PresetEnv");
export type ManifestKind = z.infer<typeof ManifestKind>;

export function isSharedPresetTag(tag: string): boolean {
  // Consider canonical/shared tags as "ubuntu-24.04", "latest", "stable", or plain base-dist tags
  return /^(latest|stable|ubuntu-\d{2}\.\d{2})$/.test(tag);
}

export function isLessonScopedTag(tag: string): boolean {
  // Require at least one course/lesson discriminator in tag (very simple heuristic)
  return /-(course|lesson|wk|week|class|lab)\d*/i.test(tag) || tag.includes("-");
}

export function enforceTagPolicy(kind: ManifestKind, tag: string, force: boolean) {
  if (kind === "LessonEnv") {
    if (!isLessonScopedTag(tag)) {
      throw new Error(`Tag policy: LessonEnv images must use a lesson-scoped tag (got "${tag}"). Example: ubuntu-24.04-week02`);
    }
    if (!force && isSharedPresetTag(tag)) {
      throw new Error(`Tag policy: refusing to overwrite shared preset tag "${tag}" without --force.`);
    }
  } else {
    // PresetEnv: allow shared tags, but still block overwrites unless forced if that's your policy
    if (!force && isSharedPresetTag(tag)) {
      // Optional: warn or gate overwriting shared tags here as well.
      return;
    }
  }
}
