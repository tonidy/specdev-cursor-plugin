import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

class SpecDevProvider {
  private static currentPanel: vscode.WebviewPanel | undefined;
  private readonly extensionUri: vscode.Uri;
  private currentFeature: string = '';

  constructor(extensionUri: vscode.Uri) {
    this.extensionUri = extensionUri;
  }

  public static createOrShow(extensionUri: vscode.Uri) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (SpecDevProvider.currentPanel) {
      SpecDevProvider.currentPanel.reveal(column);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'specdev',
      'SpecDev',
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, 'dist', 'webview'),
          vscode.Uri.joinPath(extensionUri, 'media')
        ],
      }
    );

    SpecDevProvider.currentPanel = panel;
    const provider = new SpecDevProvider(extensionUri);
    provider.setupWebview(panel);

    panel.onDidDispose(
      () => {
        SpecDevProvider.currentPanel = undefined;
      },
      null,
    );
  }

  private setupWebview(panel: vscode.WebviewPanel) {
    panel.webview.html = this.getHtmlForWebview(panel.webview);

    panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case 'loadFeatures':
            const features = await this.getAvailableFeatures();
            panel.webview.postMessage({
              command: 'featuresLoaded',
              features: features
            });
            break;
          case 'loadFiles':
            const fileContent = await this.loadSpecDevFiles(message.feature);
            panel.webview.postMessage({
              command: 'filesLoaded',
              content: fileContent,
              currentFeature: message.feature
            });
            break;
          case 'saveFile':
            await this.saveSpecDevFile(message.type, message.content, message.feature);
            break;
          case 'createFeature':
            await this.createFeature(message.featureName);
            const updatedFeatures = await this.getAvailableFeatures();
            panel.webview.postMessage({
              command: 'featuresLoaded',
              features: updatedFeatures
            });
            break;
          case 'regenerate':
            vscode.window.showInformationMessage(`Regenerating ${message.type}... (stub)`);
            // TODO: Integrate with Cursor GPT for actual regeneration
            break;
          case 'scanCodebase':
            const codebaseInfo = await this.scanCodebase();
            panel.webview.postMessage({
              command: 'codebaseScanned',
              codebaseInfo: codebaseInfo
            });
            break;
        }
      },
      undefined,
    );
  }

  private async getAvailableFeatures(): Promise<string[]> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      return [];
    }

    const specsPath = path.join(workspaceFolder.uri.fsPath, '.specdev', 'specs');

    // Ensure .specdev/specs directory exists
    if (!fs.existsSync(specsPath)) {
      fs.mkdirSync(specsPath, { recursive: true });
    }

    try {
      const features = fs.readdirSync(specsPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
      return features;
    } catch (error) {
      console.error('Error reading features:', error);
      return [];
    }
  }

  private async createFeature(featureName: string): Promise<void> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      vscode.window.showErrorMessage('No workspace folder found');
      return;
    }

    const featurePath = path.join(workspaceFolder.uri.fsPath, '.specdev', 'specs', featureName);

    // Ensure feature directory exists
    if (!fs.existsSync(featurePath)) {
      fs.mkdirSync(featurePath, { recursive: true });
    }

    // Create default files for the feature
    const files = {
      'requirements.md': this.getDefaultRequirementsContent(featureName),
      'design.md': this.getDefaultDesignContent(featureName),
      'tasks.md': this.getDefaultTasksContent(featureName)
    };

    for (const [filename, content] of Object.entries(files)) {
      const filePath = path.join(featurePath, filename);
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, content, 'utf8');
      }
    }

    vscode.window.showInformationMessage(`Feature "${featureName}" created successfully`);
  }

  private getDefaultRequirementsContent(featureName: string): string {
    return `# Requirements Document - ${featureName}

## Introduction
[Introduction text here for ${featureName}]

## Requirements

### Requirement 1
**User Story:** As a [role], I want [feature], so that [benefit]

#### Acceptance Criteria
This section should have EARS requirements
1. WHEN [event] THEN [system] SHALL [response]
2. IF [precondition] THEN [system] SHALL [response]

### Requirement 2
**User Story:** As a [role], I want [feature], so that [benefit]

#### Acceptance Criteria
1. WHEN [event] THEN [system] SHALL [response]
2. WHEN [event] AND [condition] THEN [system] SHALL [response]
`;
  }

  private getDefaultDesignContent(featureName: string): string {
    return `# Design Document - ${featureName}

## Architecture Overview
\`\`\`mermaid
graph TD
    A[User Interface] --> B[Business Logic]
    B --> C[Data Layer]
    C --> D[Storage]
\`\`\`

## System Components

### Component 1
Description of component 1

### Component 2  
Description of component 2

## Data Flow
\`\`\`mermaid
sequenceDiagram
    participant U as User
    participant S as System
    participant D as Database
    
    U->>S: Request
    S->>D: Query
    D->>S: Response
    S->>U: Result
\`\`\`
`;
  }

  private getDefaultTasksContent(featureName: string): string {
    return `# Task List - ${featureName}

## Sprint 1

- [ ] Task 1: Implement user authentication
  - [ ] Create login form
  - [ ] Add validation
  - [ ] Integrate with backend API

- [ ] Task 2: Design database schema
  - [x] Define user table
  - [ ] Define product table
  - [ ] Create relationships

- [ ] Task 3: Setup project infrastructure
  - [x] Initialize repository
  - [x] Setup CI/CD pipeline
  - [ ] Configure deployment
`;
  }

  private async loadSpecDevFiles(feature: string): Promise<{ requirements: string, design: string, tasks: string }> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      return { requirements: '', design: '', tasks: '' };
    }

    const featurePath = path.join(workspaceFolder.uri.fsPath, '.specdev', 'specs', feature);

    // Ensure feature directory exists
    if (!fs.existsSync(featurePath)) {
      fs.mkdirSync(featurePath, { recursive: true });
    }

    const files = ['requirements.md', 'design.md', 'tasks.md'];
    const content: any = {};

    for (const file of files) {
      const filePath = path.join(featurePath, file);
      const key = file.replace('.md', '');

      try {
        if (fs.existsSync(filePath)) {
          content[key] = fs.readFileSync(filePath, 'utf8');
        } else {
          // Create default content if file doesn't exist
          const defaultContent = this.getDefaultContentForFile(file, feature);
          fs.writeFileSync(filePath, defaultContent, 'utf8');
          content[key] = defaultContent;
        }
      } catch (error) {
        content[key] = '';
      }
    }

    return content;
  }

  private getDefaultContentForFile(filename: string, feature: string): string {
    switch (filename) {
      case 'requirements.md':
        return this.getDefaultRequirementsContent(feature);
      case 'design.md':
        return this.getDefaultDesignContent(feature);
      case 'tasks.md':
        return this.getDefaultTasksContent(feature);
      default:
        return '';
    }
  }

  private async saveSpecDevFile(type: string, content: string, feature: string): Promise<void> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      vscode.window.showErrorMessage('No workspace folder found');
      return;
    }

    const featurePath = path.join(workspaceFolder.uri.fsPath, '.specdev', 'specs', feature);

    // Ensure feature directory exists
    if (!fs.existsSync(featurePath)) {
      fs.mkdirSync(featurePath, { recursive: true });
    }

    const filePath = path.join(featurePath, `${type}.md`);

    try {
      fs.writeFileSync(filePath, content, 'utf8');
      vscode.window.showInformationMessage(`${type}.md saved successfully for feature "${feature}"`);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to save ${type}.md: ${error}`);
    }
  }

  private async scanCodebase(): Promise<any> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      return { error: 'No workspace folder found' };
    }

    const rootPath = workspaceFolder.uri.fsPath;
    const codebaseInfo: {
      projectStructure: any[];
      technologies: string[];
      packageFiles: any[];
      configFiles: string[];
      sourceFiles: { directory: string; files: string[] }[];
    } = {
      projectStructure: [],
      technologies: [],
      packageFiles: [],
      configFiles: [],
      sourceFiles: []
    };

    try {
      // Scan for package files and technologies
      const packageJsonPath = path.join(rootPath, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        codebaseInfo.packageFiles.push({
          file: 'package.json',
          dependencies: Object.keys(packageJson.dependencies || {}),
          devDependencies: Object.keys(packageJson.devDependencies || {}),
          scripts: Object.keys(packageJson.scripts || {})
        });

        // Detect technologies from dependencies
        const allDeps = [...Object.keys(packageJson.dependencies || {}), ...Object.keys(packageJson.devDependencies || {})];
        if (allDeps.some(dep => dep.includes('react'))) codebaseInfo.technologies.push('React');
        if (allDeps.some(dep => dep.includes('vue'))) codebaseInfo.technologies.push('Vue');
        if (allDeps.some(dep => dep.includes('angular'))) codebaseInfo.technologies.push('Angular');
        if (allDeps.some(dep => dep.includes('typescript'))) codebaseInfo.technologies.push('TypeScript');
        if (allDeps.some(dep => dep.includes('express'))) codebaseInfo.technologies.push('Express');
        if (allDeps.some(dep => dep.includes('next'))) codebaseInfo.technologies.push('Next.js');
      }

      // Check for other common files
      const commonFiles = ['tsconfig.json', 'webpack.config.js', 'vite.config.js', '.eslintrc.json', 'tailwind.config.js'];
      for (const file of commonFiles) {
        if (fs.existsSync(path.join(rootPath, file))) {
          codebaseInfo.configFiles.push(file);
        }
      }

      // Scan directory structure (limited depth)
      codebaseInfo.projectStructure = this.scanDirectory(rootPath, 2);

      // Find main source directories
      const sourceDirs = ['src', 'lib', 'app', 'pages', 'components'];
      for (const dir of sourceDirs) {
        const dirPath = path.join(rootPath, dir);
        if (fs.existsSync(dirPath)) {
          const files = this.getFilesInDirectory(dirPath, ['.ts', '.tsx', '.js', '.jsx', '.vue', '.py', '.java', '.cs']);
          codebaseInfo.sourceFiles.push({
            directory: dir,
            files: files.slice(0, 10) // Limit to first 10 files
          });
        }
      }

    } catch (error) {
      console.error('Error scanning codebase:', error);
      return { error: 'Failed to scan codebase' };
    }

    return codebaseInfo;
  }

  private scanDirectory(dirPath: string, maxDepth: number, currentDepth: number = 0): any[] {
    if (currentDepth >= maxDepth) return [];

    try {
      const items = fs.readdirSync(dirPath, { withFileTypes: true });
      const result = [];

      for (const item of items) {
        if (item.name.startsWith('.') && !['src', 'dist', 'build'].includes(item.name)) continue;
        if (item.name === 'node_modules') continue;

        if (item.isDirectory()) {
          const subItems = this.scanDirectory(path.join(dirPath, item.name), maxDepth, currentDepth + 1);
          result.push({
            name: item.name,
            type: 'directory',
            children: subItems
          });
        } else {
          result.push({
            name: item.name,
            type: 'file'
          });
        }
      }

      return result.slice(0, 20); // Limit items per directory
    } catch (error) {
      return [];
    }
  }

  private getFilesInDirectory(dirPath: string, extensions: string[]): string[] {
    try {
      const files = [];
      const items = fs.readdirSync(dirPath, { withFileTypes: true });

      for (const item of items) {
        if (item.isFile() && extensions.some(ext => item.name.endsWith(ext))) {
          files.push(item.name);
        } else if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
          const subFiles = this.getFilesInDirectory(path.join(dirPath, item.name), extensions);
          files.push(...subFiles.map(f => `${item.name}/${f}`));
        }
      }

      return files;
    } catch (error) {
      return [];
    }
  }

  private getNonce(length = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let nonce = '';
    for (let i = 0; i < length; i++) {
      nonce += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return nonce;
  }

  private getHtmlForWebview(webview: vscode.Webview): string {
    const webviewRoot = vscode.Uri.joinPath(this.extensionUri, 'dist', 'webview');
    const manifestPath = vscode.Uri.joinPath(webviewRoot, '.vite', 'manifest.json');
    const indexPath = vscode.Uri.joinPath(webviewRoot, 'index.html');
    const nonce = this.getNonce();

    console.log('Loading webview from:', webviewRoot.fsPath);
    console.log('Manifest path:', manifestPath.fsPath);
    console.log('Index path:', indexPath.fsPath);

    try {
      // Check if we have a manifest.json from Vite
      if (fs.existsSync(manifestPath.fsPath)) {
        console.log('Found manifest.json, loading from Vite build...');
        const manifest = JSON.parse(fs.readFileSync(manifestPath.fsPath, 'utf8'));
        const entry = manifest['index.html'];
        
        if (entry) {
          // Get the main JS file
          const scriptFile = entry.file;
          const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(webviewRoot, scriptFile));
          
          // Get CSS files
          const styleUris = (entry.css || []).map((cssFile: string) =>
            webview.asWebviewUri(vscode.Uri.joinPath(webviewRoot, cssFile))
          );

          // Build CSP
          const csp = [
            "default-src 'none'",
            `img-src ${webview.cspSource} https: data:`,
            `font-src ${webview.cspSource}`,
            `style-src ${webview.cspSource} 'unsafe-inline'`,
            `script-src 'nonce-${nonce}'`
          ].join('; ');

          // Return HTML with Vite assets
          return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SpecDev</title>
${styleUris.map((uri: vscode.Uri) => `<link rel="stylesheet" href="${uri}">`).join('\n')}
</head>
<body>
<div id="root"></div>
<script nonce="${nonce}" type="module" src="${scriptUri}"></script>
</body>
</html>`;
        }
      }
      
      // Fallback: Try to load the built index.html directly
      if (fs.existsSync(indexPath.fsPath)) {
        let html = fs.readFileSync(indexPath.fsPath, 'utf8');
        
        // Get base URI for webview
        const baseUri = webview.asWebviewUri(webviewRoot);
        
        // Replace relative paths with webview URIs
        html = html.replace(/href="\//g, `href="${baseUri}/`);
        html = html.replace(/src="\//g, `src="${baseUri}/`);
        html = html.replace(/href="assets\//g, `href="${baseUri}/assets/`);
        html = html.replace(/src="assets\//g, `src="${baseUri}/assets/`);
        
        // Add CSP
        const csp = `<meta http-equiv="Content-Security-Policy" content="
          default-src 'none';
          img-src ${webview.cspSource} https: data:;
          script-src ${webview.cspSource} 'unsafe-inline';
          style-src ${webview.cspSource} 'unsafe-inline';
          font-src ${webview.cspSource};
        ">`;
        
        html = html.replace('<head>', `<head>\n${csp}`);
        
        return html;
      }
    } catch (error) {
      console.error('Failed to load Vite webview:', error);
    }
    
    // Fallback to inline HTML if build is not available
    return this.getFallbackHtml();
  }

  private getFallbackHtml(): string {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>SpecDev</title>
        <style>
            body {
                font-family: var(--vscode-font-family);
                font-size: var(--vscode-font-size);
                background-color: var(--vscode-editor-background);
                color: var(--vscode-editor-foreground);
                margin: 0;
                padding: 20px;
            }
            .container {
                max-width: 1200px;
                margin: 0 auto;
            }
            .feature-selector {
                margin-bottom: 20px;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .feature-selector select {
                padding: 8px 12px;
                background: var(--vscode-input-background);
                color: var(--vscode-input-foreground);
                border: 1px solid var(--vscode-input-border);
                border-radius: 4px;
                min-width: 200px;
            }
            .feature-selector button {
                background: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border: none;
                padding: 8px 12px;
                cursor: pointer;
                border-radius: 4px;
            }
            .feature-selector button:hover {
                background: var(--vscode-button-hoverBackground);
            }
            .tabs {
                display: flex;
                border-bottom: 1px solid var(--vscode-panel-border);
                margin-bottom: 20px;
            }
            .tab {
                padding: 10px 20px;
                background: var(--vscode-tab-inactiveBackground);
                border: none;
                color: var(--vscode-tab-inactiveForeground);
                cursor: pointer;
                border-bottom: 2px solid transparent;
            }
            .tab.active {
                background: var(--vscode-tab-activeBackground);
                color: var(--vscode-tab-activeForeground);
                border-bottom-color: var(--vscode-tab-activeBorder);
            }
            .content {
                display: none;
            }
            .content.active {
                display: block;
            }
            textarea {
                width: 100%;
                height: 500px;
                background: var(--vscode-input-background);
                color: var(--vscode-input-foreground);
                border: 1px solid var(--vscode-input-border);
                padding: 10px;
                font-family: 'Courier New', monospace;
                resize: vertical;
            }
            .toolbar {
                margin-bottom: 10px;
            }
            button {
                background: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border: none;
                padding: 6px 12px;
                cursor: pointer;
                margin-right: 10px;
            }
            button:hover {
                background: var(--vscode-button-hoverBackground);
            }
            .no-features {
                text-align: center;
                padding: 40px;
                color: var(--vscode-descriptionForeground);
            }
            .editor-container, .preview-container {
                height: 500px;
                overflow-y: auto;
            }
            .preview-container {
                border: 1px solid var(--vscode-panel-border);
                padding: 15px;
                background: var(--vscode-editor-background);
            }
            .preview-header {
                margin-bottom: 20px;
                border-bottom: 1px solid var(--vscode-panel-border);
                padding-bottom: 10px;
            }
            .preview-header h3 {
                margin: 0 0 10px 0;
                color: var(--vscode-editor-foreground);
            }
            .codebase-info {
                background: var(--vscode-textBlockQuote-background);
                padding: 10px;
                border-left: 3px solid var(--vscode-textLink-foreground);
                margin: 10px 0;
            }
            .codebase-info h4 {
                margin: 0 0 10px 0;
                color: var(--vscode-textLink-foreground);
            }
            .tech-badge {
                display: inline-block;
                background: var(--vscode-badge-background);
                color: var(--vscode-badge-foreground);
                padding: 2px 6px;
                border-radius: 3px;
                font-size: 12px;
                margin: 2px;
            }
            .file-list {
                font-family: monospace;
                font-size: 12px;
                color: var(--vscode-descriptionForeground);
            }
            .preview-content {
                line-height: 1.6;
            }
            .preview-content h1, .preview-content h2, .preview-content h3 {
                color: var(--vscode-editor-foreground);
                border-bottom: 1px solid var(--vscode-panel-border);
                padding-bottom: 5px;
            }
            .preview-content ul, .preview-content ol {
                padding-left: 20px;
            }
            .preview-content code {
                background: var(--vscode-textCodeBlock-background);
                padding: 2px 4px;
                border-radius: 3px;
                font-family: monospace;
            }
            .preview-content pre {
                background: var(--vscode-textCodeBlock-background);
                padding: 10px;
                border-radius: 5px;
                overflow-x: auto;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>SpecDev - Specification Development</h1>
            
            <div class="feature-selector">
                <label for="feature-select">Feature:</label>
                <select id="feature-select" onchange="loadFeature()">
                    <option value="">Select a feature...</option>
                </select>
                <button onclick="createNewFeature()">Create New Feature</button>
            </div>

            <div id="no-features" class="no-features" style="display: none;">
                <h3>No features found</h3>
                <p>Create your first feature to get started with SpecDev.</p>
                <button onclick="createNewFeature()">Create First Feature</button>
            </div>

            <div id="main-content" style="display: none;">
                <div class="tabs">
                    <button class="tab active" onclick="showTab('requirements')">Requirements</button>
                    <button class="tab" onclick="showTab('design')">Design</button>
                    <button class="tab" onclick="showTab('tasks')">Tasks</button>
                </div>

                <div id="requirements" class="content active">
                    <div class="toolbar">
                        <button onclick="saveFile('requirements')">Save Requirements</button>
                        <button onclick="togglePreview('requirements')" id="preview-btn-requirements">Preview</button>
                    </div>
                    <div id="requirements-editor" class="editor-container">
                        <textarea id="requirements-content" placeholder="Enter requirements in markdown format..."></textarea>
                    </div>
                    <div id="requirements-preview" class="preview-container" style="display: none;">
                        <div class="preview-header">
                            <h3>Requirements Preview</h3>
                            <div class="codebase-info" id="codebase-info" style="display: none;">
                                <h4>Existing Codebase Analysis</h4>
                                <div id="codebase-details"></div>
                            </div>
                        </div>
                        <div class="preview-content" id="requirements-preview-content"></div>
                    </div>
                </div>

                <div id="design" class="content">
                    <div class="toolbar">
                        <button onclick="saveFile('design')">Save Design</button>
                    </div>
                    <textarea id="design-content" placeholder="Enter design documentation with Mermaid diagrams..."></textarea>
                </div>

                <div id="tasks" class="content">
                    <div class="toolbar">
                        <button onclick="saveFile('tasks')">Save Tasks</button>
                    </div>
                    <textarea id="tasks-content" placeholder="Enter tasks in markdown format with checkboxes..."></textarea>
                </div>
            </div>
        </div>

        <script>
            const vscode = acquireVsCodeApi();
            let currentContent = { requirements: '', design: '', tasks: '' };
            let currentFeature = '';
            let availableFeatures = [];

            // Load features on startup
            vscode.postMessage({ command: 'loadFeatures' });

            // Handle messages from extension
            window.addEventListener('message', event => {
                const message = event.data;
                switch (message.command) {
                    case 'featuresLoaded':
                        availableFeatures = message.features || [];
                        updateFeatureDropdown();
                        break;
                    case 'filesLoaded':
                        currentContent = message.content;
                        currentFeature = message.currentFeature;
                        updateTextareas();
                        break;
                    case 'codebaseScanned':
                        displayCodebaseInfo(message.codebaseInfo);
                        break;
                }
            });

            function updateFeatureDropdown() {
                const select = document.getElementById('feature-select');
                const noFeatures = document.getElementById('no-features');
                const mainContent = document.getElementById('main-content');
                
                // Clear existing options
                select.innerHTML = '<option value="">Select a feature...</option>';
                
                if (availableFeatures.length === 0) {
                    noFeatures.style.display = 'block';
                    mainContent.style.display = 'none';
                } else {
                    noFeatures.style.display = 'none';
                    mainContent.style.display = 'block';
                    
                    // Add feature options
                    availableFeatures.forEach(feature => {
                        const option = document.createElement('option');
                        option.value = feature;
                        option.textContent = feature;
                        select.appendChild(option);
                    });
                }
            }

            function loadFeature() {
                const select = document.getElementById('feature-select');
                const selectedFeature = select.value;
                
                if (selectedFeature) {
                    vscode.postMessage({
                        command: 'loadFiles',
                        feature: selectedFeature
                    });
                }
            }

            function createNewFeature() {
                const featureName = prompt('Enter feature name:');
                if (featureName && featureName.trim()) {
                    vscode.postMessage({
                        command: 'createFeature',
                        featureName: featureName.trim()
                    });
                }
            }

            function showTab(tabName) {
                // Hide all content
                const contents = document.querySelectorAll('.content');
                contents.forEach(content => content.classList.remove('active'));
                
                // Remove active from all tabs
                const tabs = document.querySelectorAll('.tab');
                tabs.forEach(tab => tab.classList.remove('active'));
                
                // Show selected content and tab
                document.getElementById(tabName).classList.add('active');
                event.target.classList.add('active');
            }

            function saveFile(type) {
                if (!currentFeature) {
                    alert('Please select a feature first');
                    return;
                }
                
                const content = document.getElementById(type + '-content').value;
                vscode.postMessage({
                    command: 'saveFile',
                    type: type,
                    content: content,
                    feature: currentFeature
                });

                // If saving requirements, automatically scan codebase and show preview
                if (type === 'requirements') {
                    setTimeout(() => {
                        vscode.postMessage({ command: 'scanCodebase' });
                        showPreview(type, content);
                    }, 500);
                }
            }

            function togglePreview(type) {
                const editor = document.getElementById(type + '-editor');
                const preview = document.getElementById(type + '-preview');
                const btn = document.getElementById('preview-btn-' + type);
                
                if (preview.style.display === 'none') {
                    const content = document.getElementById(type + '-content').value;
                    showPreview(type, content);
                    editor.style.display = 'none';
                    preview.style.display = 'block';
                    btn.textContent = 'Edit';
                    
                    // Scan codebase when showing preview
                    vscode.postMessage({ command: 'scanCodebase' });
                } else {
                    editor.style.display = 'block';
                    preview.style.display = 'none';
                    btn.textContent = 'Preview';
                }
            }

            function showPreview(type, content) {
                const previewContent = document.getElementById(type + '-preview-content');
                previewContent.innerHTML = markdownToHtml(content);
            }

            function displayCodebaseInfo(codebaseInfo) {
                const codebaseDiv = document.getElementById('codebase-info');
                const detailsDiv = document.getElementById('codebase-details');
                
                if (codebaseInfo.error) {
                    codebaseDiv.style.display = 'none';
                    return;
                }

                let html = '';
                
                if (codebaseInfo.technologies && codebaseInfo.technologies.length > 0) {
                    html += '<p><strong>Technologies:</strong><br>';
                    codebaseInfo.technologies.forEach(tech => {
                        html += \`<span class="tech-badge">\${tech}</span>\`;
                    });
                    html += '</p>';
                }

                if (codebaseInfo.packageFiles && codebaseInfo.packageFiles.length > 0) {
                    const pkg = codebaseInfo.packageFiles[0];
                    if (pkg.dependencies && pkg.dependencies.length > 0) {
                        html += \`<p><strong>Key Dependencies:</strong> \${pkg.dependencies.slice(0, 5).join(', ')}\`;
                        if (pkg.dependencies.length > 5) html += \` and \${pkg.dependencies.length - 5} more\`;
                        html += '</p>';
                    }
                }

                if (codebaseInfo.sourceFiles && codebaseInfo.sourceFiles.length > 0) {
                    html += '<p><strong>Source Structure:</strong></p>';
                    codebaseInfo.sourceFiles.forEach(dir => {
                        if (dir.files && dir.files.length > 0) {
                            html += \`<div class="file-list"><strong>\${dir.directory}/</strong><br>\`;
                            html += dir.files.slice(0, 3).map(f => \`  \${f}\`).join('<br>');
                            if (dir.files.length > 3) html += \`<br>  ... and \${dir.files.length - 3} more files\`;
                            html += '</div>';
                        }
                    });
                }

                if (html) {
                    detailsDiv.innerHTML = html;
                    codebaseDiv.style.display = 'block';
                } else {
                    codebaseDiv.style.display = 'none';
                }
            }

            // Simple markdown to HTML converter
            function markdownToHtml(markdown) {
                return markdown
                    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
                    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
                    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
                    .replace(/^\*\*(.*)\*\*/gim, '<strong>$1</strong>')
                    .replace(/^\*(.*)\*/gim, '<em>$1</em>')
                    .replace(/^\`(.*)\`/gim, '<code>$1</code>')
                    .replace(/^- (.*$)/gim, '<li>$1</li>')
                    .replace(/^\\d+\\. (.*$)/gim, '<li>$1</li>')
                    .replace(/\\n\\n/g, '</p><p>')
                    .replace(/\\n/g, '<br>')
                    .replace(/^(.*)$/, '<p>$1</p>');
            }

            function updateTextareas() {
                document.getElementById('requirements-content').value = currentContent.requirements || getDefaultContent('requirements');
                document.getElementById('design-content').value = currentContent.design || getDefaultContent('design');
                document.getElementById('tasks-content').value = currentContent.tasks || getDefaultContent('tasks');
            }

            function getDefaultContent(type) {
                switch(type) {
                    case 'requirements':
                        return \`# Requirements Document\n\n## Introduction\n[Introduction text here]\n\n## Requirements\n\n### Requirement 1\n**User Story:** As a [role], I want [feature], so that [benefit]\n\n#### Acceptance Criteria\nThis section should have EARS requirements\n1. WHEN [event] THEN [system] SHALL [response]\n2. IF [precondition] THEN [system] SHALL [response]\n\n### Requirement 2\n**User Story:** As a [role], I want [feature], so that [benefit]\n\n#### Acceptance Criteria\n1. WHEN [event] THEN [system] SHALL [response]\n2. WHEN [event] AND [condition] THEN [system] SHALL [response]\n\`;
                    case 'design':
                        return \`# Design Document\n\n## Architecture Overview\n\\\`\\\`\\\`mermaid\ngraph TD\n    A[User Interface] --> B[Business Logic]\n    B --> C[Data Layer]\n    C --> D[Storage]\n\\\`\\\`\\\`\n\n## System Components\n\n### Component 1\nDescription of component 1\n\n### Component 2  \nDescription of component 2\n\n## Data Flow\n\\\`\\\`\\\`mermaid\nsequenceDiagram\n    participant U as User\n    participant S as System\n    participant D as Database\n    \n    U->>S: Request\n    S->>D: Query\n    D->>S: Response\n    S->>U: Result\n\\\`\\\`\\\`\n\`;
                    case 'tasks':
                        return \`# Task List\n\n## Sprint 1\n\n- [ ] Task 1: Implement user authentication\n  - [ ] Create login form\n  - [ ] Add validation\n  - [ ] Integrate with backend API\n\n- [ ] Task 2: Design database schema\n  - [x] Define user table\n  - [ ] Define product table\n  - [ ] Create relationships\n\n- [ ] Task 3: Setup project infrastructure\n  - [x] Initialize repository\n  - [x] Setup CI/CD pipeline\n  - [ ] Configure deployment\n\`;
                    default:
                        return '';
                }
            }
        </script>
    </body>
    </html>`;
  }
}

export function activate(context: vscode.ExtensionContext) {
  const provider = vscode.commands.registerCommand('specdev.openSpecDev', () => {
    SpecDevProvider.createOrShow(context.extensionUri);
  });

  // /specdev init
  const initCmd = vscode.commands.registerCommand('specdev.init', async () => {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) return;

    // Create .specdev/specs directory structure
    const specdevPath = path.join(workspaceFolder.uri.fsPath, '.specdev');
    const specsPath = path.join(specdevPath, 'specs');
    if (!fs.existsSync(specdevPath)) fs.mkdirSync(specdevPath, { recursive: true });
    if (!fs.existsSync(specsPath)) fs.mkdirSync(specsPath, { recursive: true });

    // Generate .cursor/rules files
    const cursorRulesPath = path.join(workspaceFolder.uri.fsPath, '.cursor', 'rules');
    if (!fs.existsSync(cursorRulesPath)) fs.mkdirSync(cursorRulesPath, { recursive: true });
    // Copy rules from prompts and rules/spec.md and tasks.md
    const specSrc = path.join(__dirname, '..', 'prompts and rules', 'spec.md');
    const tasksSrc = path.join(__dirname, '..', 'prompts and rules', 'tasks.md');
    const specDest = path.join(cursorRulesPath, 'specdev-spec.mdc');
    const tasksDest = path.join(cursorRulesPath, 'specdev-tasks.mdc');
    if (fs.existsSync(specSrc)) fs.copyFileSync(specSrc, specDest);
    if (fs.existsSync(tasksSrc)) fs.copyFileSync(tasksSrc, tasksDest);
    vscode.window.showInformationMessage('SpecDev initialized with new .specdev/specs structure and .cursor/rules files created.');
  });

  // /specdev generate requirements from prompt
  const genReqCmd = vscode.commands.registerCommand('specdev.generateRequirementsFromPrompt', async () => {
    // TODO: Use Cursor GPT API to rewrite prompt to requirements (stub)
    vscode.window.showInformationMessage('Generating requirements from prompt... (stub)');
  });

  // /specdev generate design from requirements
  const genDesignCmd = vscode.commands.registerCommand('specdev.generateDesignFromRequirements', async () => {
    // TODO: Use Cursor GPT API to generate design from requirements (stub)
    vscode.window.showInformationMessage('Generating design from requirements... (stub)');
  });

  // /specdev generate tasks from design
  const genTasksCmd = vscode.commands.registerCommand('specdev.generateTasksFromDesign', async () => {
    // TODO: Use Cursor GPT API to generate tasks from design (stub)
    vscode.window.showInformationMessage('Generating tasks from design... (stub)');
  });

  context.subscriptions.push(provider, initCmd, genReqCmd, genDesignCmd, genTasksCmd);
}

export function deactivate() { }
