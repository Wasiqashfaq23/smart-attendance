import { prisma } from "@/lib/db";

export type AuditAction =
  | "Created"
  | "Updated"
  | "Deleted"
  | "Marked teacher absent"
  | "Cancelled absence"
  | "Assigned substitute"
  | "Cancelled substitution"
  | "Logged in"
  | "Logged out";

export async function logAudit(
  user: string,
  action: AuditAction,
  entity: string,
  entityId: string | number,
  description?: string | null
) {
  try {
    await prisma.auditLog.create({
      data: {
        user,
        action,
        entity,
        entity_id: String(entityId),
        description: description ?? null,
        timestamp: new Date(),
      },
    });
  } catch (e) {
    console.error("Audit log failed:", e);
  }
}