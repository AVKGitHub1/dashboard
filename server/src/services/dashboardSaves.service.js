import { db } from '../db/index.js';

// Which child table (if any) belongs to each widget type, and which of its own
// columns are meaningful to carry over into a snapshot (excludes id/widget_id, which
// are re-derived on restore).
const CHILD_TABLES = {
  weather: { table: 'weather_cities', columns: ['city_name', 'lat', 'lon', 'country', 'sort_order'] },
  stocks: { table: 'stock_watchlist', columns: ['symbol', 'display_name', 'sort_order'] },
  links: { table: 'links', columns: ['name', 'url', 'icon_path', 'sort_order'] },
  rss: { table: 'rss_feeds', columns: ['feed_url', 'title_override', 'sort_order'] },
  notes: { table: 'todo_items', columns: ['text', 'done', 'sort_order'] },
};

function captureSnapshot() {
  const widgets = db.prepare('SELECT * FROM widgets ORDER BY id').all();
  return widgets.map((widget) => {
    const child = CHILD_TABLES[widget.type];
    const children = child
      ? db
          .prepare(`SELECT ${child.columns.join(', ')} FROM ${child.table} WHERE widget_id = ? ORDER BY sort_order, id`)
          .all(widget.id)
      : [];
    return {
      type: widget.type,
      x: widget.x,
      y: widget.y,
      w: widget.w,
      h: widget.h,
      config: JSON.parse(widget.config_json || '{}'),
      children,
    };
  });
}

const restoreSnapshotTx = db.transaction((items) => {
  // Loading a save fully replaces the current board — cascades clear every child table.
  db.prepare('DELETE FROM widgets').run();

  const insertWidget = db.prepare(
    'INSERT INTO widgets (type, x, y, w, h, config_json) VALUES (?, ?, ?, ?, ?, ?)'
  );

  for (const item of items) {
    const { lastInsertRowid: widgetId } = insertWidget.run(
      item.type,
      item.x,
      item.y,
      item.w,
      item.h,
      JSON.stringify(item.config || {})
    );

    const child = CHILD_TABLES[item.type];
    if (!child || !item.children?.length) continue;

    const cols = child.columns.filter((c) => c !== 'sort_order').concat('sort_order');
    const insertChild = db.prepare(
      `INSERT INTO ${child.table} (widget_id, ${cols.join(', ')}) VALUES (?, ${cols.map(() => '?').join(', ')})`
    );
    for (const row of item.children) {
      insertChild.run(widgetId, ...cols.map((c) => row[c] ?? null));
    }
  }
});

export function listSaves() {
  return db.prepare('SELECT id, name, created_at FROM dashboard_saves ORDER BY created_at DESC').all();
}

export function createSave(name) {
  const snapshotJson = JSON.stringify(captureSnapshot());
  const result = db
    .prepare('INSERT INTO dashboard_saves (name, snapshot_json) VALUES (?, ?)')
    .run(name, snapshotJson);
  return { id: result.lastInsertRowid, name };
}

export function loadSave(id) {
  const row = db.prepare('SELECT snapshot_json FROM dashboard_saves WHERE id = ?').get(id);
  if (!row) return false;
  restoreSnapshotTx(JSON.parse(row.snapshot_json));
  return true;
}

export function deleteSave(id) {
  db.prepare('DELETE FROM dashboard_saves WHERE id = ?').run(id);
}
