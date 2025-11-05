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
  // Dummy data to show before Supabase is connected
  const DUMMY_ASATIDZ: Asatidz[] = [
    { id: "as-1", nama_lengkap: "Ustadz Ahmad" },
    { id: "as-2", nama_lengkap: "Ustadz Budi" },
  ];

  const DUMMY_HALAQOH: Halaqoh[] = [
    { id: "h-1", nama_halaqoh: "Halaqoh Umar bin Khattab", id_asatidz: "as-1", tingkat: "Pemula", jumlah_santri: 2, asatidz: { nama_lengkap: "Ustadz Ahmad" } },
    { id: "h-2", nama_halaqoh: "Halaqoh Ali bin Abi Thalib", id_asatidz: "as-2", tingkat: "Menengah", jumlah_santri: 1, asatidz: { nama_lengkap: "Ustadz Budi" } },
  ];

  const [halaqohList, setHalaqohList] = useState<Halaqoh[]>(DUMMY_HALAQOH);
  const [asatidzList, setAsatidzList] = useState<Asatidz[]>(DUMMY_ASATIDZ);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nama_halaqoh: "",
    id_asatidz: "",
    tingkat: "",
  });

  useEffect(() => {
    fetchAsatidz();
    fetchHalaqoh();
  }, []);

  // ✅ Fetch list ustadz
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

  // ✅ Fetch list halaqoh + jumlah santri + nama asatidz
  const fetchHalaqoh = async () => {
    setLoading(true);
    try {
      // Fetch basic halaqoh rows
      const { data: halaqohData, error: halaqohError } = await supabase
        .from("halaqoh")
        .select("id, nama_halaqoh, id_asatidz, tingkat")
        .order("nama_halaqoh");

      if (halaqohError) throw halaqohError;

      const rows = halaqohData || [];

      // Collect asatidz ids and fetch profiles in one query
      const asatidzIds = Array.from(new Set(rows.map((r: any) => r.id_asatidz).filter(Boolean)));
      let profilesMap: Record<string, { nama_lengkap: string }> = {};

      if (asatidzIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, nama_lengkap")
          .in("id", asatidzIds as any[]);

        (profiles || []).forEach((p: any) => {
          profilesMap[p.id] = { nama_lengkap: p.nama_lengkap };
        });
      }

      // For each halaqoh, count santri and attach asatidz name
      const halaqohWithCount = await Promise.all(
        rows.map(async (h: any) => {
          const { count } = await supabase
            .from("santri")
            .select("*", { count: "exact", head: true })
            .eq("id_halaqoh", h.id as string);

          return {
            id: h.id,
            nama_halaqoh: h.nama_halaqoh,
            id_asatidz: h.id_asatidz || null,
            tingkat: h.tingkat || null,
            jumlah_santri: count || 0,
            asatidz: h.id_asatidz ? profilesMap[h.id_asatidz] || null : null,
          } as Halaqoh;
        })
      );

      setHalaqohList(halaqohWithCount);
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat data halaqoh");
    } finally {
      setLoading(false);
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
        toast.success("Halaqoh berhasil diperbarui");
      } else {
        const { error } = await supabase.from("halaqoh").insert([formData]);
        if (error) throw error;
        toast.success("Halaqoh baru berhasil ditambahkan");
      }

      setIsOpen(false);
      resetForm();
      fetchHalaqoh();
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan saat menyimpan data");
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

    const { error } = await supabase.from("halaqoh").delete().eq("id", id);

    if (error) {
      toast.error("Gagal menghapus halaqoh");
    } else {
      toast.success("Halaqoh berhasil dihapus");
      fetchHalaqoh();
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
