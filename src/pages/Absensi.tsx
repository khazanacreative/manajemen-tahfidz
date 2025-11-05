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
  // Dummy data shown before Supabase is connected or when fetch fails
  const DUMMY_SANTRI: Santri[] = [
    { id: "santri-1", nama_santri: "Santri A", nis: "S001" },
    { id: "santri-2", nama_santri: "Santri B", nis: "S002" },
    { id: "santri-3", nama_santri: "Santri C", nis: "S003" },
  ];

  const DUMMY_ABSENSI: Absensi[] = [
    { id: "abs-1", id_santri: "santri-1", tanggal: new Date().toISOString(), status_kehadiran: "Hadir", santri: { nama_santri: "Santri A", nis: "S001" } },
    { id: "abs-2", id_santri: "santri-2", tanggal: new Date().toISOString(), status_kehadiran: "Izin", santri: { nama_santri: "Santri B", nis: "S002" } },
  ];

  const [absensiList, setAbsensiList] = useState<Absensi[]>(DUMMY_ABSENSI);
  const [santriList, setSantriList] = useState<Santri[]>(DUMMY_SANTRI);
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
    setLoading(true);
    try {
      const { data: absensiData, error: absensiError } = await supabase
        .from("absensi")
        .select("id, id_santri, tanggal, status_kehadiran, keterangan")
        .order("tanggal", { ascending: false });

      if (absensiError) throw absensiError;

      const rows = absensiData || [];

      // Collect santri ids referenced in absensi
      const santriIds = Array.from(new Set(rows.map((r: any) => r.id_santri).filter(Boolean)));

      let santriMap: Record<string, { nama_santri: string; nis: string }> = {};
      if (santriIds.length > 0) {
        const { data: santriData } = await supabase
          .from("santri")
          .select("id, nama_santri, nis")
          .in("id", santriIds as any[]);

        (santriData || []).forEach((s: any) => {
          santriMap[s.id] = { nama_santri: s.nama_santri, nis: s.nis };
        });
      }

      const mapped = rows.map((r: any) => ({
        id: r.id,
        id_santri: r.id_santri,
        tanggal: r.tanggal,
        status_kehadiran: r.status_kehadiran,
        keterangan: r.keterangan,
        santri: r.id_santri ? santriMap[r.id_santri] || null : null,
      } as Absensi));

      setAbsensiList(mapped);
    } catch (err) {
      console.error(err);
      toast.error("Gagal memuat data absensi");
    } finally {
      setLoading(false);
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
      // Basic validation
      if (!formData.id_santri) {
        toast.error("Pilih santri terlebih dahulu");
        setLoading(false);
        return;
      }

      // Ensure tanggal is a string (YYYY-MM-DD)
      const payload = {
        id_santri: formData.id_santri,
        tanggal: formData.tanggal,
        status_kehadiran: formData.status_kehadiran,
        keterangan: formData.keterangan || null,
      } as any;

      if (editId) {
        const { data, error } = await supabase
          .from("absensi")
          .update(payload)
          .eq("id", editId)
          .select()
          .single();

        if (error) throw error;
        toast.success("Absensi berhasil diupdate");
      } else {
        const { data, error } = await supabase
          .from("absensi")
          .insert([payload])
          .select()
          .single();

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

  const safeFormatDate = (d: any) => {
    try {
      if (!d) return "-";
      const date = new Date(d);
      if (isNaN(date.getTime())) return String(d);
      return date.toLocaleDateString("id-ID");
    } catch (e) {
      return String(d || "-");
    }
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
                    <TableCell>{safeFormatDate(absensi.tanggal)}</TableCell>
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
