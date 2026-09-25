import { useEffect, useState } from 'react';
import { Widget } from '../../../api/widgets';

export default function ClockWidget({ widget }: { widget: Widget }) {
  const [now, setNow] = useState(new Date());
  const timezone: string | undefined = widget.config.timezone;

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const timeStr = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZone: timezone,
  }).format(now);

  const dateStr = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: timezone,
  }).format(now);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-1 p-3 text-center">
      <div className="text-3xl font-semibold tabular-nums text-slate-100">{timeStr}</div>
      <div className="text-sm text-slate-400">{dateStr}</div>
      {timezone && <div className="text-xs text-slate-600">{timezone}</div>}
    </div>
  );
}
