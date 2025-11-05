// Common interfaces
interface Profile {
  id: string;
  nama_lengkap: string;
  username: string;
  email: string;
  no_hp: string | null;
  aktif: boolean;
}

interface UserRole {
  user_id: string;
  role: string;
}

interface Halaqoh {
  id: string;
  nama_halaqoh: string;
  id_asatidz?: string | null;
  tingkat?: string | null;
  jumlah_santri?: number;
  asatidz?: { nama_lengkap: string };
}

interface Santri {
  id: string;
  nis: string;
  nama_santri: string;
  id_halaqoh?: string;
  id_wali?: string;
  tanggal_masuk: string;
  status: string;
  halaqoh?: { nama_halaqoh: string };
  profiles?: { nama_lengkap: string };
}

// Dummy profiles (asatidz)
export const DUMMY_PROFILES: Profile[] = [
  { 
    id: "as-1", 
    nama_lengkap: "Ustadz Ahmad",
    username: "ustadzahmad",
    email: "ahmad@example.com",
    no_hp: "081234567890",
    aktif: true
  },
  { 
    id: "as-2", 
    nama_lengkap: "Ustadz Budi",
    username: "ustadzbudi",
    email: "budi@example.com",
    no_hp: "081234567891",
    aktif: true
  },
];

// Dummy user roles
export const DUMMY_USER_ROLES: UserRole[] = [
  { user_id: "as-1", role: "Asatidz" },
  { user_id: "as-2", role: "Asatidz" },
];

// Dummy halaqoh
export const DUMMY_HALAQOH: Halaqoh[] = [
  { 
    id: "h-1", 
    nama_halaqoh: "Halaqoh Umar bin Khattab",
    id_asatidz: "as-1",
    tingkat: "Pemula",
    jumlah_santri: 2,
    asatidz: { nama_lengkap: "Ustadz Ahmad" }
  },
  { 
    id: "h-2", 
    nama_halaqoh: "Halaqoh Ali bin Abi Thalib",
    id_asatidz: "as-2",
    tingkat: "Menengah",
    jumlah_santri: 1,
    asatidz: { nama_lengkap: "Ustadz Budi" }
  },
];

// Dummy santri
export const DUMMY_SANTRI: Santri[] = [
  { 
    id: "s-1", 
    nis: "2025001",
    nama_santri: "Ahmad Santri",
    id_halaqoh: "h-1",
    tanggal_masuk: "2025-01-01",
    status: "Aktif",
    halaqoh: { nama_halaqoh: "Halaqoh Umar bin Khattab" }
  },
  { 
    id: "s-2", 
    nis: "2025002",
    nama_santri: "Budi Santri",
    id_halaqoh: "h-2",
    tanggal_masuk: "2025-01-02",
    status: "Aktif",
    halaqoh: { nama_halaqoh: "Halaqoh Ali bin Abi Thalib" }
  },
  { 
    id: "s-3", 
    nis: "2025003",
    nama_santri: "Charlie Santri",
    id_halaqoh: "h-1",
    tanggal_masuk: "2025-01-03",
    status: "Aktif",
    halaqoh: { nama_halaqoh: "Halaqoh Umar bin Khattab" }
  },
];