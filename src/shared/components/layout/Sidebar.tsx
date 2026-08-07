import { NavLink } from "react-router-dom";

import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  ClipboardCheck,
} from "lucide-react";

export function Sidebar() {
  return (
    <aside className="w-64 border-r bg-background p-4">

      <h1 className="mb-8 text-2xl font-bold">
        EBD Manager
      </h1>

      <nav className="space-y-2">

        <NavLink
          to="/"
          className="block rounded-md px-3 py-2 hover:bg-muted"
        >
          <div className="flex items-center gap-3">
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </div>
        </NavLink>

        <NavLink
          to="/pessoas"
          className="block rounded-md px-3 py-2 hover:bg-muted"
        >
          <div className="flex items-center gap-3">
            <Users size={18} />
            <span>Pessoas</span>
          </div>
        </NavLink>

        <NavLink
          to="/classes"
          className="block rounded-md px-3 py-2 hover:bg-muted"
        >
          <div className="flex items-center gap-3">
            <GraduationCap size={18} />
            <span>Classes</span>
          </div>
        </NavLink>

        <NavLink
          to="/aulas"
          className="block rounded-md px-3 py-2 hover:bg-muted"
        >
          <div className="flex items-center gap-3">
            <BookOpen size={18} />
            <span>Aulas</span>
          </div>
        </NavLink>

        <NavLink
          to="/presencas"
          className="block rounded-md px-3 py-2 hover:bg-muted"
        >
          <div className="flex items-center gap-3">
            <ClipboardCheck size={18} />
            <span>Presenças</span>
          </div>
        </NavLink>

      </nav>

    </aside>
  );
}