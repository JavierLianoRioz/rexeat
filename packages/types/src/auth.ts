import { z } from "zod";

export const OrganizationIdSchema = z.string().startsWith("org_");
export type OrganizationId = z.infer<typeof OrganizationIdSchema>;

export const UserRoleSchema = z.enum(["owner", "manager", "waiter"]);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const UserContextSchema = z.object({
  userId: z.string(),
  organizationId: OrganizationIdSchema,
  role: UserRoleSchema,
});

export type UserContext = z.infer<typeof UserContextSchema>;

export const TenantContextSchema = z.object({
  organizationId: OrganizationIdSchema,
});

export type TenantContext = z.infer<typeof TenantContextSchema>;
