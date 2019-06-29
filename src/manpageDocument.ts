// Copyright (C) 2019 Salvatore Merone
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

import { DocumentLink, Range, Uri } from 'vscode';

export default class ManpageDocument {
  private _content: string;
  private _links: DocumentLink[];

  constructor(content: string) {
    this._content = content;
    this._links = [];

    this.extractLinks(content);
  }

  private extractLinks(content: string) {
    const re = /([a-zA-Z_]+)\(([\d])\)/gi;
    const lines = content.split('\n');

    for (var lineIndex = 0; lineIndex <= lines.length; lineIndex++) {
      let m;
      while ((m = re.exec(lines[lineIndex])) !== null) {
        // This is necessary to avoid infinite loops with zero-width matches
        if (m.index === re.lastIndex) {
          re.lastIndex++;
        }

        if (m.length > 0 && m[0].length > 0) {
          const linkRange = new Range(lineIndex, m.index, lineIndex, re.lastIndex);
          const linkTarget = Uri.parse('man:///' + m[0]);
          this._links.push(new DocumentLink(linkRange, linkTarget));
        }
      }
    }
  }

  get content() {
    return this._content;
  }

  get links() {
    return this._links;
  }
}
