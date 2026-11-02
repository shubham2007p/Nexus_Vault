import { Prec } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';

/**
 * Creates a CodeMirror 6 extension that manages the Notion-inspired slash command trigger.
 * 
 * Features:
 * - Detects `/` when typed at the start of a line or preceded by whitespace.
 * - Does NOT trigger in URLs (e.g. `http://`), file paths, or within words (`and/or`).
 * - Extracts query string after `/` for instant filtering.
 * - Accurately tracks cursor coordinates for floating menu placement, even during scrolling.
 * - Intercepts ArrowUp, ArrowDown, Enter, Escape when menu is open via highest precedence keymap.
 *
 * @param {Object} options
 * @param {Function} options.onTrigger - Callback when slash trigger is detected: ({ coords, query, from, to, lineStart })
 * @param {Function} options.onClose - Callback when slash trigger is dismissed
 * @param {Function} options.onKeyAction - Callback for keyboard navigation: (action: 'up' | 'down' | 'enter' | 'escape') => boolean
 * @param {Function} options.isMenuOpen - Function returning boolean whether menu is currently open
 */
export function createSlashCommandExtension({
  onTrigger,
  onClose,
  onKeyAction,
  isMenuOpen,
}) {
  // Keymap with highest priority to handle menu navigation without moving the CM cursor
  const slashKeymap = Prec.highest(
    keymap.of([
      {
        key: 'ArrowDown',
        run: () => {
          if (isMenuOpen && isMenuOpen()) {
            return onKeyAction ? onKeyAction('down') : true;
          }
          return false;
        },
      },
      {
        key: 'ArrowUp',
        run: () => {
          if (isMenuOpen && isMenuOpen()) {
            return onKeyAction ? onKeyAction('up') : true;
          }
          return false;
        },
      },
      {
        key: 'Enter',
        run: () => {
          if (isMenuOpen && isMenuOpen()) {
            return onKeyAction ? onKeyAction('enter') : true;
          }
          return false;
        },
      },
      {
        key: 'Tab',
        run: () => {
          if (isMenuOpen && isMenuOpen()) {
            return onKeyAction ? onKeyAction('enter') : true;
          }
          return false;
        },
      },
      {
        key: 'Escape',
        run: () => {
          if (isMenuOpen && isMenuOpen()) {
            return onKeyAction ? onKeyAction('escape') : true;
          }
          return false;
        },
      },
    ])
  );

  // Update listener to detect slash commands and calculate coords
  const slashUpdateListener = EditorView.updateListener.of((update) => {
    // Only check when document changed or selection changed
    if (!update.docChanged && !update.selectionSet && !update.viewportChanged) {
      return;
    }

    const state = update.state;
    const sel = state.selection.main;

    // Range selection active: close menu
    if (!sel.empty) {
      if (isMenuOpen && isMenuOpen()) onClose();
      return;
    }

    const head = sel.head;
    const line = state.doc.lineAt(head);
    const textBefore = line.text.slice(0, head - line.from);

    // Regex check:
    // 1. Must be preceded by start of line (^) or whitespace (\s)
    // 2. Followed by `/`
    // 3. Followed by zero or more word/hyphen characters (query) up to cursor
    // 4. Must NOT have spaces after the `/`
    const slashMatch = /(?:^|\s)\/([a-zA-Z0-9_-]*)$/.exec(textBefore);

    if (slashMatch) {
      const query = slashMatch[1];
      // Calculate exact document position of the `/`
      const matchStartInLine = slashMatch.index + (slashMatch[0].startsWith('/') ? 0 : 1);
      const from = line.from + matchStartInLine;
      const to = head;
      const isAtLineStart = matchStartInLine === 0;

      // Get screen coordinates of the cursor
      const coords = update.view.coordsAtPos(head);
      if (coords) {
        onTrigger({
          coords,
          query,
          from,
          to,
          lineStart: isAtLineStart,
        });
      }
    } else {
      if (isMenuOpen && isMenuOpen()) {
        onClose();
      }
    }
  });

  // DOM event handlers for scroll synchronization and clicking outside
  const domEventHandlers = EditorView.domEventHandlers({
    scroll: (event, view) => {
      if (isMenuOpen && isMenuOpen()) {
        const head = view.state.selection.main.head;
        const coords = view.coordsAtPos(head);
        if (coords) {
          onTrigger({ coords, onlyUpdateCoords: true });
        }
      }
      return false;
    },
  });

  return [slashKeymap, slashUpdateListener, domEventHandlers];
}

