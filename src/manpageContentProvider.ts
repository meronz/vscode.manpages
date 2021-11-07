// Copyright (C) 2021 Salvatore Merone
// 
// This file is part of vscode.manpages.
// 
// vscode.manpages is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
// 
// vscode.manpages is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
// 
// You should have received a copy of the GNU General Public License
// along with vscode.manpages.  If not, see <http://www.gnu.org/licenses/>.

import { userInfo } from 'os';
import * as vscode from 'vscode';
import { MAN_COMMAND_SECTION_REGEX } from './consts';
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

		const input = uri.path.substr(1);
		let m = MAN_COMMAND_SECTION_REGEX.exec(input); // skip leading '/')

		if (!m) {
			return new Promise(() => vscode.window.showErrorMessage('undefined'));
		}

		let sectionMatch = m[2]?.match(/\d/);
		let word = m[1];
		let section = !sectionMatch ? null : sectionMatch[0];

		const cmd = this.buildCmdline(section, word);

		return new Promise((resolve, reject) => {
			const cp = require('child_process');
			cp.exec(cmd, (err: string, stdout: string, stderr: string) => {
				if (err) {
					vscode.window.showErrorMessage(stderr);
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

	buildCmdline(section: string | null, word: string): string {
		const path = vscode.workspace.getConfiguration('manpages.binary').get('path') as string;
		const args = vscode.workspace.getConfiguration('manpages.binary').get('args') as string[];

		let cmd = '';

		cmd += path + ' ';
		cmd += args.join(' ') + ' ';
		if (section) { cmd += section + ' '; }
		cmd += word + ' ';

		if (process.platform === 'darwin') {
			cmd = `sh -c '${cmd} | col -b; ${'exit "${PIPESTATUS[0]}${pipestatus[1]}"'}'`;
		}

		return cmd;
	}
}


export async function openManPage(input: string) {
	if (!input || input.length == 0) {
		return;
	}

	const uri = vscode.Uri.parse('man:///' + input);
	const doc = await vscode.workspace.openTextDocument(uri);
	let textDocument = await vscode.window.showTextDocument(doc);
	textDocument.options.lineNumbers = 0; // off
}
