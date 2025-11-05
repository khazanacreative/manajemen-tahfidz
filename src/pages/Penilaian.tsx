import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface Penilaian {
  id: string;
  id_santri: string;
  id_asatidz: string;
  tanggal_penilaian: string;
  tajwid: number;
  makharij: number;
  kelancaran: number;
  catatan?: string;
  santri?: { nama_santri: string };
  profiles?: { nama_lengkap: string };
}

interface Santri {
  id: string;
  nama_santri: string;
}

export default function PenilaianPage() {
  // Dummy data shown before Supabase is connected or when fetch fails
  const DUMMY_SANTRI: Santri[] = [
    { id: "s-1", nama_santri: "Ahmad Santri" },
    { id: "s-2", nama_santri: "Budi Santri" },
  ];

  const DUMMY_PENILAIAN: Penilaian[] = [
    {
      id: "p-1",
      id_santri: "s-1",
      id_asatidz: "as-1",
      tanggal_penilaian: "2025-01-01",
      tajwid: 85,
      makharij: 80,
      kelancaran: 90,
      catatan: "Perlu perbaikan pada mad wajib",
      santri: { nama_santri: "Ahmad Santri" },
      profiles: { nama_lengkap: "Ustadz Ahmad" }
    },
    {
      id: "p-2",
      id_santri: "s-2",
      id_asatidz: "as-2",
      tanggal_penilaian: "2025-01-02",
      tajwid: 75,
      makharij: 85,
      kelancaran: 80,
      catatan: "Sudah lebih lancar dari sebelumnya",
      santri: { nama_santri: "Budi Santri" },
      profiles: { nama_lengkap: "Ustadz Budi" }
    },
  ];

  const [penilaianList, setPenilaianList] = useState<Penilaian[]>(DUMMY_PENILAIAN);
  const [santriList, setSantriList] = useState<Santri[]>(DUMMY_SANTRI);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>("as-1"); // Default dummy ID
  
  const [formData, setFormData] = useState({
    id_santri: "",
    tanggal_penilaian: new Date().toISOString().split('T')[0],
    tajwid: 80,
    makharij: 80,
    kelancaran: 80,
    catatan: "",
  });

  useEffect(() => {
    getCurrentUser();
    fetchPenilaian();
    fetchSantri();
  }, []);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);
  };

  const fetchPenilaian = async () => {
    const { data, error } = await supabase
      .from("penilaian")
      .select(`
        *,
        santri (nama_santri),
        profiles (nama_lengkap)
      `)
      .order("tanggal_penilaian", { ascending: false });

    if (error) {
      toast.error("Gagal memuat data penilaian");
    } else {
      setPenilaianList(data || []);
    }
  };

  const fetchSantri = async () => {
    const { data, error } = await supabase
      .from("santri")
      .select("id, nama_santri")
      .eq("status", "Aktif")
      .order("nama_santri");

    if (error) {
      toast.error("Gagal memuat data santri");
    } else {
      setSantriList(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dataToSave = {
        ...formData,
        id_asatidz: currentUserId,
      };

      if (editId) {
        const { error } = await supabase
          .from("penilaian")
          .update(dataToSave)
          .eq("id", editId);

        if (error) throw error;
        toast.success("Penilaian berhasil diupdate");
      } else {
        const { error } = await supabase
          .from("penilaian")
          .insert([dataToSave]);

        if (error) throw error;
        toast.success("Penilaian berhasil ditambahkan");
      }

      setIsOpen(false);
      resetForm();
      fetchPenilaian();
    } catch (error) {
      toast.error("Gagal menyimpan penilaian");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (penilaian: Penilaian) => {
    setEditId(penilaian.id);
    setFormData({
      id_santri: penilaian.id_santri,
      tanggal_penilaian: penilaian.tanggal_penilaian,
      tajwid: penilaian.tajwid,
      makharij: penilaian.makharij,
      kelancaran: penilaian.kelancaran,
      catatan: penilaian.catatan || "",
    });
    setIsOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus penilaian ini?")) return;

    const { error } = await supabase
      .from("penilaian")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Gagal menghapus penilaian");
    } else {
      toast.success("Penilaian berhasil dihapus");
      fetchPenilaian();
    }
  };

  const resetForm = () => {
    setEditId(null);
    setFormData({
      id_santri: "",
      tanggal_penilaian: new Date().toISOString().split('T')[0],
      tajwid: 80,
      makharij: 80,
      kelancaran: 80,
      catatan: "",
    });
  };

  const getRataRata = (tajwid: number, makharij: number, kelancaran: number) => {
    return Math.round((tajwid + makharij + kelancaran) / 3);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Penilaian & Evaluasi</h1>
            <p className="text-muted-foreground">Kelola penilaian santri</p>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                Tambah Penilaian
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editId ? "Edit Penilaian" : "Tambah Penilaian"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Santri</Label>
                  <Select 
                    value={formData.id_santri} 
                    onValueChange={(value) => setFormData({ ...formData, id_santri: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Santri" />
                    </SelectTrigger>
                    <SelectContent>
                      {santriList.map((santri) => (
                        <SelectItem key={santri.id} value={santri.id}>
                          {santri.nama_santri}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tanggal Penilaian</Label>
                  <Input
                    type="date"
                    value={formData.tanggal_penilaian}
                    onChange={(e) => setFormData({ ...formData, tanggal_penilaian: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Tajwid (0-100)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.tajwid}
                      onChange={(e) => setFormData({ ...formData, tajwid: parseInt(e.target.value) })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Makharij (0-100)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.makharij}
                      onChange={(e) => setFormData({ ...formData, makharij: parseInt(e.target.value) })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Kelancaran (0-100)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.kelancaran}
                      onChange={(e) => setFormData({ ...formData, kelancaran: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Catatan Evaluasi</Label>
                  <Textarea
                    value={formData.catatan}
                    onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                    placeholder="Catatan evaluasi..."
                    rows={3}
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
            <CardTitle>Daftar Penilaian</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Santri</TableHead>
                  <TableHead>Tajwid</TableHead>
                  <TableHead>Makharij</TableHead>
                  <TableHead>Kelancaran</TableHead>
                  <TableHead>Rata-rata</TableHead>
                  <TableHead>Penilai</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {penilaianList.map((nilai) => (
                  <TableRow key={nilai.id}>
                    <TableCell>{new Date(nilai.tanggal_penilaian).toLocaleDateString('id-ID')}</TableCell>
                    <TableCell className="font-medium">{nilai.santri?.nama_santri || "-"}</TableCell>
                    <TableCell>{nilai.tajwid}</TableCell>
                    <TableCell>{nilai.makharij}</TableCell>
                    <TableCell>{nilai.kelancaran}</TableCell>
                    <TableCell className="font-semibold">
                      {getRataRata(nilai.tajwid, nilai.makharij, nilai.kelancaran)}
                    </TableCell>
                    <TableCell>{nilai.profiles?.nama_lengkap || "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEdit(nilai)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(nilai.id)}
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
