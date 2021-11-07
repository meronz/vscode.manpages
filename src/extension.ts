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

import { workspace, languages, window, commands, ExtensionContext, Disposable } from 'vscode';
import { MAN_COMMAND_REGEX } from './consts';

import ManpageContentProvider, { openManPage } from './manpageContentProvider';
import { SearchResultView } from './searchResultsProvider';

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

		return openManPage(text);
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
			return openManPage(result);
		}
	});

	new SearchResultView(context);

	context.subscriptions.push(
		providerRegistrations,
		openFromSelection,
		openFromInput);
}

// this method is called when your extension is deactivated
export function deactivate() { }
