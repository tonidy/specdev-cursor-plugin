# Quick Fix untuk Webview Blank Issue

## Langkah 1: Rebuild dengan struktur yang benar
```bash
npm run build
```

## Langkah 2: Debug webview di VS Code
1. Buka Command Palette (Cmd+Shift+P)
2. Jalankan "Developer: Toggle Developer Tools"
3. Buka SpecDev panel dan lihat Console tab untuk error

## Langkah 3: Pastikan CSP tidak memblokir resources
Check apakah ada error seperti:
- "Refused to load script..."
- "Content Security Policy directive..."

## Langkah 4: Temporary fix - Update getHtmlForWebview
Di `src/extension.ts`, update method `getHtmlForWebview`:

```typescript
private getHtmlForWebview(webview: vscode.Webview): string {
    const webviewPath = vscode.Uri.joinPath(this.extensionUri, 'dist', 'webview');
    const indexPath = vscode.Uri.joinPath(webviewPath, 'index.html');
    
    try {
        if (fs.existsSync(indexPath.fsPath)) {
            let html = fs.readFileSync(indexPath.fsPath, 'utf8');
            
            // Get base URI for webview
            const baseUri = webview.asWebviewUri(webviewPath);
            
            // Replace all relative paths with webview URIs
            // Handle static folder
            html = html.replace(/href="\/static\//g, `href="${baseUri}/static/`);
            html = html.replace(/src="\/static\//g, `src="${baseUri}/static/`);
            
            // Handle root-relative paths
            html = html.replace(/href="\//g, `href="${baseUri}/`);
            html = html.replace(/src="\//g, `src="${baseUri}/`);
            
            // Update CSP to be more permissive temporarily
            const csp = `<meta http-equiv="Content-Security-Policy" content="
                default-src 'none';
                img-src ${webview.cspSource} https: data:;
                script-src ${webview.cspSource} 'unsafe-inline' 'unsafe-eval';
                style-src ${webview.cspSource} 'unsafe-inline';
                font-src ${webview.cspSource};
            ">`;
            
            html = html.replace('<head>', `<head>\n${csp}`);
            
            return html;
        }
    } catch (error) {
        console.error('Failed to load React webview:', error);
    }
    
    return this.getFallbackHtml();
}
```

## Langkah 5: Tambahkan localResourceRoots
Di method `createWebviewPanel` (biasanya di constructor atau command handler):

```typescript
const panel = vscode.window.createWebviewPanel(
    'specdev',
    'SpecDev',
    vscode.ViewColumn.Active,
    {
        enableScripts: true,
        localResourceRoots: [
            vscode.Uri.joinPath(this.extensionUri, 'dist'),
            vscode.Uri.joinPath(this.extensionUri, 'dist', 'webview'),
            vscode.Uri.joinPath(this.extensionUri, 'dist', 'webview', 'static')
        ],
        retainContextWhenHidden: true
    }
);
```

## Langkah 6: Rebuild dan test
```bash
npm run build
npm run dev
```

Kemudian test di VS Code dengan:
1. Open Command Palette (Cmd+Shift+P)
2. Run "SpecDev: Open SpecDev"
3. Select atau create feature
4. Check apakah content muncul

## Jika masih tidak berhasil:
1. Check Developer Tools Console untuk error spesifik
2. Verify bahwa dist/webview berisi:
   - index.html
   - static/js/*.js
   - static/css/*.css
3. Pertimbangkan untuk migrasi ke Vite (lihat todo list)
