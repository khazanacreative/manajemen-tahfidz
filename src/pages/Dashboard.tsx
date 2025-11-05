import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookMarked, BookOpen, TrendingUp } from "lucide-react";
import { Layout } from "@/components/Layout";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalSantri: 0,
    totalHalaqoh: 0,
    totalSetoran: 0,
    avgKelancaran: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const [santriRes, halaqohRes, setoranRes] = await Promise.all([
      supabase.from("santri").select("*", { count: "exact" }),
      supabase.from("halaqoh").select("*", { count: "exact" }),
      supabase.from("setoran").select("nilai_kelancaran"),
    ]);

    const avgKelancaran = setoranRes.data?.length
      ? setoranRes.data.reduce((acc, curr) => acc + (curr.nilai_kelancaran || 0), 0) / setoranRes.data.length
      : 0;

    setStats({
      totalSantri: santriRes.count || 0,
      totalHalaqoh: halaqohRes.count || 0,
      totalSetoran: setoranRes.data?.length || 0,
      avgKelancaran: Math.round(avgKelancaran),
    });
  };

  const statCards = [
    {
      title: "Total Santri",
      value: stats.totalSantri,
      icon: Users,
      gradient: "from-primary to-primary-glow",
    },
    {
      title: "Total Halaqoh",
      value: stats.totalHalaqoh,
      icon: BookMarked,
      gradient: "from-secondary to-secondary/80",
    },
    {
      title: "Total Setoran",
      value: stats.totalSetoran,
      icon: BookOpen,
      gradient: "from-chart-3 to-chart-3/80",
    },
    {
      title: "Rata-rata Kelancaran",
      value: `${stats.avgKelancaran}%`,
      icon: TrendingUp,
      gradient: "from-chart-4 to-chart-4/80",
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard Tahfidz</h1>
          <p className="text-muted-foreground mt-1">
            Selamat datang di sistem manajemen hafalan Al-Qur'an
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card) => (
            <Card key={card.title} className="overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${card.gradient} flex items-center justify-center`}>
                  <card.icon className="w-5 h-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{card.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informasi Sistem</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                <span className="text-muted-foreground">
                  Sistem manajemen tahfidz dengan fitur lengkap untuk pengelolaan hafalan santri
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full bg-secondary"></div>
                <span className="text-muted-foreground">
                  Dilengkapi dengan fitur setoran, absensi, penilaian, dan laporan
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full bg-chart-3"></div>
                <span className="text-muted-foreground">
                  Akses berbasis role untuk Admin, Koordinator, Asatidz, Wali Santri, dan Yayasan
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
