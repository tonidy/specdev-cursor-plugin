# Design Document - Markdown Preview Feature

## Architecture Overview
```mermaid
graph TD
    A[MarkdownEditor Component] --> B[View Mode State]
    B --> C{View Mode}
    C -->|preview| D[ReactMarkdown Preview]
    C -->|edit| E[Textarea Editor]
    C -->|split| F[Split Container]
    F --> G[Editor Panel]
    F --> H[Preview Panel]
    G --> I[Synchronized Scrolling]
    H --> I
    D --> J[Mermaid Rendering]
    H --> J
```

## Component Architecture

### MarkdownEditor Component
The main component that manages the markdown editing experience with three distinct view modes:
- **Preview Mode**: Shows only the rendered markdown
- **Edit Mode**: Shows only the source editor
- **Split Mode**: Shows both editor and preview side-by-side

### View Mode Controls
A toolbar with three buttons allowing users to switch between different viewing modes:
- 👁️ Preview - View rendered content only
- ✏️ Edit - Edit source markdown only
- 📄 Split - Side-by-side editing and preview

### Split View Container
When in split mode, the container divides the available space:
- Left panel: Source editor with syntax highlighting
- Right panel: Live preview with real-time updates

## State Management
```mermaid
stateDiagram-v2
    [*] --> Preview
    Preview --> Edit: Click Edit Button
    Preview --> Split: Click Split Button
    Edit --> Preview: Save/Cancel
    Edit --> Split: Click Split Button
    Split --> Preview: Click Preview Button
    Split --> Edit: Click Edit Button

    state Split {
        [*] --> Editing
        Editing --> Previewing: Auto-update
        Previewing --> Scrolling: User scroll
        Scrolling --> Editing: Sync scroll
    }
```

## Data Flow
```mermaid
sequenceDiagram
    participant U as User
    participant E as Editor
    participant P as Preview
    participant S as State

    U->>E: Type content
    E->>S: Update editContent
    S->>P: Trigger re-render (debounced)
    P->>P: Render markdown
    U->>E: Scroll editor
    E->>P: Sync scroll position
    U->>P: Scroll preview
    P->>E: Sync scroll position
```

## Technical Implementation

### Synchronized Scrolling
The split view implements proportional scrolling between editor and preview:
- Calculate scroll percentage in source panel
- Apply same percentage to target panel
- Bidirectional synchronization

### Auto-save with Debouncing
Changes are automatically saved with a 800ms delay to prevent excessive file operations while maintaining responsiveness.

### Responsive Design
The interface adapts to smaller screens by:
- Stacking split panels vertically on mobile
- Adjusting toolbar layout for narrow screens
- Maintaining usability across device sizes