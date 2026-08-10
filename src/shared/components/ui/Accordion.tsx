import { ChevronDown, PlusCircle } from "lucide-react";
import { useState, type ReactNode } from "react";
import clsx from "clsx";


type Props = {
    title: string;
    children: ReactNode;
    defaultOpen?: boolean;
};

export function Accordion({
    title,
    children,
    defaultOpen = false,
}: Props) {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <div className="rounded-xl border bg-white shadow-sm">

            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="flex w-full items-center justify-between p-4 text-left"
            >
                <div className="flex items-center gap-2">

                    <PlusCircle
                        size={22}
                        className="text-blue-600"
                    />

                    <span className="text-lg font-semibold">
                        {title}
                    </span>

                </div>

                <ChevronDown
                    size={20}
                    className={clsx(
                        "transition-transform",
                        open && "rotate-180"
                    )}
                />
            </button>

            {open && (
                <div className="border-t p-4">
                    {children}
                </div>
            )}

        </div>
    );
}