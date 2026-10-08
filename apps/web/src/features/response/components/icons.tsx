import {
  Ban,
  CircleCheck,
  CircleHelp,
  CircleSlash,
  Construction,
  Flame,
  House,
  Mountain,
  RotateCcw,
  TriangleAlert,
  Truck,
  Waves,
  type LucideIcon,
} from 'lucide-react';
import type { IconName } from '../domain/presentation';

// The domain only knows icon names. This is the one place that turns a name
// into a drawing.

const ICONS: Record<IconName, LucideIcon> = {
  waves: Waves,
  mountain: Mountain,
  construction: Construction,
  flame: Flame,
  'circle-help': CircleHelp,
  'circle-check': CircleCheck,
  truck: Truck,
  'rotate-ccw': RotateCcw,
  'circle-slash': CircleSlash,
  house: House,
  'triangle-alert': TriangleAlert,
  ban: Ban,
};

export function Icon({
  name,
  className = 'size-4',
}: {
  name: IconName;
  className?: string;
}) {
  const Drawing = ICONS[name];
  return <Drawing className={className} aria-hidden="true" />;
}
