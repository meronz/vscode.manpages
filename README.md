# manpages 

Open the man page for the word under cursor or selected. Move quickly by following links inside the man page.

## Requirements

This extension requires `man` to be installed and working from the integrated terminal.  
You may configure the command to execute the man binary with the `man.path` setting (for example on Windows with WSL installed you may use the setting `"manpages.binary.path": "wsl man"`) and/or use `"manpages.binary.arg"` setting to pass additional options (execute `man --help` in the terminal to see those) like additional paths to search (`"--manpath=/some/path"`) or locales to use (`"--locale=fr"`).
