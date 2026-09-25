import { useQuery } from '@tanstack/react-query';
import { systemApi } from '../../../api/system';

function StatBar({ label, used, total, unit }: { label: string; used: number; total: number; unit: string }) {
  const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs text-slate-400">
        <span>{label}</span>
        <span>
          {used.toFixed(1)} / {total.toFixed(1)} {unit}
        </span>
      </div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-800">
        <div className="h-full bg-blue-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function SystemStatsWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['system-stats'],
    queryFn: systemApi.stats,
    refetchInterval: 5000,
  });

  if (isLoading || !data) {
    return <p className="p-3 text-sm text-slate-400">Loading…</p>;
  }

  return (
    <div className="flex h-full flex-col justify-center gap-3 p-3">
      <div>
        <div className="flex justify-between text-xs text-slate-400">
          <span>CPU</span>
          <span>{data.cpuPercent.toFixed(1)}%</span>
        </div>
        <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-800">
          <div className="h-full bg-blue-500" style={{ width: `${Math.min(100, data.cpuPercent)}%` }} />
        </div>
      </div>
      <StatBar label="Memory" used={data.memUsedMB} total={data.memTotalMB} unit="MB" />
      <StatBar label="Disk" used={data.diskUsedGB} total={data.diskTotalGB} unit="GB" />
      <p className="text-[10px] text-slate-600">Container-level stats (see README for host-metrics setup).</p>
    </div>
  );
}
