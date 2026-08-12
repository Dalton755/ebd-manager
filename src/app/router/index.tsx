import { createBrowserRouter } from "react-router-dom";

import { MainLayout } from "../layouts/MainLayout";
import { DashboardPage } from "../../modules/dashboard/pages/DashboardPage";
import { LoginPage } from "../../modules/auth/pages/LoginPage";
import { ProtectedRoute } from "@/modules/auth/components/ProtectedRoute";
import { PeoplePage } from "@/modules/people/pages/PeoplePage";
import { ResetPasswordPage } from "../../modules/auth/pages/ResetPasswordPage";
import { ChangeTemporaryPasswordPage } from "../../modules/auth/pages/ChangeTemporaryPasswordPage";
import { AttendancePage } from "../../modules/attendance/pages/AttendancePage";
import { AttendanceHistoryPage } from "../../modules/attendance/pages/AttendanceHistoryPage";
import { StudentCheckinPage } from "../../modules/student/pages/StudentCheckinPage";
import { AttendanceRecordsPage } from "@/modules/reports/pages/AttendanceRecordsPage";
import { RegisterPage } from "../../modules/auth/pages/RegisterPage";
import { PendingApprovalPage } from "../../modules/auth/pages/PendingApprovalPage";
import { UserApprovalPage } from "@/modules/administration/pages/UserApprovalPage";
import { TrimestersPage } from "@/modules/lessons/pages/TrimestersPage";
import { LessonsPage } from "@/modules/lessons/pages/LessonsPage";
import { ClassesPage } from "@/modules/classes/pages/ClassesPage";
import { PermissionRoute } from "@/modules/auth/components/PermissionRoute";
import { PasswordRecoveryRequestsPage } from "@/modules/password-recovery/pages/PasswordRecoveryRequestsPage";
import { FinancePage } from "@/modules/finance/pages/FinancePage";
import { HomePage } from "@/modules/home/pages/HomePage";
import { StudentAttendancePage } from "@/modules/student/pages/StudentAttendancePage";
import { MeusDadosPage } from "@/modules/student/pages/MeusDadosPage";


export const router = createBrowserRouter([
    {
        path: "/login",
        element: <LoginPage />,
    },

    {
        path: "/cadastro",
        element: <RegisterPage />,
    },

    {
        path: "/aguardando-aprovacao",
        element: <PendingApprovalPage />,
    },

    {
        path: "/reset-password",
        element: <ResetPasswordPage />,
    },

    {
        path: "/alterar-senha",
        element: <ChangeTemporaryPasswordPage />,
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
                path: "inicio",
                element: <HomePage />,
            },


            {
                index: true,
                element: (
                    <PermissionRoute permission="VER_DASHBOARD">
                        <DashboardPage />
                    </PermissionRoute>
                ),
            },

            {
                path: "pessoas",
                element: (
                    <PermissionRoute
                        permission="VER_PESSOAS"
                    >
                        <PeoplePage />
                    </PermissionRoute>
                ),
            },

            {
                path: "classes",
                element: (
                    <PermissionRoute
                        permission="VER_CLASSES"
                    >
                        <ClassesPage />
                    </PermissionRoute>
                ),
            },

            {
                path: "financeiro",
                element: (
                    <PermissionRoute
                        permissions={[
                            "VER_FINANCEIRO",
                            "GERENCIAR_FINANCEIRO",
                        ]}
                    >
                        <FinancePage />
                    </PermissionRoute>
                ),
            },

            {
                path: "checkin",
                element: (
                    <PermissionRoute
                        permission="REGISTRAR_PRESENCA"
                    >
                        <AttendancePage />
                    </PermissionRoute>
                ),
            },

            {
                path: "presencas",
                element: (
                    <PermissionRoute
                        permission="VER_PRESENCAS"
                    >
                        <AttendanceHistoryPage />
                    </PermissionRoute>
                ),
            },

            {
                path: "aluno/checkin",
                element: (
                    <PermissionRoute
                        permission="FAZER_CHECKIN"
                    >
                        <StudentCheckinPage />
                    </PermissionRoute>
                ),
            },

            {
                path: "minhas-presencas",
                element: (
                    <PermissionRoute
                        permission="VER_MINHAS_PRESENCAS"
                    >
                        <StudentAttendancePage />
                    </PermissionRoute>
                ),
            },

            {
                path: "meus-dados",
                element: (
                    <PermissionRoute
                        permission="VER_MINHAS_AULAS"
                    >
                        <MeusDadosPage />
                    </PermissionRoute>
                ),
            },

            {
                path: "relatorios/presencas",
                element: (
                    <PermissionRoute permission="VER_PRESENCAS">
                        <AttendanceRecordsPage />
                    </PermissionRoute>
                ),
            },

            {
                path: "administracao/aprovacoes",
                element: (
                    <PermissionRoute
                        permission="APROVAR_USUARIOS"
                    >
                        <UserApprovalPage />
                    </PermissionRoute>
                ),
            },

            {
                path: "administracao/solicitacoes-senha",
                element: (
                    <PermissionRoute
                        permission="APROVAR_USUARIOS"
                    >
                        <PasswordRecoveryRequestsPage />
                    </PermissionRoute>
                ),
            },

            {
                path: "aulas",
                element: (
                    <PermissionRoute
                        permissions={[
                            "VER_AULAS",
                            "VER_MINHAS_AULAS",
                        ]}
                    >
                        <TrimestersPage />
                    </PermissionRoute>
                ),
            },

            {
                path: "aulas/:trimestreId",
                element: (
                    <PermissionRoute
                        permissions={[
                            "VER_AULAS",
                            "VER_MINHAS_AULAS",
                        ]}
                    >
                        <LessonsPage />
                    </PermissionRoute>
                ),
            },


        ],
    },
]);