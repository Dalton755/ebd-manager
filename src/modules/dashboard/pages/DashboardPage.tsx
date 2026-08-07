import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  ClipboardCheck,
} from "lucide-react";

import { PageHeader } from "@/shared/components/ui/PageHeader";
import { StatCard } from "@/shared/components/dashboard/StatCard";

export function DashboardPage() {
  return (
    <div className="space-y-8">

      <PageHeader
        title="Dashboard"
        subtitle="Visão geral da Escola Bíblica"
        icon={LayoutDashboard}
      />

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

        <StatCard
          title="Pessoas"
          value={3}
          icon={Users}
          color="bg-blue-100 text-blue-600"
        />

        <StatCard
          title="Classes"
          value={0}
          icon={GraduationCap}
          color="bg-green-100 text-green-600"
        />

        <StatCard
          title="Aulas"
          value={0}
          icon={BookOpen}
          color="bg-purple-100 text-purple-600"
        />

        <StatCard
          title="Presenças"
          value={0}
          icon={ClipboardCheck}
          color="bg-orange-100 text-orange-600"
        />

      </div>

    </div>
  );
}