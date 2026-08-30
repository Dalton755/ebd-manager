import {
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  Home,
  Settings,
  Users,
  BarChart3,
  Wallet,
  Building2
} from "lucide-react";

export const menu = [
  {
    title: "Dashboard",
    path: "/",
    icon: Home,
  },
  {
    title: "Pessoas",
    path: "/pessoas",
    icon: Users,
  },
  {
    title: "Ensino",
    path: "/ensino",
    icon: BookOpen,
  },
  {
    title: "Eventos",
    path: "/eventos",
    icon: CalendarDays,
  },
  {
    title: "Presenças",
    path: "/presencas",
    icon: ClipboardCheck,
  },
  {
    title: "Financeiro",
    path: "/financeiro",
    icon: Wallet,
  },
  {
    title: "Relatórios",
    path: "/relatorios",
    icon: BarChart3,
  },
  {
    title: "Administração",
    path: "/administracao",
    icon: Settings,
  },

  {
    title: "Personalização",
    path: "/administracao/personalizacao",
    icon: Building2,
  },
];