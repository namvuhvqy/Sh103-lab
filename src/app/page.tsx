import { AppShell } from "@/components/shell/AppShell";
import { AREAS } from "@/constants/areas";
import { DataCard } from "@/components/ui/DataCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";

export default function Home() {
  return (
    <AppShell headerTitle="SH103 Sinh Hóa" headerSubtitle="Khoa Sinh Hóa">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-zinc-200 pb-4">
          <div>
            <h2 className="text-xl font-bold text-zinc-900">Khu vực làm việc</h2>
            <p className="text-xs text-zinc-500">
              Chọn khu vực chuyên môn để xem thiết bị và nhập nhật ký ca
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-zinc-400" /> Ca hiện tại:{" "}
              <strong className="text-zinc-700">07:00–11:30</strong>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {AREAS.map((area) => (
            <Link key={area.code} href={area.href} className="group block">
              <DataCard
                title={area.name}
                subtitle={area.description}
                badge={
                  <StatusBadge
                    status="PENDING"
                    className="group-hover:opacity-90"
                  />
                }
                className="h-full hover:border-teal-500 transition-colors"
              >
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-100 text-xs text-zinc-500">
                  <span className="font-medium text-zinc-700">
                    {area.deviceCount > 0
                      ? `${area.deviceCount} máy xét nghiệm`
                      : "Biểu mẫu khử nhiễm"}
                  </span>
                  <span className="text-teal-600 font-semibold inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    Vào khu vực <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </DataCard>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
