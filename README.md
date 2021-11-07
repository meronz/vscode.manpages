# Manpages 

[![Deploy Extension](https://github.com/meronz/vscode.manpages/actions/workflows/publish.yml/badge.svg?branch=main)](https://github.com/meronz/vscode.manpages/actions/workflows/publish.yml)

+ Open the man page for the word under cursor or selected.
+ Move quickly by following links inside the man page.
+ Search the manual pages for names and descriptions (apropos).

## Requirements
This extension requires `man` to be installed and working from the integrated terminal.
You may configure the command to execute the man binary with the `man.path` setting 

## Configuration
The extension accepts the following configuration parameters:

setting                 | description                  | default
------------------------|------------------------------|----------
manpages.binary.path    | Path of the man binary       | man
manpages.binary.args    | Arguments passed to man      |
manpages.apropos.path   | Path of the apropos binary   | apropos
manpages.apropos.args   | Arguments passed to apropos  | 

For example, on Windows with WSL you may use the setting `"manpages.binary.path": "wsl man"`.
Moreover, you can pass additional arguments to man, like `"--manpath=/some/path"`, `"--locale=fr"`, etc. The complete list depends on the OS, and you can find it by running `man --help`.