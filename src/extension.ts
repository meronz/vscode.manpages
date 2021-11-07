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

import { ExtensionContext } from 'vscode';
import { ManpageContentView } from './manpageContentProvider';
import { SearchResultView } from './searchResultsProvider';

export function activate(context: ExtensionContext): void {
    // tslint:disable-next-line: no-unused-expression
    new ManpageContentView(context);
    // tslint:disable-next-line: no-unused-expression
    new SearchResultView(context);
}

// this method is called when your extension is deactivated
// eslint-disable-next-line @typescript-eslint/no-empty-function
export function deactivate(): void { }
