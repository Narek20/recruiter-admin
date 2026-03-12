import { ReactElement } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import App from "./App";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { SchoolsPage } from "./pages/SchoolsPage";
import { MajorsPage } from "./pages/MajorsPage";
import { SchoolMajorsPage } from "./pages/SchoolMajorsPage";
import { ImportsPage } from "./pages/ImportsPage";
import { isAuthenticated } from "./lib/auth";

function ProtectedRoute({ children }: { children: ReactElement }) {
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
}

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <App />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "schools", element: <SchoolsPage /> },
      { path: "majors", element: <MajorsPage /> },
      { path: "school-majors", element: <SchoolMajorsPage /> },
      { path: "imports", element: <ImportsPage /> },
    ],
  },
]);
