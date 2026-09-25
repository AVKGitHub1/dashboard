import { useQuery } from '@tanstack/react-query';
import { ColorType, createChart, UTCTimestamp } from 'lightweight-charts';
import { useEffect, useRef } from 'react';
import { useIsMobile } from '../../../hooks/useMediaQuery';
import { stocksApi, TimeRange } from '../../../api/stocks';

export default function PriceChart({ symbol, range }: { symbol: string; range: TimeRange }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const { data } = useQuery({
    queryKey: ['stock-candles', symbol, range],
    queryFn: () => stocksApi.candles(symbol, range),
  });

  useEffect(() => {
    if (!containerRef.current || !data) return;
    const container = containerRef.current;

    const chart = createChart(container, {
      width: container.clientWidth,
      // A phone-width widget is only ~350px across; 220px of chart there leaves almost
      // no room for the ticker rows above it.
      height: isMobile ? 160 : 220,
      layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: '#94a3b8' },
      grid: { vertLines: { color: '#1e293b' }, horzLines: { color: '#1e293b' } },
      timeScale: { timeVisible: range === '1D' || range === '1W' },
      // Without this the chart swallows every vertical touch drag that starts on it to
      // pan its own price axis, and the dashboard underneath refuses to scroll. Pinch
      // and horizontal drags still work for zooming/panning the time axis.
      handleScroll: { vertTouchDrag: false },
    });

    const series = chart.addAreaSeries({
      lineColor: '#3b82f6',
      topColor: 'rgba(59, 130, 246, 0.3)',
      bottomColor: 'rgba(59, 130, 246, 0)',
    });

    series.setData(
      data.candles.map((c) => ({ time: c.time as UTCTimestamp, value: c.close }))
    );
    chart.timeScale().fitContent();

    const onResize = () => chart.applyOptions({ width: container.clientWidth });
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      chart.remove();
    };
  }, [data, range, isMobile]);

  if (!data || data.candles.length === 0) {
    return (
      <p className="p-2 text-xs text-slate-500">
        No chart data available for this symbol{data?.note ? ` — ${data.note}` : '.'}
      </p>
    );
  }

  return (
    <div>
      {data.note && <p className="mb-1 px-1 text-[11px] text-slate-500">{data.note}</p>}
      <div ref={containerRef} className="w-full" />
    </div>
  );
}
