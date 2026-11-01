// Time-limited network unlock.
//
// The user creates .agents/NET_UNLOCK by hand. The file holds the minutes to allow, for example "30".
// An empty file means DEFAULT_MINUTES. The window starts at the file's last-modified time.
// When the time is up, the network locks again by itself. Agents cannot create or touch the file.
'use strict';

const fs = require('fs');
const path = require('path');

const FILE = path.resolve(__dirname, '..', '..', 'NET_UNLOCK');
const DEFAULT_MINUTES = 15;
const MAX_MINUTES = 240;

// `file` and `now` can be passed in for unit tests.
function status(file = FILE, now = Date.now()) {
  if (process.env.GUARD_TEST === '1' && file === FILE) {
    return { open: process.env.GUARD_NET_UNLOCK === 'yes' };
  }

  let stat;
  let text;
  try {
    stat = fs.statSync(file);
    text = fs.readFileSync(file, 'utf8').trim();
  } catch {
    return { open: false };
  }

  let minutes = DEFAULT_MINUTES;
  if (text !== '') {
    const match = /^(\d{1,4})\s*(m|min|mins|minutes)?$/i.exec(text);
    if (!match) return { open: false, invalid: true };
    minutes = Number(match[1]);
  }
  if (minutes < 1) return { open: false };
  minutes = Math.min(minutes, MAX_MINUTES);

  const msLeft = stat.mtimeMs + minutes * 60000 - now;
  if (msLeft <= 0) return { open: false, expired: true };
  return { open: true, minutesLeft: Math.ceil(msLeft / 60000) };
}

const HOW_TO_UNLOCK =
  'The network is locked. Only the user can unlock it, for a limited time, by writing the minutes into .agents/NET_UNLOCK.';

module.exports = { status, HOW_TO_UNLOCK, DEFAULT_MINUTES, MAX_MINUTES };
