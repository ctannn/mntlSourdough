import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  normalizeSlug,validCadence as absent,
} from '../src/lib/ovenJournal.mjs';
