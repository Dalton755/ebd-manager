import { Button } from "./Button";
import { Card } from "./Card";

type Props = {
  open: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <Card className="w-full max-w-md">

        <div className="border-b p-6">
          <h2 className="text-lg font-semibold">
            {title}
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            {description}
          </p>
        </div>

        <div className="flex justify-end gap-3 p-6">

          <Button
            className="bg-gray-500 hover:bg-gray-600"
            onClick={onCancel}
          >
            {cancelText}
          </Button>

          <Button
            className="bg-red-600 hover:bg-red-700"
            onClick={onConfirm}
          >
            {confirmText}
          </Button>

        </div>

      </Card>
    </div>
  );
}