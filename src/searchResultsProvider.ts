import * as vscode from 'vscode';
import { MAN_APROPOS_REGEX, MAN_COMMAND_REGEX } from './consts';
import { log } from 'console';
import { commands, window } from 'vscode';
import { openManPage } from './manpageContentProvider';
import { platform } from 'os';

export class SearchResultView {
    provider: SearchResultsProvider;
    treeView: vscode.TreeView<SearchResult>;

    constructor(context: vscode.ExtensionContext) {
        this.provider = new SearchResultsProvider();
        this.treeView = window.createTreeView('searchResults', {
            treeDataProvider: this.provider,
        });

        let openSearchResult = commands.registerCommand('openSearchResult', async (item: string) => {
            return openManPage(item ?? "");
        });

        let searchFromInput = commands.registerCommand('searchFromInput', async () => {
            const searchInput = await window.showInputBox({
                value: '',
                placeHolder: 'Search value',
                validateInput: text => {
                    return !MAN_COMMAND_REGEX.test(text) ? 'Invalid search value!' : null;
                }
            });

            if (searchInput) {
                this.search(searchInput);
            }
        });

        context.subscriptions.push(
            this.treeView,
            openSearchResult,
            searchFromInput
        );
    }

    search(searchInput: string) {
        let cmd = this.buildCmdline(searchInput);

        const cp = require('child_process');
        cp.exec(cmd, async (err: string, stdout: string, stderr: string) => {
            if (err) {
                vscode.window.showErrorMessage(stderr);
            } else {
                this.provider.results = this.parseApropos(stdout);
                if (this.provider.results.length > 0) {
                    this.provider.refresh();
                    vscode.commands.executeCommand('setContext', 'manpages:hasResults', true);
                    vscode.commands.executeCommand('workbench.view.extension.searchResults');
                }
            }
        });
    }

    private buildCmdline(searchInput: string): string {
        const path = vscode.workspace.getConfiguration('manpages.apropos').get('path') as string;
        const args = vscode.workspace.getConfiguration('manpages.apropos').get('args') as string[];

        let cmd = '';
        cmd += path + ' ';
        cmd += args.join(' ') + ' ';
        if (process.platform !== 'darwin') {
            cmd += '-a -l '
        }
        cmd += searchInput;

        return cmd;
    }

    private parseApropos(stdout: string): SearchResult[] {
        let results: SearchResult[] = [];

        stdout.split(/\r?\n/).forEach(line => {
            if (!line || line.length == 0) {
                return;
            }

            let m = MAN_APROPOS_REGEX.exec(line);
            if (!m || m.length != 4) {
                log(`Could not match line "${line}".`);
                return null;
            }

            let name = m[1];
            let section = m[2];
            let description = m[3];

            results.push(new SearchResult(name, section, description));
        });

        return results;
    }
}

export class SearchResultsProvider implements vscode.TreeDataProvider<SearchResult> {

    private _onDidChangeTreeData: vscode.EventEmitter<SearchResult | undefined | void> = new vscode.EventEmitter<SearchResult | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<SearchResult | undefined | void> = this._onDidChangeTreeData.event;
    public results: SearchResult[] = [];

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: SearchResult): vscode.TreeItem {
        return element;
    }

    getChildren(_element?: SearchResult): Thenable<SearchResult[]> {
        return Promise.resolve(this.results);
    }
}

export class SearchResult extends vscode.TreeItem {
    constructor(name: string, section: string, description: string) {
        super(`${name} (${section})`, vscode.TreeItemCollapsibleState.None);
        this.tooltip = description;
        this.description = description;
        this.command = {
            command: 'openSearchResult',
            title: '',
            arguments: [`${name}(${section})`]
        }
    }
}
