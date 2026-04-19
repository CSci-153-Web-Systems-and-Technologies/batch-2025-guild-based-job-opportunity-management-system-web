import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Represents a role from the database.
 */
export interface Role {
  id: number
  name: string
}

/**
 * Check if a user has admin role.
 *
 * @param supabase - Authenticated Supabase client
 * @param roleId - The user's role_id (from profiles table)
 * @returns true if the user is an admin, false otherwise
 */
export async function isUserAdmin(
  supabase: SupabaseClient,
  roleId: number | null | undefined
): Promise<boolean> {
  // Short-circuit: no role ID means not admin
  if (!roleId) return false

  try {
    const { data: roleData, error } = await supabase
      .from('roles')
      .select('id, name')
      .eq('id', roleId)
      .maybeSingle()

    if (error || !roleData) return false

    // Properly typed - no 'as any'
    const role = roleData as Role
    return role.name === 'admin'
  } catch {
    return false
  }
}

/**
 * Check if a user owns a resource or is an admin.
 *
 * @param resource - The resource object with created_by (jobs) or leader_id (parties)
 * @param userId - The user's ID (from auth)
 * @param isAdmin - Whether the user is an admin
 * @param resourceType - Either 'job' or 'party' to determine which field to check
 * @returns true if the user owns the resource or is admin, false otherwise
 */
export function checkResourceOwnership(
  resource: { created_by?: string | null; leader_id?: string | null },
  userId: string,
  isAdmin: boolean,
  resourceType: 'job' | 'party'
): boolean {
  if (isAdmin) return true

  const ownerField = resourceType === 'job' ? 'created_by' : 'leader_id'
  const owner = resource[ownerField as keyof typeof resource]
  return owner === userId
}
