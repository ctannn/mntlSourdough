import test from 'node:test';
import assert from 'node:assert/strict';
import {isISODate, calgaryToday, addDateDays, addDateMonths, monthCells, occurrences, readableDate} from '../src/lib/scheduling.mjs';
test('ISO-only dates reject impossible dates', () => {
  assert.equal(isISODate('2026-02-29'), false);
  assert.equal(isISODate('2028-02-29'), true);
  assert.equal(isISODate('2026-10-30T00:00:00'), false);
});
test('recurring dates remain on the chosen weekday across Calgary daylight savings', () => {
  assert.deepEqual(occurrences('2026-10-31', 'weekly', 4), ['2026-10-31','2026-11-07','2026-11-14','2026-11-21']);
  assert.deepEqual(occurrences('2026-10-31', 'biweekly', 3), ['2026-10-31','2026-11-14','2026-11-28']);
});
test('date controls handle month and year boundaries', () => {
  assert.equal(addDateDays('2026-12-31', 1),'2027-01-01');
  assert.equal(addDateMonths('2026-12', 1),'2027-01');
  assert.equal(monthCells('2026-11').length,42);
  assert.ok(monthCells('2026-11').includes('2026-11-30'));
});
test('Calgary calendar day does not depend on browser timezone', () => {
  assert.equal(calgaryToday(new Date('2026-10-31T05:00:00Z')), '2026-10-30');
  assert.equal(calgaryToday(new Date('2026-11-01T07:00:00Z')), '2026-11-01');
  assert.equal(calgaryToday(new Date('2026-11-01T06:30:00Z')), '2026-11-01');
  assert.equal(calgaryToday(new Date('2026-12-01T05:45:00Z')), '2026-11-30');
  assert.ok(readableDate('2026-11-07').includes('Nov'));
});
test('recurrences fail closed on invalid dates or frequencies', () => {
  assert.deepEqual(occurrences('2026-02-29','weekly'),[]);
  assert.deepEqual(occurrences('2026-11-07','once'),[]);
});
