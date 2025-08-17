# Markdown Preview Feature

## Overview

The SpecDev extension now includes a comprehensive markdown preview feature that enhances the editing experience with multiple view modes and real-time preview capabilities.

## Features

### 🔄 Multiple View Modes

The markdown editor now supports three distinct view modes:

1. **👁️ Preview Mode** - View only the rendered markdown content
2. **✏️ Edit Mode** - Edit only the markdown source
3. **📄 Split Mode** - Side-by-side editing and preview

### ⚡ Real-time Preview

- Live preview updates as you type (with 800ms debounce)
- Synchronized scrolling between editor and preview
- Automatic content preservation when switching modes

### 🎨 Enhanced Rendering

- Full markdown syntax support
- Syntax-highlighted code blocks
- Properly formatted tables
- Mermaid diagram rendering (in design documents)
- Responsive design for mobile devices

## How to Use

1. **Open SpecDev**: Use the command palette (`Cmd+Shift+P`) and run "Open SpecDev"
2. **Select a Feature**: Choose a feature from the dropdown
3. **Choose View Mode**: Click one of the three view mode buttons in the toolbar
4. **Edit Content**: 
   - In Edit mode: Use the textarea to edit markdown
   - In Split mode: Edit on the left, see preview on the right
   - In Preview mode: View the rendered content

## View Mode Details

### Preview Mode
- Clean, distraction-free reading experience
- Full markdown rendering with proper styling
- Mermaid diagrams rendered as interactive SVGs
- Optimized for reviewing and presenting content

### Edit Mode
- Full-screen markdown editor
- Monospace font for better code editing
- Save/Cancel buttons for explicit control
- Syntax highlighting for markdown

### Split Mode
- Editor panel on the left (50% width)
- Preview panel on the right (50% width)
- Real-time preview updates as you type
- Synchronized scrolling between panels
- Perfect for writing while seeing results

## Technical Implementation

### Component Structure
```
MarkdownEditor
├── View Mode Controls (Preview/Edit/Split buttons)
├── Edit Controls (Save/Cancel - shown in Edit mode)
└── Content Area
    ├── Preview Only (ReactMarkdown)
    ├── Edit Only (Textarea)
    └── Split Container
        ├── Editor Panel (Textarea)
        └── Preview Panel (ReactMarkdown)
```

### Key Features
- **Debounced Auto-save**: Changes saved automatically after 800ms of inactivity
- **Synchronized Scrolling**: Proportional scroll sync between editor and preview
- **State Preservation**: Content maintained when switching between modes
- **Responsive Design**: Adapts to mobile screens with vertical stacking

## CSS Classes Added

- `.view-mode-controls` - Container for mode toggle buttons
- `.view-mode-button` - Individual mode buttons with active state
- `.split-container` - Container for split view layout
- `.split-editor` - Left panel in split view
- `.split-preview` - Right panel in split view
- `.editor-content.split-view` - Modified content area for split layout

## Browser Compatibility

The feature works in all modern browsers and is optimized for VS Code's webview environment.

## Future Enhancements

Potential improvements for future versions:
- Adjustable split panel sizes
- Vim/Emacs keybindings in editor
- Export to PDF/HTML
- Custom CSS themes
- Plugin system for additional markdown extensions
