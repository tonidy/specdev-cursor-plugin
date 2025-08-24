import React, { useState, useEffect, useRef } from 'react';
import MarkdownRenderer from './MarkdownRenderer';

interface MarkdownEditorProps {
  content: string;
  onChange: (content: string) => void;
  enableMermaid?: boolean;
  reviewStatus?: 'pending' | 'approved' | 'rejected';
  onReview?: (status: 'approved' | 'rejected') => void;
  onRegenerate?: () => void;
  showPreviewAfterSave?: boolean;
  isRequirements?: boolean;
  onViewModeChange?: (viewMode: 'edit' | 'preview' | 'split') => void;
}

type ViewMode = 'edit' | 'preview' | 'split';

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  content,
  onChange,
  enableMermaid = false,
  reviewStatus = undefined,
  onReview,
  onRegenerate,
  showPreviewAfterSave = false,
  isRequirements = false,
  onViewModeChange
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('preview');
  const [editContent, setEditContent] = useState(content);
  const saveTimeout = useRef<number | null>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setEditContent(content);
  }, [content]);

  // Notify parent component when view mode changes
  useEffect(() => {
    if (onViewModeChange) {
      onViewModeChange(viewMode);
    }
  }, [viewMode, onViewModeChange]);

  // Debounced auto-save
  useEffect(() => {
    if (viewMode === 'edit' || viewMode === 'split') {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(() => {
        onChange(editContent);
      }, 800);
    }
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, [editContent, viewMode, onChange]);

  // Synchronized scrolling
  const handleEditorScroll = () => {
    if (viewMode === 'split' && editorRef.current && previewRef.current) {
      const editor = editorRef.current;
      const preview = previewRef.current;
      const scrollPercentage = editor.scrollTop / (editor.scrollHeight - editor.clientHeight);
      preview.scrollTop = scrollPercentage * (preview.scrollHeight - preview.clientHeight);
    }
  };

  const handlePreviewScroll = () => {
    if (viewMode === 'split' && editorRef.current && previewRef.current) {
      const editor = editorRef.current;
      const preview = previewRef.current;
      const scrollPercentage = preview.scrollTop / (preview.scrollHeight - preview.clientHeight);
      editor.scrollTop = scrollPercentage * (editor.scrollHeight - editor.clientHeight);
    }
  };

  const handleSave = () => {
    onChange(editContent);
    if (isRequirements && showPreviewAfterSave) {
      setViewMode('preview');
    }
  };

  const handleCancel = () => {
    setEditContent(content);
    setViewMode('preview');
  };




  // Review checkpoint banner
  const renderReviewBanner = () => {
    // Only show review banners in edit mode, and only if not approved
    if (!reviewStatus || viewMode !== 'edit' || reviewStatus === 'approved') return null;
    if (reviewStatus === 'pending') {
      return (
        <div className="review-banner">
          <span>Review this document. Is it complete, clear, and correct?</span>
          <button onClick={() => onReview && onReview('approved')}>Y</button>
          <button onClick={() => onReview && onReview('rejected')}>N</button>
        </div>
      );
    }
    if (reviewStatus === 'rejected') {
      return (
        <div className="review-banner rejected">
          <span>Document rejected. Please edit and regenerate.</span>
          {onRegenerate && <button onClick={onRegenerate}>Regenerate</button>}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="markdown-editor">
      {renderReviewBanner()}
      <div className="editor-toolbar">
        <div className="view-mode-controls">
          <button
            className={`view-mode-button ${viewMode === 'preview' ? 'active' : ''}`}
            onClick={() => setViewMode('preview')}
            title="Preview Only"
          >
            👁️ Preview
          </button>
          <button
            className={`view-mode-button ${viewMode === 'edit' ? 'active' : ''}`}
            onClick={() => setViewMode('edit')}
            title="Edit Only"
          >
            ✏️ Edit
          </button>
          <button
            className={`view-mode-button ${viewMode === 'split' ? 'active' : ''}`}
            onClick={() => setViewMode('split')}
            title="Split View"
          >
            📄 Split
          </button>
        </div>
        {viewMode === 'edit' && (
          <div className="edit-controls">
            <button
              className="save-button"
              onClick={handleSave}
            >
              Save
            </button>
            <button
              className="cancel-button"
              onClick={handleCancel}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
      <div className={`editor-content ${viewMode === 'split' ? 'split-view' : ''}`}>
        {viewMode === 'preview' ? (
          <div className="markdown-preview" ref={previewRef}>
            <MarkdownRenderer content={content} enableMermaid={enableMermaid} />
          </div>
        ) : viewMode === 'edit' ? (
          <textarea
            ref={editorRef}
            className="markdown-textarea"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onScroll={handleEditorScroll}
            placeholder="Enter markdown content..."
          />
        ) : (
          <div className="split-container">
            <div className="split-editor">
              <textarea
                ref={editorRef}
                className="markdown-textarea"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onScroll={handleEditorScroll}
                placeholder="Enter markdown content..."
              />
            </div>
            <div className="split-preview">
              <div className="markdown-preview" ref={previewRef} onScroll={handlePreviewScroll}>
                <MarkdownRenderer content={editContent} enableMermaid={enableMermaid} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarkdownEditor;
