// Test fixture: a script that reads a secret file. The guard must block running it.
console.log(require('fs').readFileSync('.env', 'utf8'));
