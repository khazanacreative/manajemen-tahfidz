export type SyncStatus = 'offline' | 'loading' | 'ready' | 'error';

export interface DatabaseState {
  status: SyncStatus;
  profiles: Record<string, any>;
  userRoles: Record<string, any>;
  halaqoh: Record<string, any>;
  santri: Record<string, any>;
  absensi: Record<string, any>;
  penilaian: Record<string, any>;
  setoran: Record<string, any>;
}

export function getDatabaseState(): DatabaseState {
  return {
    status: 'offline',
    profiles: {},
    userRoles: {},
    halaqoh: {},
    santri: {},
    absensi: {},
    penilaian: {},
    setoran: {}
  };
}

export function getDummyUserRole(userId: string): string {
  return 'Asatidz';
}

export function getDummyProfile(userId: string) {
  const dummyProfiles = {
    'as-1': {
      id: 'as-1',
      nama_lengkap: 'Ustadz Ahmad',
      username: 'ustadzahmad',
      email: 'ahmad@example.com',
      no_hp: '081234567890',
      aktif: true
    },
    'as-2': {
      id: 'as-2',
      nama_lengkap: 'Ustadz Budi',
      username: 'ustadzbudi',
      email: 'budi@example.com',
      no_hp: '081234567891',
      aktif: true
    }
  };
  return dummyProfiles[userId] || null;
}

export function getDummyHalaqoh(halaqohId?: string) {
  const dummyHalaqoh = {
    'h-1': {
      id: 'h-1',
      nama_halaqoh: 'Halaqoh Umar bin Khattab',
      id_asatidz: 'as-1',
      tingkat: 'Pemula',
      jumlah_santri: 2,
      asatidz: { nama_lengkap: 'Ustadz Ahmad' }
    },
    'h-2': {
      id: 'h-2',
      nama_halaqoh: 'Halaqoh Ali bin Abi Thalib',
      id_asatidz: 'as-2',
      tingkat: 'Menengah',
      jumlah_santri: 1,
      asatidz: { nama_lengkap: 'Ustadz Budi' }
    }
  };
  return halaqohId ? dummyHalaqoh[halaqohId] : Object.values(dummyHalaqoh);
}

export function getDummySantri(santriId?: string) {
  const dummySantri = {
    's-1': {
      id: 's-1',
      nis: '2025001',
      nama_santri: 'Ahmad Santri',
      id_halaqoh: 'h-1',
      tanggal_masuk: '2025-01-01',
      status: 'Aktif',
      halaqoh: { nama_halaqoh: 'Halaqoh Umar bin Khattab' }
    },
    's-2': {
      id: 's-2',
      nis: '2025002',
      nama_santri: 'Budi Santri',
      id_halaqoh: 'h-2',
      tanggal_masuk: '2025-01-02',
      status: 'Aktif',
      halaqoh: { nama_halaqoh: 'Halaqoh Ali bin Abi Thalib' }
    },
    's-3': {
      id: 's-3',
      nis: '2025003',
      nama_santri: 'Charlie Santri',
      id_halaqoh: 'h-1',
      tanggal_masuk: '2025-01-03',
      status: 'Aktif',
      halaqoh: { nama_halaqoh: 'Halaqoh Umar bin Khattab' }
    }
  };
  return santriId ? dummySantri[santriId] : Object.values(dummySantri);
}

export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function getCurrentUserId(): string {
  return 'as-1'; // Default to first ustadz in offline mode
}

export function getRelatedData(table: string, id: string) {
  switch (table) {
    case 'profiles':
      return getDummyProfile(id);
    case 'halaqoh':
      return getDummyHalaqoh(id);
    case 'santri':
      return getDummySantri(id);
    default:
      return null;
  }
}