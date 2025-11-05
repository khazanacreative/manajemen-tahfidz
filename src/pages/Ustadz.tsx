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
    if (!session) {
      navigate("/auth");
    }
  };

  const fetchUstadz = async () => {
    const { data: rolesData, error: rolesError } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "Asatidz");

    if (rolesError) {
      toast({ title: "Error", description: rolesError.message, variant: "destructive" });
      return;
    }

    const userIds = rolesData.map(r => r.user_id);

    if (userIds.length === 0) {
      setUstadz([]);
      return;
    }

    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("*")
      .in("id", userIds);

    if (profilesError) {
      toast({ title: "Error", description: profilesError.message, variant: "destructive" });
      return;
    }

    // Get halaqoh count for each ustadz
    const ustadzWithCount = await Promise.all(
      profilesData.map(async (profile) => {
        const { count } = await supabase
          .from("halaqoh")
          .select("*", { count: "exact", head: true })
          .eq("id_asatidz", profile.id);
        
        return {
          ...profile,
          halaqoh_count: count || 0,
        };
      })
    );

    setUstadz(ustadzWithCount);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingUstadz) {
      // Update existing ustadz profile
      const { error } = await supabase
        .from("profiles")
        .update({
          nama_lengkap: formData.nama_lengkap,
          username: formData.username,
          email: formData.email,
          no_hp: formData.no_hp,
        })
        .eq("id", editingUstadz.id);

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return;
      }

      toast({ title: "Berhasil", description: "Data ustadz berhasil diperbarui" });
    } else {
      // Create new ustadz account
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

      if (authError) {
        toast({ title: "Error", description: authError.message, variant: "destructive" });
        return;
      }

      if (authData.user) {
        // Assign Asatidz role
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({
            user_id: authData.user.id,
            role: "Asatidz",
          });

        if (roleError) {
          toast({ title: "Error", description: roleError.message, variant: "destructive" });
          return;
        }

        // Update phone number if provided
        if (formData.no_hp) {
          await supabase
            .from("profiles")
            .update({ no_hp: formData.no_hp })
            .eq("id", authData.user.id);
        }

        toast({ title: "Berhasil", description: "Ustadz baru berhasil ditambahkan" });
      }
    }

    setIsDialogOpen(false);
    setEditingUstadz(null);
    setFormData({ nama_lengkap: "", username: "", email: "", no_hp: "", password: "" });
    fetchUstadz();
  };

  const handleEdit = (ustadz: Ustadz) => {
    setEditingUstadz(ustadz);
    setFormData({
      nama_lengkap: ustadz.nama_lengkap,
      username: ustadz.username,
      email: ustadz.email || "",
      no_hp: ustadz.no_hp || "",
      password: "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus ustadz ini?")) return;

    // Delete role assignment
    const { error: roleError } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", id)
      .eq("role", "Asatidz");

    if (roleError) {
      toast({ title: "Error", description: roleError.message, variant: "destructive" });
      return;
    }

    // Deactivate profile instead of deleting
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ aktif: false })
      .eq("id", id);

    if (profileError) {
      toast({ title: "Error", description: profileError.message, variant: "destructive" });
      return;
    }

    toast({ title: "Berhasil", description: "Ustadz berhasil dihapus" });
    fetchUstadz();
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
                <Plus className="mr-2 h-4 w-4" />
                Tambah Ustadz
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingUstadz ? "Edit Ustadz" : "Tambah Ustadz Baru"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="nama_lengkap">Nama Lengkap</Label>
                  <Input
                    id="nama_lengkap"
                    value={formData.nama_lengkap}
                    onChange={(e) => setFormData({ ...formData, nama_lengkap: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    disabled={!!editingUstadz}
                  />
                </div>
                <div>
                  <Label htmlFor="no_hp">No. HP</Label>
                  <Input
                    id="no_hp"
                    value={formData.no_hp}
                    onChange={(e) => setFormData({ ...formData, no_hp: e.target.value })}
                  />
                </div>
                {!editingUstadz && (
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      minLength={6}
                    />
                  </div>
                )}
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={handleDialogClose}>
                    Batal
                  </Button>
                  <Button type="submit">Simpan</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="bg-card rounded-lg shadow">
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
              {ustadz.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{u.nama_lengkap}</TableCell>
                  <TableCell>{u.username}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.no_hp || "-"}</TableCell>
                  <TableCell>{u.halaqoh_count || 0}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs ${u.aktif ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
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
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </Layout>
  );
};

export default Ustadz;
