import { createClient } from '@/services/supabase/client';

// ================================================
// Organizations (Masjid Mini SaaS) Service
// ================================================

export type OrgRole = 'admin' | 'treasurer' | 'viewer';

export interface Organization {
    id: string;
    name: string;
    description?: string;
    type: string;
    created_by: string;
    created_at: string;
}

export interface OrganizationMember {
    id: string;
    organization_id: string;
    user_id: string;
    role: OrgRole;
    joined_at: string;
    user?: { full_name: string; email: string; avatar_url?: string };
}

/**
 * Create a new organization and add creator as admin.
 */
export async function createOrganization(
    name: string,
    description: string,
    userId: string
): Promise<Organization | null> {
    const supabase = createClient();

    const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({ name, description, type: 'masjid', created_by: userId })
        .select()
        .single();

    if (orgError || !org) return null;

    // Add creator as admin
    await supabase.from('organization_members').insert({
        organization_id: org.id,
        user_id: userId,
        role: 'admin',
    });

    return org;
}

/**
 * Get organizations a user belongs to.
 */
export async function getUserOrganizations(userId: string): Promise<Organization[]> {
    const supabase = createClient();

    const { data } = await supabase
        .from('organization_members')
        .select('organization_id, organizations(*)')
        .eq('user_id', userId);

    if (!data) return [];
    return data.map((d: Record<string, unknown>) => d.organizations as unknown as Organization).filter(Boolean);
}

/**
 * Get members of an organization.
 */
export async function getOrganizationMembers(orgId: string): Promise<OrganizationMember[]> {
    const supabase = createClient();

    const { data } = await supabase
        .from('organization_members')
        .select('*, users(full_name, email, avatar_url)')
        .eq('organization_id', orgId);

    if (!data) return [];
    return data.map((d: Record<string, unknown>) => ({
        ...d,
        user: d.users,
    })) as unknown as OrganizationMember[];
}

/**
 * Add a member to organization.
 */
export async function addOrganizationMember(
    orgId: string,
    userId: string,
    role: OrgRole
): Promise<boolean> {
    const supabase = createClient();

    const { error } = await supabase.from('organization_members').insert({
        organization_id: orgId,
        user_id: userId,
        role,
    });

    return !error;
}

/**
 * Get user's role in an organization.
 */
export async function getUserOrgRole(orgId: string, userId: string): Promise<OrgRole | null> {
    const supabase = createClient();

    const { data } = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', orgId)
        .eq('user_id', userId)
        .single();

    return data?.role || null;
}

/**
 * Subscribe to real-time organization donations.
 */
export function subscribeToOrgDonations(
    orgId: string,
    callback: (donation: Record<string, unknown>) => void
) {
    const supabase = createClient();

    const channel = supabase
        .channel(`org-donations-${orgId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'donations',
                filter: `organization_id=eq.${orgId}`,
            },
            (payload) => callback(payload.new)
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
}
