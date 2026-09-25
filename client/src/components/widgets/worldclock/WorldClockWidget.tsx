import { X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Widget } from '../../../api/widgets';
import { useDragReorder } from '../../../hooks/useDragReorder';
import { useUpdateWidgetConfig } from '../../../hooks/useWidgets';

interface Zone {
  timezone: string;
  label?: string;
}

// Curated fallback for browsers/Node builds without Intl.supportedValuesOf (Safari <16.4,
// older engines). Modern browsers get the full ~400-entry IANA list instead (see below).
const COMMON_ZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Paris',
  'Europe/Moscow',
  'Africa/Cairo',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Australia/Sydney',
  'Pacific/Auckland',
];

function zoneGroup(zone: string, ...names: string[]): [string, string][] {
  return names.map((name) => [name.toLowerCase(), zone]);
}

// Sourced from a top-200-by-population world city ranking, cleaned of a handful of
// entries that were actually administrative regions rather than single cities (e.g.
// North Korean provinces, Vietnamese provinces mislabeled as "cities" in that dataset).
// Most cities on Earth share a timezone with their country's capital or largest city —
// this only needs entries for cities whose name differs from their zone's own IANA
// identifier (India, China, Pakistan, Nigeria, etc. each collapse to one official zone
// under a single canonical city name, so every other city in that country needs mapping
// here). Cities that already match their zone's own name (Tokyo, Seoul, Cairo, Dubai,
// Bangkok, London, Moscow, Istanbul, ...) are already found by the direct zone-id search
// below and don't need an entry.
const CITY_ALIASES: Record<string, string> = Object.fromEntries([
  // China — one official zone ("Beijing time") for the entire country, oddly canonicalized
  // under Shanghai rather than the capital.
  ...zoneGroup(
    'Asia/Shanghai',
    'Beijing',
    'Peking',
    'Guangzhou',
    'Shenzhen',
    'Chengdu',
    'Tianjin',
    'Wuhan',
    'Dongguan',
    'Chongqing',
    "Xi'an",
    'Xian',
    'Hangzhou',
    'Foshan',
    'Nanjing',
    'Shenyang',
    'Zhengzhou',
    'Qingdao',
    'Suzhou',
    'Changsha',
    'Jinan',
    'Kunming',
    'Hefei',
    'Shijiazhuang',
    'Harbin',
    'Dalian',
    'Xiamen',
    'Nanning',
    'Changchun',
    'Taiyuan',
    'Guiyang',
    'Wuxi',
    'Zhongshan',
    'Ningbo',
    'Fuzhou',
    'Shantou',
    'Nanchang',
    'Haikou',
    'Hohhot',
    'Shaoxing',
    'Yantai',
    'Zhuhai',
    'Luoyang',
    'Liuzhou',
    'Nantong',
    'Tangshan',
    'Xuzhou',
    'Lanzhou',
    'Huizhou',
    'Changzhou',
    'Wenzhou',
    'Zibo',
    'Linyi'
  ),
  // Xinjiang unofficially runs ~2 hours behind Beijing time in practice — its own
  // canonical IANA zone captures that local convention.
  ...zoneGroup('Asia/Urumqi', 'Urumqi'),
  // India — one official zone for the entire country.
  ...zoneGroup(
    'Asia/Kolkata',
    'Delhi',
    'New Delhi',
    'Mumbai',
    'Bombay',
    'Bengaluru',
    'Bangalore',
    'Chennai',
    'Madras',
    'Hyderabad',
    'Ahmedabad',
    'Surat',
    'Pune',
    'Ghaziabad',
    'Jaipur',
    'Lucknow',
    'Kochi',
    'Cochin',
    'Kannur',
    'Malappuram',
    'Thiruvananthapuram',
    'Trivandrum',
    'Thrissur',
    'Kozhikode',
    'Calicut',
    'Kanpur',
    'Nagpur',
    'Bhopal',
    'Patna',
    'Agra',
    'Visakhapatnam',
    'Vizag',
    'Vijayawada',
    'Indore',
    'Coimbatore'
  ),
  // Pakistan — one official zone.
  ...zoneGroup('Asia/Karachi', 'Lahore', 'Faisalabad', 'Rawalpindi', 'Gujranwala'),
  // Nigeria — one official zone.
  ...zoneGroup('Africa/Lagos', 'Kano', 'Abuja'),
  // Bangladesh — one official zone.
  ...zoneGroup('Asia/Dhaka', 'Chittagong', 'Gazipur'),
  // Indonesia — Java runs on Western Indonesia Time.
  ...zoneGroup('Asia/Jakarta', 'Bekasi', 'Depok', 'Tangerang', 'Bandung', 'Surabaya'),
  // Vietnam — one official zone (canonical id references Ho Chi Minh City, not the capital).
  ...zoneGroup('Asia/Ho_Chi_Minh', 'Ho Chi Minh City', 'Ho Chi Minh', 'Hanoi'),
  // Russia — European Russia.
  ...zoneGroup('Europe/Moscow', 'Saint Petersburg', 'St Petersburg', 'St. Petersburg'),
  // Turkey — one official zone.
  ...zoneGroup('Europe/Istanbul', 'Ankara', 'Izmir', 'Antalya', 'Bursa'),
  // Egypt — one official zone.
  ...zoneGroup('Africa/Cairo', 'Alexandria', 'Giza', 'Sharm El Sheikh', 'Sharm El-Sheikh'),
  // South Africa — one official zone despite its geographic spread.
  ...zoneGroup('Africa/Johannesburg', 'Cape Town', 'Pretoria', 'Durban'),
  // DR Congo — splits into two zones; this is the eastern one.
  ...zoneGroup('Africa/Lubumbashi', 'Lubumbashi', 'Mbuji-Mayi', 'Mbuji Mayi'),
  ...zoneGroup('Africa/Accra', 'Kumasi'),
  ...zoneGroup('Africa/Douala', 'Yaounde'),
  ...zoneGroup('Africa/Khartoum', 'Omdurman'),
  ...zoneGroup('America/Bogota', 'Medellin'),
  // Brazil spans three canonical zones (historically different DST rules), even though
  // none of them currently observe DST.
  ...zoneGroup('America/Sao_Paulo', 'Rio de Janeiro', 'Brasilia', 'Brasília'),
  ...zoneGroup('America/Fortaleza', 'Fortaleza'),
  ...zoneGroup('America/Bahia', 'Salvador'),
  ...zoneGroup('America/Caracas', 'Maracaibo'),
  // Ukraine — tzdb renamed Europe/Kiev to Europe/Kyiv in 2022.
  ...zoneGroup('Europe/Kyiv', 'Kyiv', 'Kiev'),
  ...zoneGroup('Asia/Damascus', 'Aleppo'),
  // Saudi Arabia — one official zone.
  ...zoneGroup('Asia/Riyadh', 'Jeddah', 'Mecca'),
  // UAE — one official zone.
  ...zoneGroup('Asia/Dubai', 'Abu Dhabi'),
  // Iran — one official zone.
  ...zoneGroup('Asia/Tehran', 'Mashhad'),
  // Yemen — one official zone (canonical id references Aden, not the capital Sanaa).
  ...zoneGroup(
    'Asia/Aden',
    'Sanaa',
    "Sana'a",
    'Sanaa City',
    'Al Hudaydah',
    'Hodeidah',
    'Taiz',
    'Ibb',
    'Hajjah',
    'Dhamar'
  ),
  ...zoneGroup('Asia/Bangkok', 'Nakhon Ratchasima'),
  ...zoneGroup('Asia/Manila', 'Quezon City', 'Manila'),
  // Taiwan — one official zone.
  ...zoneGroup('Asia/Taipei', 'New Taipei', 'Taichung', 'Kaohsiung'),
  // Japan — one official zone.
  ...zoneGroup('Asia/Tokyo', 'Yokohama', 'Osaka'),
  // South Korea — one official zone.
  ...zoneGroup('Asia/Seoul', 'Busan', 'Incheon'),
  // Melbourne shares Sydney's zone and DST rules.
  ...zoneGroup('Australia/Sydney', 'Melbourne'),
  // A few common abbreviations/older names worth keeping even though they're not in the
  // population dataset itself.
  ...zoneGroup('America/New_York', 'NYC', 'Washington', 'Washington DC', 'Atlanta', 'Miami', 'Boston'),
  ...zoneGroup('America/Los_Angeles', 'LA', 'SF', 'San Francisco', 'Seattle', 'Las Vegas', 'Portland'),
  ...zoneGroup('America/Chicago', 'Houston', 'Dallas', 'Austin'),
  ...zoneGroup('Asia/Hong_Kong', 'Hong Kong'),
]);

