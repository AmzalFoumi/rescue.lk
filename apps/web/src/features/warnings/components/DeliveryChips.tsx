import type { DeliveryRecordDto } from '@rescue-lk/shared';
import { CHANNEL_META, DELIVERY_STATUS_META, TONE_CLASSES } from '../meta';
import { cx, ICON_SIZE } from '../ui';

// DeliveryChips shows one small chip per channel with its delivery status.
// Presentational. Accessibility: status is icon plus text, never colour alone.
// DRY: the status part reuses StatusChip and the delivery meta from meta.ts.
export function DeliveryChips({
  records,
}: {
  records: readonly DeliveryRecordDto[];
}) {
  return (
    <ul
      className="flex flex-wrap items-center gap-1.5"
      aria-label="Delivery by channel"
    >
      {records.map((record) => {
        const channel = CHANNEL_META[record.channel];
        const status = DELIVERY_STATUS_META[record.status];
        return (
          <li
            key={record.id}
            className={cx(
              'inline-flex items-center gap-1 rounded-[6px] border px-[7px] py-[3px] text-[12px] font-semibold',
              TONE_CLASSES[status.tone],
            )}
          >
            <channel.icon aria-hidden size={ICON_SIZE.small} />
            {channel.short}
            {/* Read as "SMS: Sent" rather than "SMSSent". */}
            <span className="sr-only">: </span>
            <status.icon aria-hidden size={ICON_SIZE.small} />
            {status.label}
          </li>
        );
      })}
    </ul>
  );
}
