import { ReportingHeader, ReportingProvider } from '@/features/hazard-reports';

// Everything under /hazard-reports shares the reporting state (network switch, offline queue).
export default function HazardReportsLayout({
  children,
}: LayoutProps<'/hazard-reports'>) {
  return (
    <ReportingProvider>
      <ReportingHeader />
      {children}
    </ReportingProvider>
  );
}
