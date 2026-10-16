/* Funções de datas e jogos, sem dependências. Funcionam também abrindo o HTML. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Amor = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  const BRAZIL_OFFSET = 3 * 60 * 60 * 1000;
  const pad = (value) => String(value).padStart(2, '0');
  function brazilParts(value) {
    const date = new Date(new Date(value).getTime() - BRAZIL_OFFSET);
    return {year: date.getUTCFullYear(), month: date.getUTCMonth(), day: date.getUTCDate(), hour: date.getUTCHours(), minute: date.getUTCMinutes(), second: date.getUTCSeconds()};
  }
  function brazilTime(year, month, day, hour = 0, minute = 0, second = 0) {
    return Date.UTC(year, month, day, hour + 3, minute, second);
  }
  function monthDay(year, month, wanted) {
    const last = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    return Math.min(wanted, last);
  }
  function elapsed(start, now = Date.now()) {
    const total = Math.max(0, Math.floor((now - new Date(start).getTime()) / 1000));
    return {days: Math.floor(total / 86400), hours: Math.floor(total / 3600) % 24, minutes: Math.floor(total / 60) % 60, seconds: total % 60, totalSeconds: total, weeks: Math.floor(total / 604800)};
  }
  function addMonths(start, amount) {
    const part = brazilParts(start);
    const month = part.month + amount;
    const year = part.year + Math.floor(month / 12);
    const normalized = ((month % 12) + 12) % 12;
    return brazilTime(year, normalized, monthDay(year, normalized, part.day), part.hour, part.minute, part.second);
  }
  function completeMonths(start, now = Date.now()) {
    if (now < new Date(start).getTime()) return 0;
    const a = brazilParts(start), b = brazilParts(now);
    let amount = (b.year - a.year) * 12 + b.month - a.month;
    if (addMonths(start, amount) > now) amount -= 1;
    return Math.max(0, amount);
  }
  function nextMonthly(start, now = Date.now()) {
    const amount = completeMonths(start, now) + 1;
    return {timestamp: addMonths(start, amount), number: amount};
  }
  function nextBirthday(month, day, now = Date.now()) {
    let year = brazilParts(now).year;
    if (brazilTime(year, month - 1, day) + 86400000 <= now) year += 1;
    return brazilTime(year, month - 1, day);
  }
  function countdown(target, now = Date.now()) {
    return {...elapsed(now, target), passed: target <= now};
  }
  function calendar(year, month) {
    const firstWeekday = new Date(Date.UTC(year, month, 1)).getUTCDay();
    const totalDays = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    const cells = Array(firstWeekday).fill(null);
    for (let day = 1; day <= totalDays; day += 1) cells.push({day, iso: `${year}-${pad(month + 1)}-${pad(day)}`});
    while (cells.length % 7) cells.push(null);
    return cells;
  }
  function daysSinceDate(iso, now = Date.now()) {
    const [year, month, day] = iso.split('-').map(Number);
    const current = brazilParts(now);
    return Math.max(0, Math.floor((brazilTime(current.year, current.month, current.day) - brazilTime(year, month - 1, day)) / 86400000));
  }
  function shuffle(values, random = Math.random) {
    const items = [...values];
    for (let index = items.length - 1; index > 0; index -= 1) {
      const other = Math.floor(random() * (index + 1));
      [items[index], items[other]] = [items[other], items[index]];
    }
    return items;
  }
  function memoryDeck(photos, pairs = 6, random = Math.random) {
    const chosen = photos.slice(0, pairs);
    return shuffle(chosen.flatMap((photo) => [0, 1].map((copy) => ({key: `${photo.id}-${copy}`, pair: photo.id, photo}))), random);
  }
  function correctOrder(ids, events) {
    return ids.length === events.length && ids.every((id, index) => id === events[index].id);
  }
  function encodeBits(message) {
    return [...new TextEncoder().encode(message)].map((code) => code.toString(2).padStart(8, '0')).join(' ');
  }
  function decodeBits(bits) {
    return new TextDecoder().decode(Uint8Array.from(bits.trim().split(/\s+/).map((byte) => parseInt(byte, 2))));
  }
  return {pad, brazilParts, brazilTime, elapsed, addMonths, completeMonths, nextMonthly, nextBirthday, countdown, calendar, daysSinceDate, shuffle, memoryDeck, correctOrder, encodeBits, decodeBits};
});
