# Ruler Instructions

# SpecDev Product Overview

SpecDev is a VS Code extension that implements a Kiro-style workflow for specification development. It provides a structured three-tab interface for managing software project specifications:

- **Requirements Tab**: EARS-formatted requirements with user stories and acceptance criteria
- **Design Tab**: Technical documentation with Mermaid diagram support for architecture visualization
- **Tasks Tab**: Interactive task management with markdown checkboxes

The extension follows a feature-based organization where specifications are stored under `.specdev/specs/{feature-name}/` with separate files for requirements.md, design.md, and tasks.md. It integrates with Cursor's AI agent for document generation while providing a clean UI for editing and managing specifications.

Key value propositions:
- Structured workflow from requirements → design → tasks
- Visual architecture documentation with Mermaid diagrams
- Interactive task tracking with checkboxes
- Git-friendly markdown file storage
- Seamless VS Code integration


