import {
  Cloud,
  Clock,
  Globe2,
  Link as LinkIcon,
  ListTodo,
  Newspaper,
  Cpu,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';
import { ComponentType } from 'react';
import { Widget, WidgetType } from '../../api/widgets';
import ClockWidget from './clock/ClockWidget';
import LinkWidget from './links/LinkWidget';
import NotesWidget from './notes/NotesWidget';
import RssWidget from './rss/RssWidget';
import StockWidget from './stocks/StockWidget';
import SystemStatsWidget from './system/SystemStatsWidget';
import WeatherWidget from './weather/WeatherWidget';
import WorldClockWidget from './worldclock/WorldClockWidget';

export interface WidgetDefinition {
  type: WidgetType;
  label: string;
  description: string;
  icon: LucideIcon;
  defaultSize: { w: number; h: number };
  defaultConfig: Record<string, any>;
  Component: ComponentType<{ widget: Widget }>;
}

export const WIDGET_REGISTRY: WidgetDefinition[] = [
  {
    type: 'weather',
    label: 'Weather',
    description: 'Current conditions and forecast for cities you add.',
    icon: Cloud,
    defaultSize: { w: 4, h: 6 },
    defaultConfig: {},
    Component: WeatherWidget,
  },
  {
    type: 'stocks',
    label: 'Stocks',
    description: 'Track tickers with a shared time range and expandable charts.',
    icon: TrendingUp,
    defaultSize: { w: 5, h: 6 },
    defaultConfig: { timeRange: '1D' },
    Component: StockWidget,
  },
  {
    type: 'links',
    label: 'Links',
    description: 'Bookmark shortcuts with a name, URL, and optional icon.',
    icon: LinkIcon,
    defaultSize: { w: 4, h: 5 },
    defaultConfig: {},
    Component: LinkWidget,
  },
  {
    type: 'clock',
    label: 'Clock',
    description: 'A simple date and time display.',
    icon: Clock,
    defaultSize: { w: 3, h: 3 },
    defaultConfig: {},
    Component: ClockWidget,
  },
  {
    type: 'worldclock',
    label: 'World Clock',
    description: 'Compare the time across multiple timezones.',
    icon: Globe2,
    defaultSize: { w: 3, h: 5 },
    defaultConfig: { zones: [] },
    Component: WorldClockWidget,
  },
  {
    type: 'rss',
    label: 'RSS Feed',
    description: 'Recent entries from feeds you subscribe to.',
    icon: Newspaper,
    defaultSize: { w: 4, h: 6 },
    defaultConfig: {},
    Component: RssWidget,
  },
  {
    type: 'system',
    label: 'System Stats',
    description: 'CPU, memory, and disk usage.',
    icon: Cpu,
    defaultSize: { w: 3, h: 4 },
    defaultConfig: {},
    Component: () => null, // overridden below; SystemStatsWidget takes no widget prop
  },
  {
    type: 'notes',
    label: 'Notes / Todo',
    description: 'A freeform scratchpad or checklist.',
    icon: ListTodo,
    defaultSize: { w: 3, h: 5 },
    defaultConfig: { mode: 'text' },
    Component: NotesWidget,
  },
];

// SystemStatsWidget has no per-instance data, so it's wrapped to match the common signature.
WIDGET_REGISTRY.find((w) => w.type === 'system')!.Component = SystemStatsWidget as ComponentType<{
  widget: Widget;
}>;

export function getWidgetDefinition(type: WidgetType) {
  return WIDGET_REGISTRY.find((w) => w.type === type);
}
