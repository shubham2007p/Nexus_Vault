import React from 'react';
import MarkdownRenderer from '../shared/MarkdownRenderer';

/**
 * ChattyFi Message Markdown Wrapper
 * Delegates rendering to the unified Nexus Vault `<MarkdownRenderer />` component
 * while preserving the existing `MarkdownMessage` prop contract (`content`, `files`, `onNavigateToNote`, `className`).
 */
export default function MarkdownMessage({
  content = '',
  files = [],
  onNavigateToNote,
  onOpenNote,
  onLinkClick,
  variant = 'chat',
  className = '',
}) {
  return (
    <MarkdownRenderer
      content={content}
      files={files}
      onNavigateToNote={onNavigateToNote}
      onOpenNote={onOpenNote}
      onLinkClick={onLinkClick}
      variant={variant}
      className={className}
    />
  );
}
