import { Search } from "lucide-react";

type Props = {
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
};

export function SearchInput({
  value,
  placeholder = "Pesquisar...",
  onChange,
}: Props) {
  return (
    <div className="relative w-full">
      <Search
        size={18}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
      />

      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="
          h-11
          w-full
          rounded-lg
          border
          bg-white
          pl-10
          pr-4
          transition
          focus:border-blue-500
          focus:outline-none
          focus:ring-2
          focus:ring-blue-200
        "
      />
    </div>
  );
}