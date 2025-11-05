import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface Halaqoh {
  id: string;
  nama_halaqoh: string;
  id_asatidz?: string;
  tingkat?: string;
  jumlah_santri: number;
  profiles?: { nama_lengkap: string };
}

interface Asatidz {
  id: string;
  nama_lengkap: string;
}

export default function HalaqohPage() {
  const [halaqohList, setHalaqohList] = useState<Halaqoh[]>([]);
  const [asatidzList, setAsatidzList] = useState<Asatidz[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    nama_halaqoh: "",
    id_asatidz: "",
    tingkat: "",
  });

  useEffect(() => {
    fetchHalaqoh();
    fetchAsatidz();
  }, []);

  const fetchHalaqoh = async () => {
    const { data, error } = await supabase
      .from("halaqoh")
      .select(`
        *,
        profiles (nama_lengkap)
      `)
      .order("nama_halaqoh");

    if (error) {
      toast.error("Gagal memuat data halaqoh");
    } else {
      setHalaqohList(data || []);
    }
  };

  const fetchAsatidz = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, nama_lengkap")
      .order("nama_lengkap");

    if (error) {
      toast.error("Gagal memuat data asatidz");
    } else {
      setAsatidzList(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editId) {
        const { error } = await supabase
          .from("halaqoh")
          .update(formData)
          .eq("id", editId);

        if (error) throw error;
        toast.success("Halaqoh berhasil diupdate");
      } else {
        const { error } = await supabase
          .from("halaqoh")
          .insert([formData]);

        if (error) throw error;
        toast.success("Halaqoh berhasil ditambahkan");
      }

      setIsOpen(false);
      resetForm();
      fetchHalaqoh();
    } catch (error) {
      toast.error("Gagal menyimpan halaqoh");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (halaqoh: Halaqoh) => {
    setEditId(halaqoh.id);
    setFormData({
      nama_halaqoh: halaqoh.nama_halaqoh,
      id_asatidz: halaqoh.id_asatidz || "",
      tingkat: halaqoh.tingkat || "",
    });
    setIsOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus halaqoh ini?")) return;

    const { error } = await supabase
      .from("halaqoh")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Gagal menghapus halaqoh");
    } else {
      toast.success("Halaqoh berhasil dihapus");
      fetchHalaqoh();
    }
  };

  const resetForm = () => {
    setEditId(null);
    setFormData({
      nama_halaqoh: "",
      id_asatidz: "",
      tingkat: "",
    });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Data Halaqoh</h1>
            <p className="text-muted-foreground">Kelola halaqoh tahfidz</p>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                Tambah Halaqoh
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editId ? "Edit Halaqoh" : "Tambah Halaqoh"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nama Halaqoh</Label>
                  <Input
                    value={formData.nama_halaqoh}
                    onChange={(e) => setFormData({ ...formData, nama_halaqoh: e.target.value })}
                    placeholder="Contoh: Halaqoh A"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Ustadz Pembimbing</Label>
                  <Select 
                    value={formData.id_asatidz} 
                    onValueChange={(value) => setFormData({ ...formData, id_asatidz: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Asatidz" />
                    </SelectTrigger>
                    <SelectContent>
                      {asatidzList.map((asatidz) => (
                        <SelectItem key={asatidz.id} value={asatidz.id}>
                          {asatidz.nama_lengkap}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tingkat</Label>
                  <Input
                    value={formData.tingkat}
                    onChange={(e) => setFormData({ ...formData, tingkat: e.target.value })}
                    placeholder="Contoh: Pemula, Menengah, Lanjutan"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
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

        <Card>
          <CardHeader>
            <CardTitle>Daftar Halaqoh</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Halaqoh</TableHead>
                  <TableHead>Ustadz Pembimbing</TableHead>
                  <TableHead>Tingkat</TableHead>
                  <TableHead>Jumlah Santri</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {halaqohList.map((halaqoh) => (
                  <TableRow key={halaqoh.id}>
                    <TableCell className="font-medium">{halaqoh.nama_halaqoh}</TableCell>
                    <TableCell>{halaqoh.profiles?.nama_lengkap || "-"}</TableCell>
                    <TableCell>{halaqoh.tingkat || "-"}</TableCell>
                    <TableCell>{halaqoh.jumlah_santri}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEdit(halaqoh)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(halaqoh.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
