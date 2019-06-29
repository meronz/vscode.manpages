import { workspace, languages, window, commands, ExtensionContext, Disposable, Uri } from 'vscode';

import ManpageContentProvider from './provider';

export function activate(context: ExtensionContext) {

	const provider = new ManpageContentProvider();

	// register content provider
	const providerRegistrations = Disposable.from(
		workspace.registerTextDocumentContentProvider(ManpageContentProvider.scheme, provider),
		languages.registerDocumentLinkProvider({ scheme: ManpageContentProvider.scheme }, provider)
	);

	let openFromSelection = commands.registerTextEditorCommand('manpages.openFromSelection', editor => {
		let text = editor.document.getText(editor.selection);
		let column = (editor.viewColumn!) + 1; // show to the side
		return openManPage(text, column);
	});

	let openFromInput = commands.registerCommand('manpages.openFromInput', (text: string) => {
		return openManPage(text, 0);
	});

	context.subscriptions.push(
		providerRegistrations, openFromSelection, openFromInput);
}

export async function openManPage(input: string, column: number) {
	const uri = Uri.parse('man:///' + input);
	const doc = await workspace.openTextDocument(uri);
	let textDocument = await window.showTextDocument(doc, column);
	textDocument.options.lineNumbers = 0; // off
}

// this method is called when your extension is deactivated
export function deactivate() { }
