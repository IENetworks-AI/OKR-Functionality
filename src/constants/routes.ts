// Route constants for better maintainability
export const ROUTES = {
  DASHBOARD: '/',
  OKR_DASHBOARD: '/okr/dashboard',
  OKR_MANAGEMENT: '/okr/management',
  PLANNING_REPORTING: '/okr/planning-reporting',
  ORGANIZATION: '/organization',
  LEARNING_GROWTH: '/learning-growth',
  TRAINING_MANAGEMENT: '/learning-growth/training',
  PAYROLL: '/payroll',
  MY_PAYROLL: '/payroll/my-payroll',
  TIME_ATTENDANCE: '/time-attendance',
  MY_TIMESHEET: '/time-attendance/timesheet',
  EMPLOYEE_ATTENDANCE: '/time-attendance/employee-attendance',
} as const;

export const SIDEBAR_ITEMS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: ROUTES.DASHBOARD,
    icon: 'BarChart3',
  },
  {
    id: 'organization',
    label: 'Organization',
    path: ROUTES.ORGANIZATION,
    icon: 'Settings',
  },
  {
    id: 'okr',
    label: 'OKR',
    icon: 'Target',
    children: [
      {
        id: 'okr-dashboard',
        label: 'Dashboard',
        path: ROUTES.OKR_DASHBOARD,
        icon: 'BarChart3',
      },
      {
        id: 'okr-management',
        label: 'OKR Management',
        path: ROUTES.OKR_MANAGEMENT,
        icon: 'Target',
      },
      {
        id: 'planning-reporting',
        label: 'Planning and Reporting',
        path: ROUTES.PLANNING_REPORTING,
        icon: 'Calendar',
      },
    ],
  },
  {
    id: 'learning-growth',
    label: 'Learning & Growth',
    icon: 'BookOpen',
    children: [
      {
        id: 'training-management',
        label: 'Training Management',
        path: ROUTES.TRAINING_MANAGEMENT,
        icon: 'BookOpen',
      },
    ],
  },
  {
    id: 'payroll',
    label: 'Payroll',
    icon: 'DollarSign',
    children: [
      {
        id: 'my-payroll',
        label: 'My Payroll',
        path: ROUTES.MY_PAYROLL,
        icon: 'DollarSign',
      },
    ],
  },
  {
    id: 'time-attendance',
    label: 'Time & Attendance',
    icon: 'Clock',
    children: [
      {
        id: 'my-timesheet',
        label: 'My Timesheet',
        path: ROUTES.MY_TIMESHEET,
        icon: 'Clock',
      },
      {
        id: 'employee-attendance',
        label: 'Employee Attendance',
        path: ROUTES.EMPLOYEE_ATTENDANCE,
        icon: 'Users',
      },
    ],
  },
] as const;