function allTimeZones(): string[] {
  const supportedValuesOf = (Intl as any).supportedValuesOf;
  if (typeof supportedValuesOf === 'function') {
    try {
      return supportedValuesOf('timeZone');
    } catch {
      // fall through to the curated list below
    }
  }
  return COMMON_ZONES;
}

// "America/Argentina/Buenos_Aires" -> "Buenos Aires" — lets the search match on the
// city name people actually type, not just the IANA identifier.
function cityLabel(timezone: string): string {
  return timezone.split('/').pop()?.replace(/_/g, ' ') || timezone;
}

function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

// A world clock is only useful if it also shows when a zone has rolled into a different
// calendar day than the viewer — e.g. "+1d" for a zone already into tomorrow.
function dayOffsetLabel(now: Date, timezone: string): string | null {
  const zonedMidnight = new Date(now.toLocaleDateString('en-US', { timeZone: timezone }));
  const localMidnight = new Date(now.toLocaleDateString('en-US'));
  const diffDays = Math.round((zonedMidnight.getTime() - localMidnight.getTime()) / 86400000);
  if (diffDays === 0) return null;
  return diffDays > 0 ? `+${diffDays}d` : `${diffDays}d`;
}

export default function WorldClockWidget({ widget }: { widget: Widget }) {
  const [now, setNow] = useState(new Date());
  const [query, setQuery] = useState('');
  const updateConfig = useUpdateWidgetConfig();
  const zones: Zone[] = widget.config.zones || [];
  const zoneOptions = useMemo(allTimeZones, []);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Several cities can legitimately share one zone (Mumbai and Delhi both mean
  // Asia/Kolkata) — matches are deduped on the (zone, displayed label) pair, not just
  // the zone, so adding both doesn't collide and isn't silently blocked. `seen` is
  // shared across the alias pass and the raw-zone-id pass so a city present in both
  // (e.g. an alias that happens to also be directly discoverable) only shows up once.
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 1) return [];

    const alreadyAdded = new Set(zones.map((z) => `${z.timezone}::${z.label || cityLabel(z.timezone)}`));
    const seen = new Set<string>();
    const results: { zoneId: string; label: string }[] = [];

    const tryAdd = (zoneId: string, label: string) => {
      const key = `${zoneId}::${label}`;
      if (alreadyAdded.has(key) || seen.has(key)) return;
      seen.add(key);
      results.push({ zoneId, label });
    };

    for (const [alias, zoneId] of Object.entries(CITY_ALIASES)) {
      if (alias.includes(q)) tryAdd(zoneId, titleCase(alias));
    }

    for (const zoneId of zoneOptions) {
      const label = cityLabel(zoneId);
      const labelLower = label.toLowerCase();
      // Bidirectional substring check: catches phrasing like "Ho Chi Minh City" typed in
      // full even though the zone's own label is the shorter "Ho Chi Minh".
      if (zoneId.toLowerCase().includes(q) || labelLower.includes(q) || q.includes(labelLower)) {
        tryAdd(zoneId, label);
      }
    }

    return results.slice(0, 8);
  }, [query, zoneOptions, zones]);

  const addZone = (zoneId: string, label: string) => {
    updateConfig.mutate({ id: widget.id, config: { ...widget.config, zones: [...zones, { timezone: zoneId, label }] } });
    setQuery('');
  };

  const removeZoneAt = (index: number) => {
    updateConfig.mutate({
      id: widget.id,
      config: { ...widget.config, zones: zones.filter((_, i) => i !== index) },
    });
  };

  const { getHandlers, isDragging } = useDragReorder(zones, (next) => {
    updateConfig.mutate({ id: widget.id, config: { ...widget.config, zones: next } });
  });

  return (
    <div className="flex h-full flex-col gap-2 p-3">
      <div className="relative">
        <input
          className="w-full rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-sm text-slate-100 focus:border-blue-500 focus:outline-none"
          placeholder="Search a city or timezone…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {matches.length > 0 && (
          <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-md border border-slate-700 bg-slate-800 shadow-lg">
            {matches.map((m) => (
              <li key={`${m.zoneId}::${m.label}`}>
                <button
                  type="button"
                  className="flex w-full justify-between px-2 py-2 text-left text-sm text-slate-100 hover:bg-slate-700 sm:py-1"
                  onClick={() => addZone(m.zoneId, m.label)}
                >
                  <span>{m.label}</span>
                  <span className="truncate pl-2 text-slate-500">{m.zoneId}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex-1 overflow-auto">
        {zones.length === 0 && <p className="text-sm text-slate-500">Search for a city to get started.</p>}
        {/* auto-fit + minmax means cards resize with the widget itself — drag the
            widget's corner wider/narrower and the cards reflow, no separate control needed. */}
        <div className="grid content-start gap-2 grid-cols-[repeat(auto-fit,minmax(120px,1fr))]">
          {zones.map((zone, index) => {
            const offset = dayOffsetLabel(now, zone.timezone);
            return (
              <div
                key={`${zone.timezone}-${zone.label}-${index}`}
                {...getHandlers(index)}
                className={`group relative flex cursor-move flex-col items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-center ${
                  isDragging(index) ? 'opacity-40' : ''
                }`}
              >
                <button
                  className="hover-reveal absolute right-0 top-0 p-2 text-slate-500 hover:text-red-400"
                  aria-label={`Remove ${zone.label || cityLabel(zone.timezone)}`}
                  onClick={() => removeZoneAt(index)}
                >
                  <X size={13} />
                </button>
                <span className="w-full truncate text-sm font-medium text-slate-100">
                  {zone.label || cityLabel(zone.timezone)}
                </span>
                <span className="tabular-nums text-3xl font-semibold text-slate-50">
                  {new Intl.DateTimeFormat('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: zone.timezone,
                  }).format(now)}
                </span>
                <span className="text-xs text-slate-500">
                  {new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: zone.timezone }).format(now)}
                  {offset && <span className="ml-1 text-amber-400">{offset}</span>}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
