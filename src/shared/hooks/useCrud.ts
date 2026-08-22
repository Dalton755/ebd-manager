import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { toast } from "sonner";

type ListFunction<T> = () => Promise<T[]>;

export function useCrud<T>(
  listFunction: ListFunction<T>,
  errorMessage = "Erro ao carregar dados."
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);

    try {
      const result = await listFunction();

      setData(result ?? []);
    } catch (error) {
      console.error(error);

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [listFunction, errorMessage]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    data,
    setData,
    loading,
    refresh,
  };
}