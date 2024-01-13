# Change Log


## 0.2.0
- Added syntax highlighting for man pages! (MishaKlopukh, whi-tw)

## 0.1.5
- Made the shortcut position in the editor context menu configurable by setting `manpages.editorMenuShortcutPosition`.
- Better naming of the shortcut names, since it was not clear to some users how the selection works.
- Made labels on the search input value clearer.
- Added keybindings contributions to quick open word from selection/cursor, and search (apropos).

## 0.1.4
- Open manpages in a split editor. This is enabled by default but the old behaviour can
  be restored by setting `manpages.openAsSplit` to `false`

## 0.1.3
- Fix broken links and allow for "./-" when opening manpages (FrederikRogalski)

## 0.1.1
- Fixed hyphenated pages not opening

## 0.1.0

- Added logo
- Implemented search functionalty (apropos)
- Code fixes and cleanup

## 0.0.3

- Updated dependencies.
- Fixed manpage mangled output on MacOS (thanks @nicolasff).
- Fixed manpage not correctly openinng when - or . where present in the name.
- Implemented opening manpage under the cursor.
- Added configuration parameters for the man binary path and arguments.

## 0.0.1

- Initial release
