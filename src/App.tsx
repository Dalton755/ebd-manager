import { RouterProvider } from "react-router-dom";
import { router } from "./app/router";
import { Toaster } from "sonner";
import { InstallAppModal } from "@/shared/components/pwa/InstallAppModal";

export default function App() {
    return (
        <>
            <RouterProvider router={router} />
            <InstallAppModal />

            <Toaster
                richColors
                position="top-right"
                closeButton
            />
        </>
    );
}