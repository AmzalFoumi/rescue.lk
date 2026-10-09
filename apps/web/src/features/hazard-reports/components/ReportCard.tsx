import { DUPLICATE_NOTICE, type ReportCardModel } from '../domain/report-card';
import { HazardIcon } from './icons';
import { StatusChip } from './StatusChip';
import { CARD_CLASS, TONE_CLASSES } from './tone-classes';

/** One report in My Reports. All wording is worked out in the card model. */
export function ReportCard({ card }: { card: ReportCardModel }) {
  return (
    <article className={`${CARD_CLASS} space-y-2`}>
      <div className="flex items-start gap-3">
        <span className="rounded-lg bg-primary-tint p-2 text-primary">
          <HazardIcon name={card.icon} className="size-6" />
        </span>
        <div className="min-w-0 flex-1 space-y-1">
          <h2 className="font-semibold">
            {card.title}
            {card.shortId && (
              <span className="ml-2 whitespace-nowrap font-mono text-sm text-ink-muted">
                {card.shortId}
              </span>
            )}
          </h2>
          <p className="text-sm text-ink-muted">
            {card.place} · {card.time}
          </p>
          <StatusChip status={card.status} />
        </div>
      </div>
      <p>{card.description}</p>
      {card.notes.map((note) => (
        <p key={note} className="text-sm text-ink-muted">
          {note}
        </p>
      ))}
      {card.possibleDuplicate && (
        <p
          className={`rounded-[10px] border p-2 text-sm ${TONE_CLASSES.caution}`}
        >
          {DUPLICATE_NOTICE}
        </p>
      )}
    </article>
  );
}
