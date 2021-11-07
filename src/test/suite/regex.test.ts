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

import * as assert from 'assert';
import { after } from 'mocha';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import { SearchResultView } from '../../searchResultsProvider';
// import * as myExtension from '../extension';

suite('Regex tests', () => {
    after(() => {
        vscode.window.showInformationMessage('All tests done!');
    });

    test('Parse single line', () => {
        let testStr = 'test_name(1section1) - test description .';
        let results = SearchResultView.prototype.parseApropos(testStr);

        assert.strictEqual(1, results.length);
        assert.strictEqual('test_name', results[0].name);
        assert.strictEqual('1section1', results[0].section);
        assert.strictEqual('test description .', results[0].description);
    });

    test('Parse single line with multiple entries', () => {
        let testStr = 'test_name(1section1), test_name2(1section1), test_name3(1section1) - test description .';
        let results = SearchResultView.prototype.parseApropos(testStr);

        assert.strictEqual(3, results.length);
        assert.strictEqual('test_name', results[0].name);
        assert.strictEqual('test_name2', results[1].name);
        assert.strictEqual('test_name3', results[2].name);
        assert.strictEqual('1section1', results[0].section);
        assert.strictEqual('1section1', results[1].section);
        assert.strictEqual('1section1', results[2].section);
        assert.strictEqual('test description .', results[0].description);
        assert.strictEqual('test description .', results[1].description);
        assert.strictEqual('test description .', results[2].description);
    });


    function testWithTerm(term: string) {
        let testStr = 'test_name(1section1) - test description .' + term;
        testStr += 'test_name2(1section1) - test description 2.' + term;
        testStr += term;

        let results = SearchResultView.prototype.parseApropos(testStr);

        assert.strictEqual(2, results.length);
        assert.strictEqual('test_name', results[0].name);
        assert.strictEqual('1section1', results[0].section);
        assert.strictEqual('test description .', results[0].description);
        assert.strictEqual('test_name2', results[1].name);
        assert.strictEqual('1section1', results[1].section);
        assert.strictEqual('test description 2.', results[1].description);
    }
    test('Parse multiple line (\\n terminator)', () => testWithTerm('\n'));
    test('Parse multiple line (\\r\\n terminator)', () => testWithTerm('\r\n'));
});