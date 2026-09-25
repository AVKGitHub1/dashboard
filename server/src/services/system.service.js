import si from 'systeminformation';

/**
 * Returns container/process-level stats by default. Without extra host mounts
 * (e.g. -v /:/host:ro plus code changes to point at it), CPU/memory reflect the
 * container's cgroup view and disk reflects the container's filesystem — not the
 * true host. Documented as a limitation in the README rather than solved by default,
 * since granting host /proc access is a real security trade-off for a self-hosted tool.
 */
export async function getStats() {
  const [cpu, mem, fsSize] = await Promise.all([
    si.currentLoad(),
    si.mem(),
    si.fsSize(),
  ]);

  const primaryDisk = fsSize[0] || { used: 0, size: 0 };

  return {
    cpuPercent: Math.round(cpu.currentLoad * 10) / 10,
    memUsedMB: Math.round(mem.active / 1024 / 1024),
    memTotalMB: Math.round(mem.total / 1024 / 1024),
    diskUsedGB: Math.round((primaryDisk.used / 1024 / 1024 / 1024) * 10) / 10,
    diskTotalGB: Math.round((primaryDisk.size / 1024 / 1024 / 1024) * 10) / 10,
  };
}
