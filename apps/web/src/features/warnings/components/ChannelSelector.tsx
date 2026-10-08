import type { AlertChannelType } from '@rescue-lk/shared';
import { CHANNEL_META, CHANNELS } from '../meta';
import { ICON_SIZE } from '../ui';
import { FieldError } from './FieldError';
import { Card } from './shell/Card';

interface ChannelSelectorProps {
  value: readonly AlertChannelType[];
  onChange: (channels: AlertChannelType[]) => void;
  error?: string;
}

const ERROR_ID = 'warning-channels-error';

// "4. Channels": how the warning reaches people.
export function ChannelSelector({
  value,
  onChange,
  error,
}: ChannelSelectorProps) {
  const toggle = (channel: AlertChannelType) =>
    onChange(
      value.includes(channel)
        ? value.filter((item) => item !== channel)
        : // Keep the display order regardless of click order.
          CHANNELS.filter((item) => item === channel || value.includes(item)),
    );

  return (
    <Card title="4. Channels" titleId="channels-title">
      <fieldset
        aria-label="Channels"
        aria-describedby={error ? ERROR_ID : undefined}
        className="flex flex-col gap-2 p-4"
      >
        {CHANNELS.map((channel) => {
          const { label, icon: Icon, hint } = CHANNEL_META[channel];
          return (
            <label
              key={channel}
              className="flex cursor-pointer items-start gap-2.5 rounded-[8px] border border-[#D9DFE5] px-3 py-2.5 has-[:checked]:border-[#1D4E89] has-[:checked]:bg-[#E8EFF8] has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[#1D4E89]"
            >
              <input
                type="checkbox"
                checked={value.includes(channel)}
                onChange={() => toggle(channel)}
                className="mt-[3px] size-4 flex-none"
              />
              <Icon
                aria-hidden
                size={ICON_SIZE.large}
                className="mt-px flex-none text-[#4F5B67]"
              />
              <span className="flex flex-col gap-px">
                <span className="text-[14px] font-semibold">{label}</span>
                <span className="text-[12.5px] text-[#4F5B67]">{hint}</span>
              </span>
            </label>
          );
        })}
        <FieldError id={ERROR_ID} message={error} />
      </fieldset>
    </Card>
  );
}
