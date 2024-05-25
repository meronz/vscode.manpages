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
import { Logging } from './logging';

export class ManpageContentView {
    constructor(context: vscode.ExtensionContext) {
        const logger = new Logging(context);
        const provider = new ManpageContentProvider(context);

        // register content provider
        const providerRegistrations = vscode.Disposable.from(
            vscode.workspace.registerTextDocumentContentProvider(ManpageContentProvider.scheme, provider),
            vscode.languages.registerDocumentLinkProvider({ scheme: ManpageContentProvider.scheme }, provider)
        );

        const openInActiveColumn = !(vscode.workspace.getConfiguration('manpages').get('openAsSplit', true) as boolean);


        const openFromSelection = vscode.commands.registerTextEditorCommand('manpages.openFromSelection', (editor) => {
            logger.log(`openFromSelection called with selection: ${editor.selection.isEmpty ? 'empty' : 'not empty'}`);
            if (editor.selection.isEmpty) return;
            let text = editor.document.getText(editor.selection);
            logger.log(`openFromSelection selection: ${logger.printSelection(editor.selection)}, text: ${text}`);
            return openManPage(text, openInActiveColumn);
        });

        const openFromCursor = vscode.commands.registerTextEditorCommand('manpages.openFromCursor', (editor) => {
            logger.log(`openFromCursor called with selection: ${editor.selection.isEmpty ? 'empty' : 'not empty'}`);
            if (!editor.selection.isEmpty) return;
            const wordRange = editor.document.getWordRangeAtPosition(editor.selection.active, MAN_COMMAND_REGEX);
            if (!wordRange) { return; }
            let text = editor.document.getText(wordRange);
            logger.log(`openFromCursor wordRange: ${logger.printRange(wordRange)}, text: ${text}`);
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

            logger.log(`openFromInput called with text: ${result}`);
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
    private _logger: Logging;

    constructor(context: vscode.ExtensionContext) {

        // Listen to the `closeTextDocument`-event which means we must
        // clear the corresponding model object - `ReferencesDocument`
        context.subscriptions.push(vscode.workspace.onDidCloseTextDocument(doc => this.onDidCloseTextDocument(doc)));
        this._logger = new Logging(context);
    }

    dispose(): void {
        this._documents.clear();
        this._editorDecoration.dispose();
        this._onDidChange.dispose();
    }

    // Expose an event to signal changes of _virtual_ documents
    // to the editor
    get onDidChange(): vscode.Event<vscode.Uri> {
        return this._onDidChange.event;
    }

    onDidCloseTextDocument(doc: vscode.TextDocument): void {
        this._documents.delete(doc.uri.toString());
        this._onDidChange.fire(doc.uri);
    }


    provideTextDocumentContent(uri: vscode.Uri): string | Thenable<string> {
        // already loaded?
        let document = this._documents.get(uri.toString());
        if (document) {
            return document.content;
        }

        const input = uri.path.slice(1);
        let m = MAN_COMMAND_REGEX.exec(input); // skip leading '/')

        if (!m) {
            return Promise.reject('Invalid input');
        }

        let word = m[1];
        let section = m[2];
        
        let cmd = this.buildCmdline(section, word);
        this._logger.log(`Executing command: ${cmd}`);

        return new Promise((resolve, reject) => {
            child_process.exec(cmd,{encoding: 'utf-8'}, (err, stdout, stderr) => {
                if (err) {
                    reject(stderr.toString());
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

        let cmdList = [path, ...args];

        if (section) { cmdList.push(section); }
        cmdList.push(word);

        const cmd = cmdList.join(' ');
        
        if (process.platform === 'darwin') {
            return `sh -c '${cmd} | col -b; ${'exit "${PIPESTATUS[0]}${pipestatus[1]}"'}'`;
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

    const enableSyntaxHighlighting = (vscode.workspace.getConfiguration('manpages').get('enableSyntaxHighlighting', true) as boolean);
    if(enableSyntaxHighlighting) vscode.languages.setTextDocumentLanguage(doc, 'manpage');
}
