type Props = {
  text?: string;
};

export function LoadingSpinner({
  text = "Carregando..."
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-10">

      <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />

      <span className="text-sm text-gray-500">
        {text}
      </span>

    </div>
  );
}