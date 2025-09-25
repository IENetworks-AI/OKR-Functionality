import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Dashboard from "./pages/Dashboard";
import OKRManagement from "./pages/OKRManagement";
import PlanningReporting from "./pages/PlanningReporting";
import NotFound from "./pages/NotFound";
import { ROUTES } from "@/constants/routes";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Dashboard />} />
              <Route path={ROUTES.OKR_DASHBOARD} element={<Dashboard />} />
              <Route path={ROUTES.OKR_MANAGEMENT} element={<OKRManagement />} />
              <Route path={ROUTES.PLANNING_REPORTING} element={<PlanningReporting />} />
              {/* Placeholder routes for other sections */}
              <Route path={ROUTES.ORGANIZATION} element={<div className="p-6"><h1>Organization</h1><p>Coming soon...</p></div>} />
              <Route path={ROUTES.TRAINING_MANAGEMENT} element={<div className="p-6"><h1>Training Management</h1><p>Coming soon...</p></div>} />
              <Route path={ROUTES.MY_PAYROLL} element={<div className="p-6"><h1>My Payroll</h1><p>Coming soon...</p></div>} />
              <Route path={ROUTES.MY_TIMESHEET} element={<div className="p-6"><h1>My Timesheet</h1><p>Coming soon...</p></div>} />
              <Route path={ROUTES.EMPLOYEE_ATTENDANCE} element={<div className="p-6"><h1>Employee Attendance</h1><p>Coming soon...</p></div>} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;