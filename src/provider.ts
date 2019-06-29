import * as vscode from 'vscode';
import ManpageDocument from './manpageDocument';

export default class ManpageContentProvider implements vscode.TextDocumentContentProvider, vscode.DocumentLinkProvider {

	static scheme = 'man';

	private _onDidChange = new vscode.EventEmitter<vscode.Uri>();
	private _documents = new Map<string, ManpageDocument>();
	private _editorDecoration = vscode.window.createTextEditorDecorationType({ textDecoration: 'underline' });
	private _subscriptions: vscode.Disposable;

	constructor() {

		// Listen to the `closeTextDocument`-event which means we must
		// clear the corresponding model object - `ReferencesDocument`
		this._subscriptions = vscode.workspace.onDidCloseTextDocument(doc => this._documents.delete(doc.uri.toString()));
	}

	dispose() {
		this._subscriptions.dispose();
		this._documents.clear();
		this._editorDecoration.dispose();
		this._onDidChange.dispose();
	}

	// Expose an event to signal changes of _virtual_ documents
	// to the editor
	get onDidChange() {
		return this._onDidChange.event;
	}

	provideTextDocumentContent(uri: vscode.Uri): string | Thenable<string> {

		// already loaded?
		let document = this._documents.get(uri.toString());
		if (document) {
			return document.content;
		}

		const alpha_only_re = /([a-zA-Z_]+)(\(\d\))?/;
		const input = uri.path.substr(1);
		let m = alpha_only_re.exec(input); // skip leading '/')
		
		if(!m) {
			return new Promise(() => vscode.window.showErrorMessage('undefined'));
		}


		let word = m[1];
		let section = (m[2] === undefined) ? '' : m[2].match(/\d/);
		var cmd = `man ${section} ${word}`;
		
		return new Promise((resolve, reject) => {
			const cp = require('child_process');
			cp.exec(cmd, (err: string, stdout: string, stderr: string) => {
				if (err) {
					vscode.window.showErrorMessage(stderr);
					reject(stderr);
				} else {
					document = new ManpageDocument(stdout);
					this._documents.set(uri.toString(), document);
					resolve(document.content);
				}
			});
		});
	}

	provideDocumentLinks(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.DocumentLink[] | undefined {
		const doc = this._documents.get(document.uri.toString());
		if (doc) {
			return doc.links;
		}
	}
}


