import { db } from '../db/index.js';

/**
 * Sets sort_order = index for each id in orderedIds, scoped to widgetId so a request
 * can only reorder rows belonging to the widget it claims to.
 */
export function reorderRows(table, widgetId, orderedIds) {
  const stmt = db.prepare(`UPDATE ${table} SET sort_order = ? WHERE id = ? AND widget_id = ?`);
  const tx = db.transaction((ids) => {
    ids.forEach((id, index) => stmt.run(index, id, widgetId));
  });
  tx(orderedIds);
}
