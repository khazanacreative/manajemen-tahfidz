import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { getDummyProfile, getDummyHalaqoh } from "@/lib/offline-db";
import { useSupabaseOrDummy } from "@/hooks/use-supabase-or-dummy";

interface Halaqoh {
  id: string;
  nama_halaqoh: string;
  id_asatidz?: string | null;
  tingkat?: string | null;
  jumlah_santri?: number;
  asatidz?: { nama_lengkap: string };
}

interface Asatidz {
  id: string;
  nama_lengkap: string;
}

export default function HalaqohPage() {
  const { 
    data: halaqohList, 
    loading, 
    addData: addHalaqoh,
    updateData: updateHalaqoh,
    deleteData: deleteHalaqoh,
    syncStatus 
  } = useSupabaseOrDummy<Halaqoh>('halaqoh', {
    defaultDummyData: getDummyHalaqoh() as Halaqoh[],
  });

  const { 
    data: asatidzList 
  } = useSupabaseOrDummy<Asatidz>('profiles', {
    defaultDummyData: getDummyProfile() as any[],
    initialFilters: [{ column: 'role', value: 'Asatidz' }]
  });

  const [isOpen, setIsOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nama_halaqoh: "",
    id_asatidz: "",
    tingkat: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editId) {
        await updateHalaqoh(editId, formData);
        toast.success("Halaqoh berhasil diperbarui");
      } else {
        await addHalaqoh(formData);
        toast.success("Halaqoh baru berhasil ditambahkan");
      }

      setIsOpen(false);
      resetForm();
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan saat menyimpan data");
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

    try {
      await deleteHalaqoh(id);
      toast.success("Halaqoh berhasil dihapus");
    } catch (error) {
      toast.error("Gagal menghapus halaqoh");
    }
  };

  const resetForm = () => {
    setEditId(null);
    setFormData({ nama_halaqoh: "", id_asatidz: "", tingkat: "" });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Data Halaqoh</h1>
            <p className="text-muted-foreground">Kelola data halaqoh tahfidz</p>
          </div>

          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" /> Tambah Halaqoh
              </Button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editId ? "Edit Halaqoh" : "Tambah Halaqoh Baru"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nama Halaqoh</Label>
                  <Input
                    value={formData.nama_halaqoh}
                    onChange={(e) => setFormData({ ...formData, nama_halaqoh: e.target.value })}
                    placeholder="Contoh: Halaqoh Umar bin Khattab"
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
            {loading ? (
              <p className="text-center text-muted-foreground py-4">Memuat data...</p>
            ) : (
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
                  {halaqohList.map((h) => (
                    <TableRow key={h.id}>
                      <TableCell className="font-medium">{h.nama_halaqoh}</TableCell>
                      <TableCell>{h.asatidz?.nama_lengkap || "-"}</TableCell>
                      <TableCell>{h.tingkat || "-"}</TableCell>
                      <TableCell>{h.jumlah_santri ?? 0}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="icon" variant="ghost" onClick={() => handleEdit(h)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDelete(h.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
