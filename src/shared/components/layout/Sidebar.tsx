import { menu } from "@/shared/constants/menu";

export function Sidebar() {
  return (
    <aside className="w-64 border-r bg-white">
      <div className="border-b p-5">
        <h2 className="font-bold">Menu</h2>
      </div>

      <nav className="p-3">
        {menu.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.path}
              className="mb-2 flex cursor-pointer items-center gap-3 rounded-lg p-3 hover:bg-slate-100"
            >
              <Icon size={20} />
              <span>{item.title}</span>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}