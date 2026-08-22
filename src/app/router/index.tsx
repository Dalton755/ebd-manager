import {
    createBrowserRouter,
    Navigate,
} from "react-router-dom";

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
import { MyPlanPage } from "@/modules/plans/pages/MyPlanPage";
import { PermissionRoute } from "@/modules/auth/components/PermissionRoute";
import { PlanGuard } from "@/modules/auth/components/PlanGuard";
import { PasswordRecoveryRequestsPage } from "@/modules/password-recovery/pages/PasswordRecoveryRequestsPage";
import { FinancePage } from "@/modules/finance/pages/FinancePage";
import { HomePage } from "@/modules/home/pages/HomePage";
import { StudentAttendancePage } from "@/modules/student/pages/StudentAttendancePage";
import { MeusDadosPage } from "@/modules/student/pages/MeusDadosPage";
import { MinhasAulasPage } from "../../modules/lessons/pages/MinhasAulasPage";
import { PlansPage } from "@/modules/plans/pages/PlansPage";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { FinancePageBloqueada } from "@/modules/finance/pages/FinancePageBloqueada";
import { PlatformAdminPage } from "@/modules/platform-admin/pages/PlatformAdminPage";
import { IgrejasPage } from "@/modules/platform-admin/pages/IgrejasPage";
import { AssinaturasPage } from "@/modules/platform-admin/pages/AssinaturasPage";
import { PlanosPage } from "@/modules/platform-admin/pages/PlanosPage";
import { RecursosPage } from "@/modules/platform-admin/pages/RecursosPage";

function RotaInicial() {

    const {
        pessoa,
    } = useAuth();

    if (
        pessoa?.perfil === "ALUNO" ||
        pessoa?.perfil === "PROFESSOR"
    ) {
        return (
            <Navigate
                to="/inicio"
                replace
            />
        );
    }

    return (
        <PermissionRoute
            permission="VER_DASHBOARD"
        >
            <DashboardPage />
        </PermissionRoute>
    );
}

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
        path: "/register",
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
                path: "administracao/plataforma",
                element: <PlatformAdminPage />,
            },

            {
                path: "administracao/plataforma/igrejas",
                element: <IgrejasPage />,
            },

            {
                path: "planos",
                element: <PlansPage />,
            },

            {
                path: "administracao/plataforma/assinaturas",
                element: <AssinaturasPage />,
            },

            {
                path: "administracao/plataforma/planos",
                element: <PlanosPage />,
            },

            {
                path: "administracao/plataforma/recursos",
                element: <RecursosPage />,
            },

            {
                path: "inicio",
                element: <HomePage />,
            },

            {
                path: "minhas-aulas",
                element: (
                    <PermissionRoute
                        permission="VER_MINHAS_AULAS"
                    >
                        <MinhasAulasPage />
                    </PermissionRoute>
                ),
            },


            {
                index: true,
                element: <RotaInicial />,
            },

            {
                path: "pessoas",
                element: (
                    <PermissionRoute
                        permission="VER_PESSOAS"
                    >
                        <PlanGuard recurso="PESSOAS">
                            <PeoplePage />
                        </PlanGuard>
                    </PermissionRoute>
                ),
            },

            {
                path: "classes",
                element: (
                    <PermissionRoute
                        permission="VER_CLASSES"
                    >
                        <PlanGuard recurso="CLASSES">
                            <ClassesPage />
                        </PlanGuard>
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
                        <PlanGuard
                            recurso="FINANCEIRO"
                            fallback={<FinancePageBloqueada />}
                        >
                            <FinancePage />
                        </PlanGuard>
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
                path: "/meu-plano",
                element: <MyPlanPage />,
            },

            {
                path: "relatorios/presencas",
                element: (
                    <PermissionRoute permission="VER_PRESENCAS">
                        <PlanGuard recurso="RELATORIOS">
                            <AttendanceRecordsPage />
                        </PlanGuard>
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
                        <PlanGuard recurso="SOLICITACOES_SENHA">
                            <PasswordRecoveryRequestsPage />
                        </PlanGuard>
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
                        <PlanGuard recurso="TRIMESTRES">
                            <TrimestersPage />
                        </PlanGuard>
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
                        <PlanGuard recurso="AULAS">
                            <LessonsPage />
                        </PlanGuard>
                    </PermissionRoute>
                ),
            },


        ],
    },
]);