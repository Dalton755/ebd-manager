import { useMemo, useState } from "react";

export function useSearch<T>(
  items: T[],
  selector: (item: T) => string
) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return items;

    return items.filter((item) =>
      selector(item)
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [items, search, selector]);

  return {
    search,
    setSearch,
    filtered,
  };
}