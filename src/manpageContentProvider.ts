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

import * as vscode from 'vscode';
import { MAN_COMMAND_REGEX } from './consts';
import ManpageDocument from './manpageDocument';
import child_process = require('child_process');

export class ManpageContentView {
    constructor(context: vscode.ExtensionContext) {

        const provider = new ManpageContentProvider();

        // register content provider
        const providerRegistrations = vscode.Disposable.from(
            vscode.workspace.registerTextDocumentContentProvider(ManpageContentProvider.scheme, provider),
            vscode.languages.registerDocumentLinkProvider({ scheme: ManpageContentProvider.scheme }, provider)
        );

        const openInActiveColumn = !(vscode.workspace.getConfiguration('manpages').get('openAsSplit', true) as boolean);


        const openFromSelection = vscode.commands.registerTextEditorCommand('manpages.openFromSelection', (editor) => {
            if (editor.selection.isEmpty) return;
            let text = editor.document.getText(editor.selection);
            return openManPage(text, openInActiveColumn);
        });

        const openFromCursor = vscode.commands.registerTextEditorCommand('manpages.openFromCursor', (editor) => {
            if (!editor.selection.isEmpty) return;
            const wordRange = editor.document.getWordRangeAtPosition(editor.selection.active, MAN_COMMAND_REGEX);
            if (!wordRange) { return; }
            let text = editor.document.getText(wordRange);
            return openManPage(text, openInActiveColumn);
        });

        const openFromInput = vscode.commands.registerCommand('manpages.openFromInput', async () => {
            const result = await vscode.window.showInputBox({
                value: '',
                placeHolder: 'Entry name',
                validateInput: text => {
                    return !MAN_COMMAND_REGEX.test(text) ? 'Invalid entry!' : null;
                }
            });

            if (result) {
                return openManPage(result, openInActiveColumn);
            }
        });

        context.subscriptions.push(
            providerRegistrations,
            openFromSelection,
            openFromCursor,
            openFromInput);
    }
}

export class ManpageContentProvider implements vscode.TextDocumentContentProvider, vscode.DocumentLinkProvider {

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

    dispose(): void {
        this._subscriptions.dispose();
        this._documents.clear();
        this._editorDecoration.dispose();
        this._onDidChange.dispose();
    }

    // Expose an event to signal changes of _virtual_ documents
    // to the editor
    get onDidChange(): vscode.Event<vscode.Uri> {
        return this._onDidChange.event;
    }

    provideTextDocumentContent(uri: vscode.Uri): string | Thenable<string> {

        // already loaded?
        let document = this._documents.get(uri.toString());
        if (document) {
            return document.content;
        }

        const input = uri.path.substr(1);
        let m = MAN_COMMAND_REGEX.exec(input); // skip leading '/')

        if (!m) {
            return new Promise(() => vscode.window.showErrorMessage('undefined'));
        }

        let word = m[1];
        let section = m[2];

        let cmd = this.buildCmdline(section, word);

        return new Promise((resolve) => {
            child_process.exec(cmd, (err, stdout, stderr) => {
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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    provideDocumentLinks(document: vscode.TextDocument, _token: vscode.CancellationToken): vscode.DocumentLink[] | undefined {
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


export async function openManPage(input: string, inActiveColumn: boolean): Promise<void> {
    if (!input || input.length === 0) {
        return;
    }

    const uri = vscode.Uri.parse('man:///' + input);
    const doc = await vscode.workspace.openTextDocument(uri);
    const textDocument = await vscode.window.showTextDocument(doc, {
        preserveFocus: true,
        preview: true,
        viewColumn: inActiveColumn ? vscode.ViewColumn.Active : vscode.ViewColumn.Beside
    });
    textDocument.options.lineNumbers = 0; // off
}
