import { createBrowserRouter } from "react-router-dom";

import { MainLayout } from "../layouts/MainLayout";
import { DashboardPage } from "../../modules/dashboard/pages/DashboardPage";
import { LoginPage } from "../../modules/auth/pages/LoginPage";
import { ProtectedRoute } from "@/modules/auth/components/ProtectedRoute";
import { PeoplePage } from "@/modules/people/pages/PeoplePage";

export const router = createBrowserRouter([
    {
        path: "/login",
        element: <LoginPage />,
    },
    {
        path: "/",
        element: (
            <ProtectedRoute>
                <MainLayout />
            </ProtectedRoute>
        ),
        children: [
            {
                index: true,
                element: <DashboardPage />,
            },
            {
                path: "pessoas",
                element: <PeoplePage />,
            },
        ],
    },
]);