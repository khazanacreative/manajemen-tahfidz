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
  // Dummy data shown before Supabase is connected or when fetch fails
  const DUMMY_SANTRI: Santri[] = [
    { id: "s-1", nama_santri: "Ahmad Santri" },
    { id: "s-2", nama_santri: "Budi Santri" },
  ];

  const DUMMY_SETORAN: Setoran[] = [
    {
      id: "set-1",
      id_santri: "s-1",
      id_asatidz: "as-1",
      tanggal_setoran: "2025-01-01",
      juz: 1,
      ayat_dari: 1,
      ayat_sampai: 7,
      nilai_kelancaran: 90,
      status: "Lancar",
      catatan: "Alhamdulillah lancar",
      santri: { nama_santri: "Ahmad Santri" },
      profiles: { nama_lengkap: "Ustadz Ahmad" }
    },
    {
      id: "set-2",
      id_santri: "s-2",
      id_asatidz: "as-2",
      tanggal_setoran: "2025-01-02",
      juz: 1,
      ayat_dari: 8,
      ayat_sampai: 15,
      nilai_kelancaran: 75,
      status: "Ulangi",
      catatan: "Perlu mengulang pada ayat 10-12",
      santri: { nama_santri: "Budi Santri" },
      profiles: { nama_lengkap: "Ustadz Budi" }
    },
  ];

  const [setoranList, setSetoranList] = useState<Setoran[]>(DUMMY_SETORAN);
  const [santriList, setSantriList] = useState<Santri[]>(DUMMY_SANTRI);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>("as-1"); // Default dummy ID
  
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
    // Temporarily disabled for dummy data mode
    // getCurrentUser();
    // fetchSetoran();
    // fetchSantri();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simulating server interaction with dummy data
      const newData = {
        id: `set-${Date.now()}`,
        ...formData,
        id_asatidz: currentUserId,
        santri: DUMMY_SANTRI.find(s => s.id === formData.id_santri),
        profiles: { nama_lengkap: "Ustadz Ahmad" }
      };

      if (editId) {
        setSetoranList(prev => prev.map(item => 
          item.id === editId ? newData : item
        ));
        toast.success("Setoran berhasil diupdate");
      } else {
        setSetoranList(prev => [...prev, newData]);
        toast.success("Setoran berhasil ditambahkan");
      }

      setIsOpen(false);
      resetForm();
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

    try {
      // Simulating server interaction with dummy data
      setSetoranList(prev => prev.filter(item => item.id !== id));
      toast.success("Setoran berhasil dihapus");
    } catch (error) {
      toast.error("Gagal menghapus setoran");
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
