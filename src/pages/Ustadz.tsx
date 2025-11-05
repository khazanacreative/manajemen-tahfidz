import React, { useState, useEffect } from "react"; // Ensure React is imported
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { validateEmail, validatePhoneNumber } from "@/lib/validators"; // Import validation helpers
import { supabaseService } from "@/services/supabaseService"; // Modularize Supabase logic

// Define types for Supabase tables
interface UserRole {
  user_id: string;
  role: string;
}

interface Profile {
  id: string;
  nama_lengkap: string;
  username: string;
  email: string;
  no_hp: string | null;
  aktif: boolean;
}

interface Halaqoh {
  id_asatidz: string;
  count: number;
}

interface Ustadz {
  id: string;
  nama_lengkap: string;
  username: string;
  email: string;
  no_hp: string | null;
  aktif: boolean;
  halaqoh_count?: number;
}

const Ustadz = () => {
  const [ustadz, setUstadz] = useState<Ustadz[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUstadz, setEditingUstadz] = useState<Ustadz | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nama_lengkap: "",
    username: "",
    email: "",
    no_hp: "",
    password: "",
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  const dummyData: Ustadz[] = [
    { id: "1", nama_lengkap: "Ahmad Fauzi", username: "ahmadf", email: "ahmadf@example.com", no_hp: "081234567890", aktif: true, halaqoh_count: 5 },
    { id: "2", nama_lengkap: "Budi Santoso", username: "budis", email: "budis@example.com", no_hp: "081234567891", aktif: true, halaqoh_count: 3 },
    { id: "3", nama_lengkap: "Citra Dewi", username: "citrad", email: "citrad@example.com", no_hp: "081234567892", aktif: false, halaqoh_count: 2 },
    { id: "4", nama_lengkap: "Dedi Pratama", username: "dedip", email: "dedip@example.com", no_hp: "081234567893", aktif: true, halaqoh_count: 4 },
    { id: "5", nama_lengkap: "Eka Putra", username: "ekap", email: "ekap@example.com", no_hp: "081234567894", aktif: true, halaqoh_count: 1 },
    { id: "6", nama_lengkap: "Fajar Hidayat", username: "fajarh", email: "fajarh@example.com", no_hp: "081234567895", aktif: false, halaqoh_count: 0 },
    { id: "7", nama_lengkap: "Gita Anggraini", username: "gitaa", email: "gitaa@example.com", no_hp: "081234567896", aktif: true, halaqoh_count: 6 },
    { id: "8", nama_lengkap: "Hendra Wijaya", username: "hendraw", email: "hendraw@example.com", no_hp: "081234567897", aktif: true, halaqoh_count: 7 },
    { id: "9", nama_lengkap: "Indra Kusuma", username: "indrak", email: "indrak@example.com", no_hp: "081234567898", aktif: false, halaqoh_count: 3 },
    { id: "10", nama_lengkap: "Joko Susilo", username: "jokos", email: "jokos@example.com", no_hp: "081234567899", aktif: true, halaqoh_count: 8 },
  ];

  useEffect(() => {
    checkAuth();
    // Replace fetchUstadz with dummy data for testing
    setUstadz(dummyData);
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) navigate("/auth");
  };

  const fetchUstadz = async () => {
    setLoading(true);
    try {
      const { data: rolesData, error: rolesError } = await supabase
        .from<UserRole>("user_roles")
        .select("user_id")
        .eq("role", "Asatidz");

      if (rolesError) throw rolesError;

      const userIds = rolesData?.map((r) => r.user_id) || [];

      if (userIds.length === 0) {
        setUstadz([]);
        return;
      }

      const { data: profilesData, error: profilesError } = await supabase
        .from<Profile>("profiles")
        .select("*")
        .in("id", userIds);

      if (profilesError) throw profilesError;

      const { data: halaqohCounts } = await supabase
        .from<Halaqoh>("halaqoh")
        .select("id_asatidz, count:id", { count: "exact" })
        .in("id_asatidz", userIds);

      const countMap: Record<string, number> = {};
      halaqohCounts?.forEach((item) => {
        countMap[item.id_asatidz] = (countMap[item.id_asatidz] || 0) + 1;
      });

      const mergedData = profilesData.map((p) => ({
        ...p,
        halaqoh_count: countMap[p.id] || 0,
      }));

      setUstadz(mergedData);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Input validation
    if (!validateEmail(formData.email)) {
      toast({ title: "Error", description: "Email tidak valid", variant: "destructive" });
      setLoading(false);
      return;
    }

    if (formData.no_hp && !validatePhoneNumber(formData.no_hp)) {
      toast({ title: "Error", description: "Nomor HP tidak valid", variant: "destructive" });
      setLoading(false);
      return;
    }

    try {
      if (editingUstadz) {
        await supabaseService.updateUstadz(editingUstadz.id, formData);
        toast({ title: "Berhasil", description: "Data ustadz diperbarui" });
      } else {
        await supabaseService.addUstadz(formData);
        toast({ title: "Berhasil", description: "Ustadz baru berhasil ditambahkan" });
      }

      handleDialogClose();
      fetchUstadz();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (u: Ustadz) => {
    setEditingUstadz(u);
    setFormData({
      nama_lengkap: u.nama_lengkap,
      username: u.username,
      email: u.email || "",
      no_hp: u.no_hp || "",
      password: "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menonaktifkan ustadz ini?")) return;

    try {
      await supabaseService.deleteUstadz(id);
      toast({ title: "Berhasil", description: "Ustadz dinonaktifkan" });
      fetchUstadz();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingUstadz(null);
    setFormData({ nama_lengkap: "", username: "", email: "", no_hp: "", password: "" });
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Data Ustadz</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingUstadz(null)}>
                <Plus className="mr-2 h-4 w-4" /> Tambah Ustadz
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingUstadz ? "Edit Ustadz" : "Tambah Ustadz Baru"}</DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                {['nama_lengkap', 'username', 'email', 'no_hp'].map((field) => (
                  <div key={field}>
                    <Label htmlFor={field}>{field.replace('_', ' ').toUpperCase()}</Label>
                    <Input
                      id={field}
                      type={field === 'email' ? 'email' : 'text'}
                      value={(formData as any)[field]}
                      onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                      required={field !== 'no_hp'}
                      disabled={field === 'email' && !!editingUstadz}
                    />
                  </div>
                ))}

                {!editingUstadz && (
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      minLength={6}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                    />
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={handleDialogClose}>
                    Batal
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Menyimpan..." : "Simpan"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="bg-card rounded-lg shadow overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Lengkap</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>No. HP</TableHead>
                <TableHead>Jumlah Halaqoh</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ustadz.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500 py-6">
                    {loading ? "Memuat data..." : "Belum ada data ustadz"}
                  </TableCell>
                </TableRow>
              ) : (
                ustadz.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>{u.nama_lengkap}</TableCell>
                    <TableCell>{u.username}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{u.no_hp || '-'}</TableCell>
                    <TableCell>{u.halaqoh_count || 0}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          u.aktif ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {u.aktif ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(u)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(u.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </Layout>
  );
};

export default Ustadz;
