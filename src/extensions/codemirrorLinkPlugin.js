import { ViewPlugin, Decoration } from '@codemirror/view';

const plainLinkDeco = Decoration.mark({ class: 'cm-plain-link-tag' });
const contextualLinkDeco = Decoration.mark({ class: 'cm-contextual-link-tag' });

function buildLinkDecorations(view) {
  const builder = [];
  const text = view.state.doc.toString();
  const LINK_REGEX = /\[\[([^\[\]]+)\]\]/g;
  let match;

  while ((match = LINK_REGEX.exec(text)) !== null) {
    const from = match.index;
    const to = from + match[0].length;
    const inner = match[1];

    if (inner.includes('|')) {
      const parts = inner.split('|');
      if (parts.length === 3) {
        builder.push(contextualLinkDeco.range(from, to));
      } else {
        builder.push(plainLinkDeco.range(from, to));
      }
    } else {
      builder.push(plainLinkDeco.range(from, to));
    }
  }

  return Decoration.set(builder, true);
}

export const linkHighlightPlugin = ViewPlugin.fromClass(
  class {
    constructor(view) {
      this.decorations = buildLinkDecorations(view);
    }

    update(update) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = buildLinkDecorations(update.view);
      }
    }
  },
  {
    decorations: (v) => v.decorations,
  }
);
