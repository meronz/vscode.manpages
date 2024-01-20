// Copyright (C) 2023 Salvatore Merone
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

import {ExtensionContext, window, OutputChannel, Range, Selection, Position} from 'vscode';

const LoggingChannelName = 'Manpages';

export class Logging {
    private static _channel: OutputChannel;

    constructor(context: ExtensionContext) {
        if(!Logging._channel) {
            Logging._channel = window.createOutputChannel(LoggingChannelName);
            context.subscriptions.push(Logging._channel);
        }
    }

    public log(message: string): void {
        Logging._channel.appendLine(message);
    }

    public printRange(range: Range): string {
        return `${this.printPosition(range.start)}-${this.printPosition(range.end)}`;
    }

    public printSelection(selection: Selection): string {
        return `${this.printPosition(selection.start)}-${this.printPosition(selection.end)}`;
    }

    public printPosition(position: Position): string {
        return `${position.line}:${position.character}`;
    }
}