
-- Migration: 20251105022009
-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('Admin', 'Koordinator', 'Asatidz', 'WaliSantri', 'Yayasan');

-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nama_lengkap TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  email TEXT,
  no_hp TEXT,
  aktif BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user_roles table (CRITICAL: Roles must be separate)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Create halaqoh table
CREATE TABLE public.halaqoh (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_halaqoh TEXT NOT NULL,
  id_asatidz UUID REFERENCES auth.users(id),
  tingkat TEXT,
  jumlah_santri INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create santri table
CREATE TABLE public.santri (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nis TEXT UNIQUE NOT NULL,
  nama_santri TEXT NOT NULL,
  id_halaqoh UUID REFERENCES public.halaqoh(id),
  id_wali UUID REFERENCES auth.users(id),
  tanggal_masuk DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'Aktif' CHECK (status IN ('Aktif', 'Nonaktif')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create setoran table
CREATE TABLE public.setoran (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_santri UUID REFERENCES public.santri(id) ON DELETE CASCADE NOT NULL,
  id_asatidz UUID REFERENCES auth.users(id) NOT NULL,
  tanggal_setoran DATE DEFAULT CURRENT_DATE,
  juz INTEGER NOT NULL CHECK (juz >= 1 AND juz <= 30),
  ayat_dari INTEGER NOT NULL,
  ayat_sampai INTEGER NOT NULL,
  nilai_kelancaran INTEGER CHECK (nilai_kelancaran >= 0 AND nilai_kelancaran <= 100),
  status TEXT DEFAULT 'Lancar' CHECK (status IN ('Lancar', 'Ulangi', 'Salah')),
  catatan TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create absensi table
CREATE TABLE public.absensi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_santri UUID REFERENCES public.santri(id) ON DELETE CASCADE NOT NULL,
  tanggal DATE DEFAULT CURRENT_DATE,
  status_kehadiran TEXT DEFAULT 'Hadir' CHECK (status_kehadiran IN ('Hadir', 'Izin', 'Sakit', 'Alfa')),
  keterangan TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(id_santri, tanggal)
);

-- Create penilaian table
CREATE TABLE public.penilaian (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_santri UUID REFERENCES public.santri(id) ON DELETE CASCADE NOT NULL,
  id_asatidz UUID REFERENCES auth.users(id) NOT NULL,
  tanggal_penilaian DATE DEFAULT CURRENT_DATE,
  tajwid INTEGER CHECK (tajwid >= 0 AND tajwid <= 100),
  makharij INTEGER CHECK (makharij >= 0 AND makharij <= 100),
  kelancaran INTEGER CHECK (kelancaran >= 0 AND kelancaran <= 100),
  catatan TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create pengumuman table
CREATE TABLE public.pengumuman (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  judul TEXT NOT NULL,
  isi TEXT NOT NULL,
  kategori TEXT DEFAULT 'Pengumuman' CHECK (kategori IN ('Pengumuman', 'Motivasi')),
  tanggal_post TIMESTAMP WITH TIME ZONE DEFAULT now(),
  dibuat_oleh UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create log_aktivitas table
CREATE TABLE public.log_aktivitas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_user UUID REFERENCES auth.users(id),
  aksi TEXT NOT NULL,
  waktu TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.halaqoh ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.santri ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.setoran ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.absensi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.penilaian ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pengumuman ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.log_aktivitas ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nama_lengkap, username, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nama_lengkap', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update jumlah_santri in halaqoh
CREATE OR REPLACE FUNCTION public.update_jumlah_santri()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.halaqoh
    SET jumlah_santri = (SELECT COUNT(*) FROM public.santri WHERE id_halaqoh = NEW.id_halaqoh AND status = 'Aktif')
    WHERE id = NEW.id_halaqoh;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE public.halaqoh
    SET jumlah_santri = (SELECT COUNT(*) FROM public.santri WHERE id_halaqoh = OLD.id_halaqoh AND status = 'Aktif')
    WHERE id = OLD.id_halaqoh;
    UPDATE public.halaqoh
    SET jumlah_santri = (SELECT COUNT(*) FROM public.santri WHERE id_halaqoh = NEW.id_halaqoh AND status = 'Aktif')
    WHERE id = NEW.id_halaqoh;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.halaqoh
    SET jumlah_santri = (SELECT COUNT(*) FROM public.santri WHERE id_halaqoh = OLD.id_halaqoh AND status = 'Aktif')
    WHERE id = OLD.id_halaqoh;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger for santri changes
CREATE TRIGGER update_halaqoh_count
  AFTER INSERT OR UPDATE OR DELETE ON public.santri
  FOR EACH ROW EXECUTE FUNCTION public.update_jumlah_santri();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_halaqoh_updated_at BEFORE UPDATE ON public.halaqoh
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_santri_updated_at BEFORE UPDATE ON public.santri
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (public.has_role(auth.uid(), 'Admin'));

CREATE POLICY "System can insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (true);

-- RLS Policies for user_roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'Admin'));

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'Admin'));

-- RLS Policies for halaqoh
CREATE POLICY "Everyone can view halaqoh"
  ON public.halaqoh FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin and Koordinator can manage halaqoh"
  ON public.halaqoh FOR ALL
  USING (public.has_role(auth.uid(), 'Admin') OR public.has_role(auth.uid(), 'Koordinator'));

-- RLS Policies for santri
CREATE POLICY "Everyone can view santri"
  ON public.santri FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Wali can view own santri"
  ON public.santri FOR SELECT
  USING (id_wali = auth.uid());

CREATE POLICY "Admin and Koordinator can manage santri"
  ON public.santri FOR ALL
  USING (public.has_role(auth.uid(), 'Admin') OR public.has_role(auth.uid(), 'Koordinator'));

-- RLS Policies for setoran
CREATE POLICY "Everyone can view setoran"
  ON public.setoran FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Asatidz can create setoran"
  ON public.setoran FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'Asatidz') OR public.has_role(auth.uid(), 'Admin'));

CREATE POLICY "Asatidz can update own setoran"
  ON public.setoran FOR UPDATE
  USING (id_asatidz = auth.uid() OR public.has_role(auth.uid(), 'Admin'));

CREATE POLICY "Admin can delete setoran"
  ON public.setoran FOR DELETE
  USING (public.has_role(auth.uid(), 'Admin'));

-- RLS Policies for absensi
CREATE POLICY "Everyone can view absensi"
  ON public.absensi FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Asatidz can manage absensi"
  ON public.absensi FOR ALL
  USING (public.has_role(auth.uid(), 'Asatidz') OR public.has_role(auth.uid(), 'Admin') OR public.has_role(auth.uid(), 'Koordinator'));

-- RLS Policies for penilaian
CREATE POLICY "Everyone can view penilaian"
  ON public.penilaian FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Asatidz can manage penilaian"
  ON public.penilaian FOR ALL
  USING (public.has_role(auth.uid(), 'Asatidz') OR public.has_role(auth.uid(), 'Admin'));

-- RLS Policies for pengumuman
CREATE POLICY "Everyone can view pengumuman"
  ON public.pengumuman FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin and Koordinator can manage pengumuman"
  ON public.pengumuman FOR ALL
  USING (public.has_role(auth.uid(), 'Admin') OR public.has_role(auth.uid(), 'Koordinator'));

-- RLS Policies for log_aktivitas
CREATE POLICY "Admins can view all logs"
  ON public.log_aktivitas FOR SELECT
  USING (public.has_role(auth.uid(), 'Admin'));

CREATE POLICY "System can insert logs"
  ON public.log_aktivitas FOR INSERT
  WITH CHECK (true);
