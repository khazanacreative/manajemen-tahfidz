import { useState, useEffect } from "react";
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

  useEffect(() => {
    checkAuth();
    fetchUstadz();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) navigate("/auth");
  };

  const fetchUstadz = async () => {
    setLoading(true);
    try {
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "Asatidz");

      if (rolesError) throw rolesError;

      const userIds = rolesData?.map(r => r.user_id) || [];

      if (userIds.length === 0) {
        setUstadz([]);
        return;
      }

      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .in("id", userIds);

      if (profilesError) throw profilesError;

      const { data: halaqohCounts } = await supabase
        .from("halaqoh")
        .select("id_asatidz, count:id", { count: "exact" })
        .in("id_asatidz", userIds);

      const countMap: Record<string, number> = {};
      halaqohCounts?.forEach(item => {
        countMap[item.id_asatidz] = (countMap[item.id_asatidz] || 0) + 1;
      });

      const mergedData = profilesData.map(p => ({
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

    try {
      if (editingUstadz) {
        const { error } = await supabase
          .from("profiles")
          .update({
            nama_lengkap: formData.nama_lengkap,
            username: formData.username,
            email: formData.email,
            no_hp: formData.no_hp,
          })
          .eq("id", editingUstadz.id);

        if (error) throw error;
        toast({ title: "Berhasil", description: "Data ustadz diperbarui" });
      } else {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              nama_lengkap: formData.nama_lengkap,
              username: formData.username,
            },
          },
        });

        if (authError) throw authError;

        if (authData.user) {
          await supabase.from("user_roles").insert({
            user_id: authData.user.id,
            role: "Asatidz",
          });

          if (formData.no_hp) {
            await supabase.from("profiles")
              .update({ no_hp: formData.no_hp })
              .eq("id", authData.user.id);
          }

          toast({ title: "Berhasil", description: "Ustadz baru berhasil ditambahkan" });
        }
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
      await supabase.from("user_roles").delete().eq("user_id", id).eq("role", "Asatidz");
      await supabase.from("profiles").update({ aktif: false }).eq("id", id);
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
                {["nama_lengkap", "username", "email", "no_hp"].map((field) => (
                  <div key={field}>
                    <Label htmlFor={field}>{field.replace("_", " ").toUpperCase()}</Label>
                    <Input
                      id={field}
                      type={field === "email" ? "email" : "text"}
                      value={(formData as any)[field]}
                      onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                      required={field !== "no_hp"}
                      disabled={field === "email" && !!editingUstadz}
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
                    <TableCell>{u.no_hp || "-"}</TableCell>
                    <TableCell>{u.halaqoh_count || 0}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          u.aktif ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}
                      >
                        {u.aktif ? "Aktif" : "Nonaktif"}
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
