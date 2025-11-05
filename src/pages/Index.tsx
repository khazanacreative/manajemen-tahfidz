import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, ClipboardCheck, BarChart3 } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-6 max-w-4xl mx-auto">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary-glow shadow-lg animate-fade-in">
            <BookOpen className="w-10 h-10 text-primary-foreground" />
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-foreground animate-fade-in">
            Tahfidz Management System
          </h1>
          
          <p className="text-xl text-muted-foreground animate-fade-in" style={{ animationDelay: "0.2s" }}>
            Sistem Manajemen Hafalan Al-Qur'an yang Modern dan Terintegrasi
          </p>

          <div className="flex gap-4 justify-center animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <Button size="lg" onClick={() => navigate("/auth")}>
              Mulai Sekarang
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/auth")}>
              Login
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-20 max-w-6xl mx-auto">
          {[
            {
              icon: BookOpen,
              title: "Setoran Hafalan",
              description: "Catat dan pantau progress hafalan santri secara real-time",
            },
            {
              icon: Users,
              title: "Multi-Role Access",
              description: "Admin, Asatidz, Wali Santri, dan Yayasan dalam satu sistem",
            },
            {
              icon: ClipboardCheck,
              title: "Absensi & Penilaian",
              description: "Kelola kehadiran dan evaluasi santri dengan mudah",
            },
            {
              icon: BarChart3,
              title: "Laporan Lengkap",
              description: "Dashboard statistik dan laporan yang komprehensif",
            },
          ].map((feature, index) => (
            <div
              key={feature.title}
              className="p-6 rounded-xl bg-card border border-border hover:shadow-lg transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${0.6 + index * 0.1}s` }}
            >
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;
