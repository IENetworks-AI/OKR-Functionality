import { useNavigate, useLocation } from 'react-router-dom';
import { useCallback } from 'react';
import { ROUTES } from '@/constants/routes';

export const useNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navigateTo = useCallback((path: string) => {
    navigate(path);
  }, [navigate]);

  const isActiveRoute = useCallback((path: string) => {
    return location.pathname === path;
  }, [location.pathname]);

  const isParentRoute = useCallback((parentPath: string) => {
    return location.pathname.startsWith(parentPath);
  }, [location.pathname]);

  return {
    navigateTo,
    isActiveRoute,
    isParentRoute,
    currentPath: location.pathname,
    // Quick navigation helpers
    goToDashboard: () => navigateTo(ROUTES.DASHBOARD),
    goToOKRManagement: () => navigateTo(ROUTES.OKR_MANAGEMENT),
    goToPlanningReporting: () => navigateTo(ROUTES.PLANNING_REPORTING),
    goToOrganization: () => navigateTo(ROUTES.ORGANIZATION),
  };
};
