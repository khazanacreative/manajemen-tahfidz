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
import { Plus, Pencil, Trash2, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Setoran {
  id: string;
  id_santri: string;
  id_asatidz: string;
  tanggal_setoran: string;
  juz: number;
  ayat_dari: number;
  ayat_sampai: number;
  nilai_kelancaran: number;
  status: string;
  catatan?: string;
  santri?: { nama_santri: string };
  profiles?: { nama_lengkap: string };
}

interface Santri {
  id: string;
  nama_santri: string;
}

export default function Setoran() {
  const [setoranList, setSetoranList] = useState<Setoran[]>([]);
  const [santriList, setSantriList] = useState<Santri[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  
  const [formData, setFormData] = useState({
    id_santri: "",
    tanggal_setoran: new Date().toISOString().split('T')[0],
    juz: 1,
    ayat_dari: 1,
    ayat_sampai: 1,
    nilai_kelancaran: 100,
    status: "Lancar",
    catatan: "",
  });

  useEffect(() => {
    getCurrentUser();
    fetchSetoran();
    fetchSantri();
  }, []);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);
  };

  const fetchSetoran = async () => {
    const { data, error } = await supabase
      .from("setoran")
      .select(`
        *,
        santri (nama_santri),
        profiles (nama_lengkap)
      `)
      .order("tanggal_setoran", { ascending: false });

    if (error) {
      toast.error("Gagal memuat data setoran");
    } else {
      setSetoranList(data || []);
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
          .from("setoran")
          .update(dataToSave)
          .eq("id", editId);

        if (error) throw error;
        toast.success("Setoran berhasil diupdate");
      } else {
        const { error } = await supabase
          .from("setoran")
          .insert([dataToSave]);

        if (error) throw error;
        toast.success("Setoran berhasil ditambahkan");
      }

      setIsOpen(false);
      resetForm();
      fetchSetoran();
    } catch (error) {
      toast.error("Gagal menyimpan setoran");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (setoran: Setoran) => {
    setEditId(setoran.id);
    setFormData({
      id_santri: setoran.id_santri,
      tanggal_setoran: setoran.tanggal_setoran,
      juz: setoran.juz,
      ayat_dari: setoran.ayat_dari,
      ayat_sampai: setoran.ayat_sampai,
      nilai_kelancaran: setoran.nilai_kelancaran,
      status: setoran.status,
      catatan: setoran.catatan || "",
    });
    setIsOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus setoran ini?")) return;

    const { error } = await supabase
      .from("setoran")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Gagal menghapus setoran");
    } else {
      toast.success("Setoran berhasil dihapus");
      fetchSetoran();
    }
  };

  const resetForm = () => {
    setEditId(null);
    setFormData({
      id_santri: "",
      tanggal_setoran: new Date().toISOString().split('T')[0],
      juz: 1,
      ayat_dari: 1,
      ayat_sampai: 1,
      nilai_kelancaran: 100,
      status: "Lancar",
      catatan: "",
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      "Lancar": "default",
      "Ulangi": "secondary",
      "Salah": "destructive",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Setoran Hafalan</h1>
            <p className="text-muted-foreground">Kelola setoran hafalan santri</p>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                Tambah Setoran
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editId ? "Edit Setoran" : "Tambah Setoran"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
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
                    <Label>Tanggal Setoran</Label>
                    <Input
                      type="date"
                      value={formData.tanggal_setoran}
                      onChange={(e) => setFormData({ ...formData, tanggal_setoran: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Juz</Label>
                    <Input
                      type="number"
                      min="1"
                      max="30"
                      value={formData.juz}
                      onChange={(e) => setFormData({ ...formData, juz: parseInt(e.target.value) })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Ayat Dari</Label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.ayat_dari}
                      onChange={(e) => setFormData({ ...formData, ayat_dari: parseInt(e.target.value) })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Ayat Sampai</Label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.ayat_sampai}
                      onChange={(e) => setFormData({ ...formData, ayat_sampai: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nilai Kelancaran (0-100)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.nilai_kelancaran}
                      onChange={(e) => setFormData({ ...formData, nilai_kelancaran: parseInt(e.target.value) })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select 
                      value={formData.status} 
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Lancar">Lancar</SelectItem>
                        <SelectItem value="Ulangi">Ulangi</SelectItem>
                        <SelectItem value="Salah">Salah</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Catatan</Label>
                  <Textarea
                    value={formData.catatan}
                    onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                    placeholder="Catatan tambahan..."
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
            <CardTitle>Daftar Setoran</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Santri</TableHead>
                  <TableHead>Juz</TableHead>
                  <TableHead>Ayat</TableHead>
                  <TableHead>Nilai</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Asatidz</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {setoranList.map((setoran) => (
                  <TableRow key={setoran.id}>
                    <TableCell>{new Date(setoran.tanggal_setoran).toLocaleDateString('id-ID')}</TableCell>
                    <TableCell>{setoran.santri?.nama_santri || "-"}</TableCell>
                    <TableCell>{setoran.juz}</TableCell>
                    <TableCell>{setoran.ayat_dari} - {setoran.ayat_sampai}</TableCell>
                    <TableCell>{setoran.nilai_kelancaran}</TableCell>
                    <TableCell>{getStatusBadge(setoran.status)}</TableCell>
                    <TableCell>{setoran.profiles?.nama_lengkap || "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEdit(setoran)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(setoran.id)}
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
