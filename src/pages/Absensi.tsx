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
import { Badge } from "@/components/ui/badge";

interface Absensi {
  id: string;
  id_santri: string;
  tanggal: string;
  status_kehadiran: string;
  keterangan?: string;
  santri?: { nama_santri: string; nis: string };
}

interface Santri {
  id: string;
  nama_santri: string;
  nis: string;
}

export default function AbsensiPage() {
  const [absensiList, setAbsensiList] = useState<Absensi[]>([]);
  const [santriList, setSantriList] = useState<Santri[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    id_santri: "",
    tanggal: new Date().toISOString().split('T')[0],
    status_kehadiran: "Hadir",
    keterangan: "",
  });

  useEffect(() => {
    fetchAbsensi();
    fetchSantri();
  }, []);

  const fetchAbsensi = async () => {
    const { data, error } = await supabase
      .from("absensi")
      .select(`
        *,
        santri (nama_santri, nis)
      `)
      .order("tanggal", { ascending: false });

    if (error) {
      toast.error("Gagal memuat data absensi");
    } else {
      setAbsensiList(data || []);
    }
  };

  const fetchSantri = async () => {
    const { data, error } = await supabase
      .from("santri")
      .select("id, nama_santri, nis")
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
      if (editId) {
        const { error } = await supabase
          .from("absensi")
          .update(formData)
          .eq("id", editId);

        if (error) throw error;
        toast.success("Absensi berhasil diupdate");
      } else {
        const { error } = await supabase
          .from("absensi")
          .insert([formData]);

        if (error) throw error;
        toast.success("Absensi berhasil ditambahkan");
      }

      setIsOpen(false);
      resetForm();
      fetchAbsensi();
    } catch (error) {
      toast.error("Gagal menyimpan absensi");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (absensi: Absensi) => {
    setEditId(absensi.id);
    setFormData({
      id_santri: absensi.id_santri,
      tanggal: absensi.tanggal,
      status_kehadiran: absensi.status_kehadiran,
      keterangan: absensi.keterangan || "",
    });
    setIsOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus absensi ini?")) return;

    const { error } = await supabase
      .from("absensi")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Gagal menghapus absensi");
    } else {
      toast.success("Absensi berhasil dihapus");
      fetchAbsensi();
    }
  };

  const resetForm = () => {
    setEditId(null);
    setFormData({
      id_santri: "",
      tanggal: new Date().toISOString().split('T')[0],
      status_kehadiran: "Hadir",
      keterangan: "",
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      "Hadir": "default",
      "Izin": "secondary",
      "Sakit": "outline",
      "Alfa": "destructive",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Absensi Setoran</h1>
            <p className="text-muted-foreground">Kelola kehadiran santri</p>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                Tambah Absensi
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editId ? "Edit Absensi" : "Tambah Absensi"}</DialogTitle>
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
                          {santri.nama_santri} - {santri.nis}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tanggal</Label>
                  <Input
                    type="date"
                    value={formData.tanggal}
                    onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Status Kehadiran</Label>
                  <Select 
                    value={formData.status_kehadiran} 
                    onValueChange={(value) => setFormData({ ...formData, status_kehadiran: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Hadir">Hadir</SelectItem>
                      <SelectItem value="Izin">Izin</SelectItem>
                      <SelectItem value="Sakit">Sakit</SelectItem>
                      <SelectItem value="Alfa">Alfa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Keterangan</Label>
                  <Input
                    value={formData.keterangan}
                    onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                    placeholder="Keterangan (opsional)"
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
            <CardTitle>Daftar Absensi</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>NIS</TableHead>
                  <TableHead>Nama Santri</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Keterangan</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {absensiList.map((absensi) => (
                  <TableRow key={absensi.id}>
                    <TableCell>{new Date(absensi.tanggal).toLocaleDateString('id-ID')}</TableCell>
                    <TableCell>{absensi.santri?.nis || "-"}</TableCell>
                    <TableCell className="font-medium">{absensi.santri?.nama_santri || "-"}</TableCell>
                    <TableCell>{getStatusBadge(absensi.status_kehadiran)}</TableCell>
                    <TableCell>{absensi.keterangan || "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEdit(absensi)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(absensi.id)}
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
