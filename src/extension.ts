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

import { workspace, languages, window, commands, ExtensionContext, Disposable, Uri } from 'vscode';
import { MAN_COMMAND_REGEX } from './consts';

import ManpageContentProvider from './provider';

export function activate(context: ExtensionContext) {

	const provider = new ManpageContentProvider();

	// register content provider
	const providerRegistrations = Disposable.from(
		workspace.registerTextDocumentContentProvider(ManpageContentProvider.scheme, provider),
		languages.registerDocumentLinkProvider({ scheme: ManpageContentProvider.scheme }, provider)
	);

	let openFromSelection = commands.registerTextEditorCommand('openFromSelection', editor => {
		let text;
		if (editor.selection.isEmpty) {
			const wordRange = editor.document.getWordRangeAtPosition(editor.selection.active, MAN_COMMAND_REGEX);
			if (!wordRange) { return; }
			text = editor.document.getText(wordRange);
		} else {
			text = editor.document.getText(editor.selection);
		}

		let column = (editor.viewColumn!) + 1; // show to the side
		return openManPage(text, column);
	});

	let openFromInput = commands.registerCommand('openFromInput', async (editor) => {
		const result = await window.showInputBox({
			value: '',
			placeHolder: 'Entry name',
			validateInput: text => {
				return !MAN_COMMAND_REGEX.test(text) ? 'Invalid entry!' : null;
			}
		});

		if (result) {
			let column = (window.activeTextEditor?.viewColumn ?? -1) + 1; // show to the side
			return openManPage(result, column);
		}
	});

	context.subscriptions.push(
		providerRegistrations, openFromSelection, openFromInput);
}

export async function openManPage(input: string, column: number) {
	if (!input || input.length == 0) {
		return;
	}

	const uri = Uri.parse('man:///' + input);
	const doc = await workspace.openTextDocument(uri);
	let textDocument = await window.showTextDocument(doc, column);
	textDocument.options.lineNumbers = 0; // off
}

// this method is called when your extension is deactivated
export function deactivate() { }
