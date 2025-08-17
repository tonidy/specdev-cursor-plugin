import React, { useState, useEffect, useRef } from 'react';
import MarkdownRenderer from './MarkdownRenderer';

interface TaskListProps {
  content: string;
  onChange: (content: string) => void;
  onTaskComplete?: (taskName: string) => void;
  activeTaskIndex?: number;
  onStartNextTask?: (nextIndex: number) => void;
}

type ViewMode = 'edit' | 'preview' | 'split';

const TaskList: React.FC<TaskListProps> = ({ content, onChange, onTaskComplete, activeTaskIndex, onStartNextTask }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('preview');
  const [editContent, setEditContent] = useState(content);
  const [showNextPrompt, setShowNextPrompt] = useState(false);
  const [completedTask, setCompletedTask] = useState<string | null>(null);
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setEditContent(content);
  }, [content]);

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
    setViewMode('preview');
  };

  const handleCancel = () => {
    setEditContent(content);
    setViewMode('preview');
  };

  // Parse tasks and enforce only one active
  const parseTasks = () => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      const isTask = line.match(/^- \[.\] (.+)/);
      return {
        line,
        isTask: !!isTask,
        taskName: isTask ? isTask[1] : '',
        checked: line.includes('- [x]'),
        index: idx
      };
    });
  };

  const tasks = parseTasks();
  const firstIncomplete = tasks.findIndex(t => t.isTask && !t.checked);



  const handleStartNext = () => {
    setShowNextPrompt(false);
    setCompletedTask(null);
    if (onStartNextTask && firstIncomplete + 1 < tasks.length) {
      onStartNextTask(firstIncomplete + 1);
    }
  };

  // Custom renderer for interactive tasks
  const InteractiveTaskRenderer: React.FC<{ content: string }> = ({ content }) => {
    let currentLineIndex = 0;
    
    // Create a modified content where we can handle checkboxes
    const modifiedContent = content.replace(/- \[([ x])\] (.+)/g, (match, checked, text) => {
      const lineIndex = currentLineIndex++;
      const isChecked = checked === 'x';
      const isActive = lineIndex === firstIncomplete;
      
      return `- ${isChecked ? '☑' : (isActive ? '🔲' : '☐')} ${text}`;
    });

    return <MarkdownRenderer content={modifiedContent} />;
  };

  return (
    <div className="task-list">
      {showNextPrompt && completedTask && (
        <div className="task-next-banner">
          <span>Task "{completedTask}" is complete. Should I start the next task?</span>
          <button onClick={handleStartNext}>Y</button>
          <button onClick={() => setShowNextPrompt(false)}>N</button>
        </div>
      )}
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
            <InteractiveTaskRenderer content={content} />
          </div>
        ) : viewMode === 'edit' ? (
          <textarea
            ref={editorRef}
            className="markdown-textarea"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onScroll={handleEditorScroll}
            placeholder="Enter task list in markdown format..."
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
                placeholder="Enter task list in markdown format..."
              />
            </div>
            <div className="split-preview">
              <div className="markdown-preview" ref={previewRef} onScroll={handlePreviewScroll}>
                <InteractiveTaskRenderer content={editContent} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskList;
