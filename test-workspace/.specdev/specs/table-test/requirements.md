# Requirements Document - Table Test

## Introduction
This is a test for table rendering in markdown.

## Feature Comparison Table

| Feature | Status | Priority | Description |
|---------|--------|----------|-------------|
| Preview Mode | ✅ Complete | High | Edit Mode | ✅ Complete | High |
| Split Mode | ✅ Complete | High | 
| Sync Scroll | ✅ Complete | Medium |

## Requirements

### Requirement 1
**User Story:** As a developer, I want to see properly formatted tables, so that I can organize information clearly.

#### Acceptance Criteria
1. WHEN I write a markdown table THEN it SHALL render with proper borders and styling
2. WHEN I view the table THEN it SHALL be responsive and readable
3. IF the table is wide THEN it SHALL scroll horizontally without breaking layout

### Requirement 2  
**User Story:** As a user, I want to use GitHub Flavored Markdown features, so that I can write rich documentation.

#### Acceptance Criteria
1. WHEN I use strikethrough text ~~like this~~ THEN it SHALL render correctly
2. WHEN I use task lists THEN they SHALL be interactive
3. WHEN I use code blocks with syntax highlighting THEN they SHALL be properly formatted

## Code Example

```typescript
interface TableProps {
  data: Array<Record<string, any>>;
  columns: string[];
}

const Table: React.FC<TableProps> = ({ data, columns }) => {
  return (
    <table>
      <thead>
        <tr>
          {columns.map(col => <th key={col}>{col}</th>)}
        </tr>
      </thead>
      <tbody>
        {data.map((row, idx) => (
          <tr key={idx}>
            {columns.map(col => <td key={col}>{row[col]}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  );
};
```

## Task List Example

- [x] Create table component
- [x] Add styling for tables  
- [ ] Test table responsiveness
- [ ] Add table sorting functionality
  - [ ] Implement sort by column
  - [ ] Add sort indicators
  - [ ] Handle different data types

## Blockquote Example

> This is a blockquote that should be styled properly with a left border and different background color.
> 
> It can span multiple lines and should maintain consistent formatting throughout.

## Links and Emphasis

This text contains **bold text**, *italic text*, and ~~strikethrough text~~.

Here's a [link to GitHub](https://github.com) that should open in a new tab.

`Inline code` should be highlighted differently from regular text.