import {
  CircleCheck,
  CircleHelp,
  CircleX,
  Clock,
  CloudOff,
  Construction,
  Flame,
  Mountain,
  Waves,
  type LucideIcon,
} from 'lucide-react';
import type { HazardIconName } from '../domain/hazard-types';
import type { StatusIconName } from '../domain/report-status';

// The domain only knows icon names. This is the one place that turns a name into a drawing.

const HAZARD_ICONS: Record<HazardIconName, LucideIcon> = {
  waves: Waves,
  mountain: Mountain,
  construction: Construction,
  flame: Flame,
  'circle-help': CircleHelp,
};

const STATUS_ICONS: Record<StatusIconName, LucideIcon> = {
  'cloud-off': CloudOff,
  clock: Clock,
  'circle-check': CircleCheck,
  'circle-x': CircleX,
};

export function HazardIcon({
  name,
  className,
}: {
  name: HazardIconName;
  className?: string;
}) {
  const Icon = HAZARD_ICONS[name];
  return <Icon aria-hidden className={className} />;
}

export function StatusIcon({
  name,
  className,
}: {
  name: StatusIconName;
  className?: string;
}) {
  const Icon = STATUS_ICONS[name];
  return <Icon aria-hidden className={className} />;
}
