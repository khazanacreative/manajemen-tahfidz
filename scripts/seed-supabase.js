import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase URL or Key. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY or SUPABASE_URL/SUPABASE_KEY in your environment.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function seed() {
  try {
    console.log('Seeding Supabase with dummy data...');

    // Create some dummy asatidz (profiles)
    const asatidz = [
      { id: randomUUID(), nama_lengkap: 'Ustadz Ahmad', username: 'ahmad', email: 'ahmad@example.com', no_hp: '081234567800', aktif: true },
      { id: randomUUID(), nama_lengkap: 'Ustadz Budi', username: 'budi', email: 'budi@example.com', no_hp: '081234567801', aktif: true },
    ];

    console.log('Inserting profiles (asatidz)...');
    const { data: profilesData, error: profilesError } = await supabase.from('profiles').upsert(asatidz);
    if (profilesError) throw profilesError;

    // Insert user_roles for these asatidz
    const userRoles = asatidz.map((a) => ({ user_id: a.id, role: 'Asatidz' }));
    console.log('Inserting user_roles...');
    const { error: rolesError } = await supabase.from('user_roles').upsert(userRoles);
    if (rolesError) throw rolesError;

    // Create some halaqoh linked to asatidz
    const halaqohs = [
      { id: randomUUID(), nama_halaqoh: 'Halaqoh Umar bin Khattab', id_asatidz: asatidz[0].id, tingkat: 'Pemula' },
      { id: randomUUID(), nama_halaqoh: 'Halaqoh Ali bin Abi Thalib', id_asatidz: asatidz[1].id, tingkat: 'Menengah' },
    ];

    console.log('Inserting halaqoh...');
    const { data: halaqohData, error: halaqohError } = await supabase.from('halaqoh').upsert(halaqohs);
    if (halaqohError) throw halaqohError;

    // Create santri linked to halaqoh
    const santri = [
      { id: randomUUID(), nama_santri: 'Santri A', nis: 'S001', status: 'Aktif', id_halaqoh: halaqohs[0].id },
      { id: randomUUID(), nama_santri: 'Santri B', nis: 'S002', status: 'Aktif', id_halaqoh: halaqohs[0].id },
      { id: randomUUID(), nama_santri: 'Santri C', nis: 'S003', status: 'Aktif', id_halaqoh: halaqohs[1].id },
    ];

    console.log('Inserting santri...');
    const { data: santriData, error: santriError } = await supabase.from('santri').upsert(santri);
    if (santriError) throw santriError;

    // Create setoran (hafalan) linked to santri
    const setoran = [
      { id: randomUUID(), id_santri: santri[0].id, juz: 1, nilai_kelancaran: 80, tanggal: new Date().toISOString() },
      { id: randomUUID(), id_santri: santri[1].id, juz: 2, nilai_kelancaran: 90, tanggal: new Date().toISOString() },
      { id: randomUUID(), id_santri: santri[2].id, juz: 1, nilai_kelancaran: 85, tanggal: new Date().toISOString() },
    ];

    console.log('Inserting setoran (hafalan)...');
    const { data: setoranData, error: setoranError } = await supabase.from('setoran').upsert(setoran);
    if (setoranError) throw setoranError;

    console.log('Seed completed successfully. Summary:');
    console.log('profiles:', (profilesData || []).length);
    console.log('halaqoh:', (halaqohData || []).length);
    console.log('santri:', (santriData || []).length);
    console.log('setoran:', (setoranData || []).length);

    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

seed();
