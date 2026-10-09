import type { ReportType } from '@rescue-lk/shared/analytics/report.types';
import { FileText, Users, Home, Box } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface ReportTypeCardProps {
  type: ReportType;
  isSelected: boolean;
  onSelect: () => void;
}

const TYPE_CONFIG: Record<
  ReportType,
  { title: string; desc: string; icon: LucideIcon }
> = {
  ALERT_TIMELINE: {
    title: 'Alert Timeline',
    desc: 'Chronological view of warnings issued',
    icon: FileText,
  },
  CITIZENS_REACHED: {
    title: 'Citizens Reached',
    desc: 'Notification delivery statistics',
    icon: Users,
  },
  SHELTER_OCCUPANCY: {
    title: 'Shelter Occupancy',
    desc: 'Capacity and status of safe houses',
    icon: Home,
  },
  RESOURCE_DISTRIBUTION: {
    title: 'Resource Distribution',
    desc: 'Relief items allocated by district',
    icon: Box,
  },
};

export function ReportTypeCard({
  type,
  isSelected,
  onSelect,
}: ReportTypeCardProps) {
  const config = TYPE_CONFIG[type];
  const Icon = config.icon;

  return (
    <button
      onClick={onSelect}
      className={`flex min-h-[100px] flex-col items-start gap-2 rounded-[10px] border p-4 text-left transition-colors ${
        isSelected
          ? 'border-primary bg-primary/5 ring-1 ring-primary'
          : 'border-line bg-white hover:border-line-input hover:bg-page'
      }`}
    >
      <div className="flex items-center gap-2">
        <Icon
          className={`size-5 ${isSelected ? 'text-primary' : 'text-ink-muted'}`}
        />
        <h3 className={`font-bold ${isSelected ? 'text-primary' : 'text-ink'}`}>
          {config.title}
        </h3>
      </div>
      <p
        className={`text-sm ${isSelected ? 'text-primary/80' : 'text-ink-muted'}`}
      >
        {config.desc}
      </p>
    </button>
  );
}
