// Test fixture: a script that deletes a file. The guard must block running it.
require('fs').unlinkSync('notes.md');
