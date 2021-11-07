import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { MAN_APROPOS_REGEX } from './consts';
import { log } from 'console';

export class SearchResultsProvider implements vscode.TreeDataProvider<SearchResult> {

    private _onDidChangeTreeData: vscode.EventEmitter<SearchResult | undefined | void> = new vscode.EventEmitter<SearchResult | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<SearchResult | undefined | void> = this._onDidChangeTreeData.event;

    constructor(private searchTerm: string | undefined) {
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: SearchResult): vscode.TreeItem {
        return element;
    }

    getChildren(_element?: SearchResult): Thenable<SearchResult[]> {
        if (!this.searchTerm || this.searchTerm.length == 0) {
            return Promise.resolve([]);
        }

        let cmd = `man --apropos -a -l ${this.searchTerm}`;
        return new Promise((resolve, reject) => {
            const cp = require('child_process');
            cp.exec(cmd, (err: string, stdout: string, stderr: string) => {
                if (err) {
                    vscode.window.showErrorMessage(stderr);
                    reject(stderr);
                } else {
                    let entries = this.parseApropos(stdout);
                    resolve(entries);
                }
            });
        });
    }

    setSearchTerm(searchTerm: string | undefined) {
        this.searchTerm = searchTerm;
    }

    parseApropos(stdout: string): SearchResult[] {
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



export class SearchResult extends vscode.TreeItem {
    constructor(name: string, section: string, description: string) {
        super(`${name}(${section})`, vscode.TreeItemCollapsibleState.None);
        this.tooltip = description;
        this.description = description;
        this.command = {
            command: 'openSearchResult',
            title: '',
            arguments: [`${name}(${section})`]
        }
    }

    //iconPath = {
    //	light: path.join(__filename, '..', '..', 'resources', 'light', 'searchResult.svg'),	
    //	dark: path.join(__filename, '..', '..', 'resources', 'dark', 'searchResult.svg')
    //};

    contextValue = 'dependency';
}
