import { TimeRange } from '../../../api/stocks';

const RANGES: TimeRange[] = ['1D', '1W', '1M', '1Y'];

export default function TimeRangeSelector({
  value,
  onChange,
}: {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}) {
  return (
    <div className="flex shrink-0 gap-1 rounded-md bg-slate-800 p-0.5 text-xs">
      {RANGES.map((r) => (
        <button
          key={r}
          className={`rounded px-2 py-1.5 sm:py-0.5 ${
            value === r ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-100'
          }`}
          onClick={() => onChange(r)}
        >
          {r}
        </button>
      ))}
    </div>
  );
}
