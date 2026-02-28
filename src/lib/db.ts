import Dexie, { type EntityTable } from 'dexie';

// ================================================
// Offline Database Types
// ================================================

export interface LocalUser {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
}

export interface LocalExpense {
    id?: number;
    server_id?: string;
    user_id: string;
    amount: number;
    category: string;
    description?: string;
    date: string;
    is_ramadan?: boolean;
    ramadan_meal?: string;
    offline_id: string;
    synced: boolean;
    created_at: string;
    updated_at: string;
}

export interface LocalSedekah {
    id?: number;
    server_id?: string;
    user_id: string;
    amount: number;
    recipient?: string;
    description?: string;
    date: string;
    offline_id: string;
    synced: boolean;
    created_at: string;
}

export interface LocalZakat {
    id?: number;
    server_id?: string;
    user_id: string;
    total_savings: number;
    gold_value: number;
    zakat_amount: number;
    nisab_eligible: boolean;
    year: number;
    offline_id: string;
    synced: boolean;
    calculated_at: string;
}

export interface LocalDonation {
    id?: number;
    server_id?: string;
    organization_id: string;
    donor_name?: string;
    donor_user_id?: string;
    amount: number;
    category: string;
    qr_ref?: string;
    description?: string;
    date: string;
    offline_id: string;
    synced: boolean;
    created_at: string;
}

export interface OfflineQueueItem {
    id?: number;
    mutation_id: string;
    table_name: string;
    operation: 'create' | 'update' | 'delete';
    data: string; // JSON stringified
    status: 'pending' | 'syncing' | 'synced' | 'failed';
    retry_count: number;
    created_at: string;
    error?: string;
}

// ================================================
// Dexie Database
// ================================================

class BarakahSpendDB extends Dexie {
    users!: EntityTable<LocalUser, 'id'>;
    expenses!: EntityTable<LocalExpense, 'id'>;
    sedekah!: EntityTable<LocalSedekah, 'id'>;
    zakat!: EntityTable<LocalZakat, 'id'>;
    donations!: EntityTable<LocalDonation, 'id'>;
    offlineQueue!: EntityTable<OfflineQueueItem, 'id'>;

    constructor() {
        super('BarakahSpendDB');

        this.version(1).stores({
            users: 'id, email',
            expenses: '++id, server_id, user_id, offline_id, category, date, synced',
            sedekah: '++id, server_id, user_id, offline_id, date, synced',
            zakat: '++id, server_id, user_id, offline_id, year, synced',
            donations: '++id, server_id, organization_id, offline_id, date, synced',
            offlineQueue: '++id, mutation_id, table_name, status, created_at',
        });
    }
}

export const db = new BarakahSpendDB();
