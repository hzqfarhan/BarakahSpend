import { db, type LocalDonation } from '@/lib/db';
import { queueMutation } from '@/services/offline-queue';

// ================================================
// Donation & QR Service (Offline-First)
// ================================================

export const DONATION_CATEGORIES = [
    { value: 'tabung_iftar', label: 'Tabung Iftar Ramadan', icon: '🌙' },
    { value: 'tabung_masjid', label: 'Tabung Masjid', icon: '🕌' },
    { value: 'tabung_anak_yatim', label: 'Tabung Anak Yatim', icon: '👶' },
    { value: 'tabung_pendidikan', label: 'Tabung Pendidikan', icon: '📚' },
    { value: 'tabung_pembinaan', label: 'Tabung Pembinaan', icon: '🏗️' },
    { value: 'general', label: 'Derma Am', icon: '💝' },
] as const;

export interface CreateDonationInput {
    organization_id: string;
    amount: number;
    category: string;
    donor_name?: string;
    donor_user_id?: string;
    qr_ref?: string;
    description?: string;
    date: string;
}

/**
 * Record a donation (offline-first).
 */
export async function recordDonation(input: CreateDonationInput): Promise<string> {
    const offlineId = `don_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date().toISOString();

    const localDonation: LocalDonation = {
        organization_id: input.organization_id,
        donor_name: input.donor_name,
        donor_user_id: input.donor_user_id,
        amount: input.amount,
        category: input.category,
        qr_ref: input.qr_ref,
        description: input.description,
        date: input.date,
        offline_id: offlineId,
        synced: false,
        created_at: now,
    };

    await db.donations.add(localDonation);

    await queueMutation({
        tableName: 'donations',
        operation: 'create',
        data: {
            organization_id: input.organization_id,
            donor_name: input.donor_name || null,
            donor_user_id: input.donor_user_id || null,
            amount: input.amount,
            category: input.category,
            qr_ref: input.qr_ref || null,
            description: input.description || null,
            date: input.date,
            offline_id: offlineId,
        },
    });

    return offlineId;
}

/**
 * Get donations for an organization from local DB.
 */
export async function getLocalOrgDonations(orgId: string): Promise<LocalDonation[]> {
    return db.donations
        .where('organization_id')
        .equals(orgId)
        .reverse()
        .sortBy('date');
}

/**
 * Generate QR code data for a donation category.
 */
export function generateQRData(orgId: string, category: string, orgName: string): string {
    return JSON.stringify({
        type: 'barakahspend_donation',
        org_id: orgId,
        org_name: orgName,
        category,
        ref: `qr_${orgId}_${category}_${Date.now()}`,
        timestamp: new Date().toISOString(),
    });
}

/**
 * Parse scanned QR data.
 */
export function parseQRData(
    qrString: string
): { org_id: string; category: string; org_name: string; ref: string } | null {
    try {
        const data = JSON.parse(qrString);
        if (data.type !== 'barakahspend_donation') return null;
        return {
            org_id: data.org_id,
            category: data.category,
            org_name: data.org_name,
            ref: data.ref,
        };
    } catch {
        return null;
    }
}

/**
 * Get donation totals by category for an org.
 */
export async function getDonationsByCategory(
    orgId: string
): Promise<Record<string, number>> {
    const donations = await db.donations
        .where('organization_id')
        .equals(orgId)
        .toArray();

    const byCategory: Record<string, number> = {};
    for (const don of donations) {
        byCategory[don.category] = (byCategory[don.category] || 0) + don.amount;
    }
    return byCategory;
}
