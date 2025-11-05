import React, { useEffect, useState } from "react"; // Ensure React is imported
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

interface Santri {
  id: string;
  nis: string;
  nama_santri: string;
  id_halaqoh?: string;
  id_wali?: string;
  tanggal_masuk: string;
  status: string;
  halaqoh?: { nama_halaqoh: string };
  profiles?: { nama_lengkap: string };
}

interface Halaqoh {
  id: string;
  nama_halaqoh: string;
}

export default function SantriPage() {
  // Dummy data shown before Supabase is connected or when fetch fails
  const DUMMY_HALAQOH: Halaqoh[] = [
    { id: "h-1", nama_halaqoh: "Halaqoh Umar bin Khattab" },
    { id: "h-2", nama_halaqoh: "Halaqoh Ali bin Abi Thalib" },
  ];

  const DUMMY_SANTRI: Santri[] = [
    { 
      id: "s-1", 
      nis: "2025001", 
      nama_santri: "Ahmad Santri", 
      id_halaqoh: "h-1",
      tanggal_masuk: "2025-01-01",
      status: "Aktif",
      halaqoh: { nama_halaqoh: "Halaqoh Umar bin Khattab" }
    },
    { 
      id: "s-2", 
      nis: "2025002", 
      nama_santri: "Budi Santri", 
      id_halaqoh: "h-2",
      tanggal_masuk: "2025-01-02",
      status: "Aktif",
      halaqoh: { nama_halaqoh: "Halaqoh Ali bin Abi Thalib" }
    },
  ];

  const [santriList, setSantriList] = useState<Santri[]>(DUMMY_SANTRI);
  const [halaqohList, setHalaqohList] = useState<Halaqoh[]>(DUMMY_HALAQOH);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    nis: "",
    nama_santri: "",
    id_halaqoh: "",
    tanggal_masuk: new Date().toISOString().split('T')[0],
    status: "Aktif",
  });

  useEffect(() => {
    fetchSantri();
    fetchHalaqoh();
  }, []);

  const fetchSantri = async () => {
    try {
      const { data, error } = await supabase
        .from("santri")
        .select("id, nis, nama_santri, id_halaqoh, tanggal_masuk, status, halaqoh (nama_halaqoh)")
        .order("nama_santri");

      if (error) {
        console.error("Error fetching santri:", error);
        toast.error("Gagal memuat data santri");
        return;
      }

      setSantriList(data || []);
    } catch (err) {
      console.error("Unexpected error fetching santri:", err);
      toast.error("Terjadi kesalahan saat memuat data santri");
    }
  };

  const fetchHalaqoh = async () => {
    const { data, error } = await supabase
      .from("halaqoh")
      .select("id, nama_halaqoh")
      .order("nama_halaqoh");

    if (error) {
      toast.error("Gagal memuat data halaqoh");
    } else {
      setHalaqohList(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Input validation
    if (!formData.nis || !formData.nama_santri) {
      toast.error("NIS dan Nama Santri wajib diisi");
      setLoading(false);
      return;
    }

    if (new Date(formData.tanggal_masuk) > new Date()) {
      toast.error("Tanggal masuk tidak boleh di masa depan");
      setLoading(false);
      return;
    }

    try {
      if (editId) {
        const { error } = await supabase
          .from("santri")
          .update(formData)
          .eq("id", editId);

        if (error) throw error;
        toast.success("Data santri berhasil diupdate");
      } else {
        const { error } = await supabase
          .from("santri")
          .insert([formData]);

        if (error) throw error;
        toast.success("Data santri berhasil ditambahkan");
      }

      setIsOpen(false);
      resetForm();
      fetchSantri();
    } catch (error) {
      console.error("Error saving santri:", error);
      toast.error("Gagal menyimpan data santri");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (santri: Santri) => {
    setEditId(santri.id);
    setFormData({
      nis: santri.nis,
      nama_santri: santri.nama_santri,
      id_halaqoh: santri.id_halaqoh || "",
      tanggal_masuk: santri.tanggal_masuk,
      status: santri.status,
    });
    setIsOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus santri ini?")) return;

    const { error } = await supabase
      .from("santri")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Gagal menghapus santri");
    } else {
      toast.success("Santri berhasil dihapus");
      fetchSantri();
    }
  };

  const resetForm = () => {
    setEditId(null);
    setFormData({
      nis: "",
      nama_santri: "",
      id_halaqoh: "",
      tanggal_masuk: new Date().toISOString().split('T')[0],
      status: "Aktif",
    });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Data Santri</h1>
            <p className="text-muted-foreground">Kelola data santri tahfidz</p>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                Tambah Santri
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editId ? "Edit Santri" : "Tambah Santri"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>NIS</Label>
                  <Input
                    value={formData.nis}
                    onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                    placeholder="Nomor Induk Santri"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Nama Lengkap</Label>
                  <Input
                    value={formData.nama_santri}
                    onChange={(e) => setFormData({ ...formData, nama_santri: e.target.value })}
                    placeholder="Nama lengkap santri"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Halaqoh</Label>
                  <Select 
                    value={formData.id_halaqoh} 
                    onValueChange={(value) => setFormData({ ...formData, id_halaqoh: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Halaqoh" />
                    </SelectTrigger>
                    <SelectContent>
                      {halaqohList.map((halaqoh) => (
                        <SelectItem key={halaqoh.id} value={halaqoh.id}>
                          {halaqoh.nama_halaqoh}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tanggal Masuk</Label>
                  <Input
                    type="date"
                    value={formData.tanggal_masuk}
                    onChange={(e) => setFormData({ ...formData, tanggal_masuk: e.target.value })}
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
                      <SelectItem value="Aktif">Aktif</SelectItem>
                      <SelectItem value="Nonaktif">Nonaktif</SelectItem>
                    </SelectContent>
                  </Select>
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
            <CardTitle>Daftar Santri</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-6">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>NIS</TableHead>
                    <TableHead>Nama Santri</TableHead>
                    <TableHead>Halaqoh</TableHead>
                    <TableHead>Tanggal Masuk</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {santriList.map((santri) => (
                    <TableRow key={santri.id}>
                      <TableCell>{santri.nis}</TableCell>
                      <TableCell className="font-medium">{santri.nama_santri}</TableCell>
                      <TableCell>{santri.halaqoh?.nama_halaqoh || "-"}</TableCell>
                      <TableCell>{new Date(santri.tanggal_masuk).toLocaleDateString("id-ID")}</TableCell>
                      <TableCell>
                        <Badge variant={santri.status === "Aktif" ? "default" : "secondary"}>
                          {santri.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEdit(santri)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDelete(santri.id)}
                          >
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
