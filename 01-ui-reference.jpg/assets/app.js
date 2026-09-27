/* 9bhk.app — shared prototype behaviour: icon sprite, favourites, sheets,
   tabs, steppers, calendars, flows and toasts. Page-specific logic lives in
   each page's own script. */
(function () {
  'use strict';

  var SPRITE = '' +
    '<svg width="0" height="0" aria-hidden="true" focusable="false" style="position:absolute">' +
    '<defs>' +
    '<symbol id="i-home" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11 12 4l8 7"/><path d="M6.2 9.8V19a1 1 0 0 0 1 1H17a1 1 0 0 0 1-1V9.8"/></symbol>' +
    '<symbol id="i-home-v" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 20V9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z"/><path d="M9.5 21v-6h5v6"/></symbol>' +
    '<symbol id="i-pin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.99-5.54 10.19-7.4 11.8a1 1 0 0 1-1.2 0C9.54 20.19 4 14.99 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></symbol>' +
    '<symbol id="i-search" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></symbol>' +
    '<symbol id="i-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h15"/><path d="m13 6 6 6-6 6"/></symbol>' +
    '<symbol id="i-back" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12H5"/><path d="m11 18-6-6 6-6"/></symbol>' +
    '<symbol id="i-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></symbol>' +
    '<symbol id="i-chevr" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></symbol>' +
    '<symbol id="i-x" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></symbol>' +
    '<symbol id="i-plus" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></symbol>' +
    '<symbol id="i-minus" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/></symbol>' +
    '<symbol id="i-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></symbol>' +
    '<symbol id="i-calendar" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v4M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2.5"/><path d="M3 10h18"/></symbol>' +
    '<symbol id="i-users" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13A4 4 0 0 1 16 11"/></symbol>' +
    '<symbol id="i-user" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></symbol>' +
    '<symbol id="i-heart" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></symbol>' +
    '<symbol id="i-heart-fill" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></symbol>' +
    '<symbol id="i-star" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M11.53 2.3a.53.53 0 0 1 .95 0l2.31 4.68a2.12 2.12 0 0 0 1.6 1.16l5.16.76a.53.53 0 0 1 .3.9l-3.74 3.64a2.12 2.12 0 0 0-.61 1.88l.88 5.14a.53.53 0 0 1-.77.56l-4.62-2.43a2.12 2.12 0 0 0-1.97 0L6.4 21.01a.53.53 0 0 1-.77-.56l.88-5.14a2.12 2.12 0 0 0-.61-1.88L2.16 9.8a.53.53 0 0 1 .29-.9l5.17-.76a2.12 2.12 0 0 0 1.6-1.16Z"/></symbol>' +
    '<symbol id="i-award" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m15.48 12.89 1.51 8.53a.5.5 0 0 1-.81.47L12.6 19.2a1 1 0 0 0-1.2 0l-3.58 2.69a.5.5 0 0 1-.81-.47l1.51-8.53"/><circle cx="12" cy="8" r="6"/></symbol>' +
    '<symbol id="i-waves" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/></symbol>' +
    '<symbol id="i-flame" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5Z"/></symbol>' +
    '<symbol id="i-leaf" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></symbol>' +
    '<symbol id="i-paw" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/><path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.04 1 1 0 0 1-.98-.5A3.5 3.5 0 0 1 5.5 10H9Z"/></symbol>' +
    '<symbol id="i-compass" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m15.8 8.2-2 5.6-5.6 2 2-5.6Z"/></symbol>' +
    '<symbol id="i-map" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M14.1 5.55a2 2 0 0 0 1.79 0l3.66-1.83A1 1 0 0 1 21 4.62v12.76a1 1 0 0 1-.55.9l-4.55 2.27a2 2 0 0 1-1.79 0l-4.21-2.1a2 2 0 0 0-1.79 0l-3.66 1.83A1 1 0 0 1 3 19.38V6.62a1 1 0 0 1 .55-.9l4.55-2.27a2 2 0 0 1 1.79 0Z"/><path d="M15 5.76v15M9 3.24v15"/></symbol>' +
    '<symbol id="i-spark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6.3 6.3l2.4 2.4M15.3 15.3l2.4 2.4M17.7 6.3l-2.4 2.4M8.7 15.3l-2.4 2.4"/></symbol>' +
    '<symbol id="i-sliders" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="2.4"/><circle cx="15" cy="17" r="2.4"/></symbol>' +
    '<symbol id="i-bed" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 20V8"/><path d="M3 12h13a4 4 0 0 1 4 4v4"/><path d="M3 20h18"/><path d="M7 12V9h4v3"/></symbol>' +
    '<symbol id="i-bath" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h18v3a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4z"/><path d="M6 12V6.5A2.5 2.5 0 0 1 11 6"/><path d="M8 19v2M16 19v2"/></symbol>' +
    '<symbol id="i-wifi" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5a10 10 0 0 1 14 0"/><path d="M8.5 16a5 5 0 0 1 7 0"/><circle cx="12" cy="19" r="1"/></symbol>' +
    '<symbol id="i-ac" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M4.5 6.5l15 11M19.5 6.5l-15 11"/></symbol>' +
    '<symbol id="i-car" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 16v-4l1.6-4.2A2 2 0 0 1 8.5 6.5h7a2 2 0 0 1 1.9 1.3L19 12v4"/><path d="M3.5 16h17"/><circle cx="7.5" cy="18.5" r="1.6"/><circle cx="16.5" cy="18.5" r="1.6"/></symbol>' +
    '<symbol id="i-grill" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="10" r="6"/><path d="M7.5 7.5h9"/><path d="M12 16v3M8 21h8"/></symbol>' +
    '<symbol id="i-utensils" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3v7a2 2 0 0 0 4 0V3"/><path d="M8 12v9"/><path d="M17 3c-1.7 1-2.5 2.6-2.5 5s.8 3.2 2.5 3.5V21"/></symbol>' +
    '<symbol id="i-bolt" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 4 14h6l-1 8 9-12h-6z"/></symbol>' +
    '<symbol id="i-dice" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1"/><circle cx="15" cy="15" r="1"/><circle cx="12" cy="12" r="1"/></symbol>' +
    '<symbol id="i-music" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V6l10-2v12"/><circle cx="7" cy="18" r="2.5"/><circle cx="17" cy="16" r="2.5"/></symbol>' +
    '<symbol id="i-bell" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6"/><path d="M10 20a2 2 0 0 0 4 0"/></symbol>' +
    '<symbol id="i-wallet" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="13" rx="3"/><path d="M3 10h18"/><circle cx="16.5" cy="14.5" r="1.2"/></symbol>' +
    '<symbol id="i-chart" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></symbol>' +
    '<symbol id="i-shield" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6z"/><path d="m9.5 12 1.8 1.8 3.7-3.8"/></symbol>' +
    '<symbol id="i-eye" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.6"/></symbol>' +
    '<symbol id="i-edit" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4l10-10-4-4L4 16z"/><path d="m14 6 4 4"/></symbol>' +
    '<symbol id="i-trash" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16"/><path d="M9 7V5h6v2"/><path d="M6 7l1 13h10l1-13"/><path d="M10 11v6M14 11v6"/></symbol>' +
    '<symbol id="i-camera" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h3l1.5-2h7L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.2"/></symbol>' +
    '<symbol id="i-upload" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M5 20h14"/></symbol>' +
    '<symbol id="i-drag" viewBox="0 0 24 24" fill="currentColor" stroke="none"><circle cx="9" cy="7" r="1.4"/><circle cx="15" cy="7" r="1.4"/><circle cx="9" cy="12" r="1.4"/><circle cx="15" cy="12" r="1.4"/><circle cx="9" cy="17" r="1.4"/><circle cx="15" cy="17" r="1.4"/></symbol>' +
    '<symbol id="i-clock" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></symbol>' +
    '<symbol id="i-info" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><circle cx="12" cy="8" r=".6"/></symbol>' +
    '<symbol id="i-message" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16v11H9l-5 4z"/></symbol>' +
    '<symbol id="i-phone" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3h4l1.5 5-2.5 1.5a12 12 0 0 0 5.5 5.5L15 12.5 20 14v4a2 2 0 0 1-2 2A15 15 0 0 1 3 5a2 2 0 0 1 2-2z"/></symbol>' +
    '<symbol id="i-share" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.2 10.8 15.8 7.2M8.2 13.2l7.6 3.6"/></symbol>' +
    '<symbol id="i-logout" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3"/><path d="M10 17l-5-5 5-5"/><path d="M5 12h10"/></symbol>' +
    '<symbol id="i-globe" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18Z"/></symbol>' +
    '<symbol id="i-key" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="15" r="4"/><path d="m11 12 8-8 2 2-2 2 2 2-3 3-2-2-2 2"/></symbol>' +
    '<symbol id="i-grid" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/></symbol>' +
    '<symbol id="i-list" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/></symbol>' +
    '<symbol id="i-tag" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h8l8 8-8 8-8-8z"/><circle cx="8.5" cy="8.5" r="1.2"/></symbol>' +
    '<symbol id="i-inbox" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 13h5l1.5 2h5L16 13h5"/><path d="M5 5h14l2 8v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4z"/></symbol>' +
    '<symbol id="i-google" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 12h-8"/></symbol>' +
    '<symbol id="i-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19"/></symbol>' +
    '</defs></svg>';

  var root = document.body;
  if (root) { root.insertAdjacentHTML('afterbegin', SPRITE); }

  function $(sel, scope) { return (scope || document).querySelector(sel); }
  function $$(sel, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(sel)); }

  /* ── toast ───────────────────────────────────────────────────────── */
  var toastEl = null;
  function ensureToast() {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast';
      toastEl.setAttribute('role', 'status');
      toastEl.setAttribute('aria-live', 'polite');
      document.body.appendChild(toastEl);
    }
    return toastEl;
  }
  var toastTimer;
  function toast(message) {
    var el = ensureToast();
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, 2400);
  }
  window.odToast = toast;

  /* ── storage ─────────────────────────────────────────────────────── */
  function read(key, fallback) {
    try { var raw = window.localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
    catch (e) { return fallback; }
  }
  function write(key, value) {
    try { window.localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* unavailable */ }
  }
  window.odRead = read;
  window.odWrite = write;

  /* ── favourites ──────────────────────────────────────────────────── */
  var FAV_KEY = 'fh.favorites';
  var favourites = new Set(read(FAV_KEY, []));
  window.odFavourites = favourites;

  function paint(btn) {
    var id = btn.dataset.prop;
    var on = favourites.has(id);
    btn.classList.toggle('is-fav', on);
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.setAttribute('aria-label', (on ? 'Remove ' : 'Save ') + (btn.dataset.name || 'this farmhouse') + (on ? ' from saved' : ''));
  }
  $$('.fav').forEach(function (btn) {
    paint(btn);
    btn.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      var id = btn.dataset.prop;
      if (favourites.has(id)) { favourites.delete(id); } else { favourites.add(id); }
      paint(btn);
      write(FAV_KEY, Array.from(favourites));
      toast(favourites.has(id) ? 'Saved to your wishlist' : 'Removed from your wishlist');
      document.dispatchEvent(new CustomEvent('favouritechange', { detail: { id: id, on: favourites.has(id) } }));
    });
  });

  /* ── generic toast triggers ──────────────────────────────────────── */
  $$('[data-toast]').forEach(function (el) {
    if (el.dataset.open) { return; }
    el.addEventListener('click', function (event) {
      if (event.target.closest('a[href]')) { return; }
      toast(el.dataset.toast);
    });
  });

  /* ── chips ───────────────────────────────────────────────────────── */
  $$('.chip[data-toggle]').forEach(function (chip) {
    chip.addEventListener('click', function () {
      var on = !chip.classList.contains('is-active');
      chip.classList.toggle('is-active', on);
      chip.setAttribute('aria-pressed', on ? 'true' : 'false');
      document.dispatchEvent(new CustomEvent('chipchange', { detail: { value: chip.dataset.value || chip.dataset.vibe || chip.textContent.trim(), on: on } }));
    });
  });

  /* ── switches + checks ───────────────────────────────────────────── */
  $$('.sw').forEach(function (sw) {
    sw.addEventListener('click', function () {
      var on = sw.getAttribute('aria-checked') !== 'true';
      sw.setAttribute('aria-checked', on ? 'true' : 'false');
    });
  });
  $$('.checkline').forEach(function (row) {
    row.addEventListener('click', function () {
      var on = row.getAttribute('aria-pressed') !== 'true';
      row.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  });

  /* ── steppers ────────────────────────────────────────────────────── */
  $$('[data-stepper]').forEach(function (box) {
    var out = $('.val', box);
    var min = parseInt(box.dataset.min || '0', 10);
    var max = parseInt(box.dataset.max || '99', 10);
    function set(next) {
      next = Math.min(max, Math.max(min, next));
      out.textContent = next;
      box.dispatchEvent(new CustomEvent('stepperchange', { detail: { value: next } }));
    }
    $$('button', box).forEach(function (btn) {
      btn.addEventListener('click', function () {
        set(parseInt(out.textContent, 10) + (btn.dataset.step === '-1' ? -1 : 1));
      });
    });
  });

  /* ── sheets ──────────────────────────────────────────────────────── */
  function sheetOf(id) { return document.getElementById(id); }
  function closeSheets() {
    $$('.sheet.is-open').forEach(function (s) { s.classList.remove('is-open'); });
    $$('.scrim.is-open').forEach(function (s) { s.classList.remove('is-open'); });
    document.body.style.overflow = '';
  }
  function openSheet(id) {
    var sheet = sheetOf(id);
    if (!sheet) { return; }
    closeSheets();
    var scrim = $('.scrim[data-scrim]');
    if (scrim) { scrim.classList.add('is-open'); }
    sheet.classList.add('is-open');
    var first = sheet.querySelector('input, button, a');
    if (first) { first.focus({ preventScroll: true }); }
  }
  $$('[data-sheet-open]').forEach(function (btn) {
    btn.addEventListener('click', function () { openSheet(btn.dataset.sheetOpen); });
  });
  $$('[data-sheet-close]').forEach(function (btn) {
    btn.addEventListener('click', closeSheets);
  });
  $$('.scrim[data-scrim]').forEach(function (scrim) { scrim.addEventListener('click', closeSheets); });
  document.addEventListener('keydown', function (event) { if (event.key === 'Escape') { closeSheets(); } });
  window.odOpenSheet = openSheet;
  window.odCloseSheets = closeSheets;

  /* ── underline tabs / segmented ──────────────────────────────────── */
  $$('[data-tabs-root]').forEach(function (rootEl) {
    var buttons = $$('[data-tab]', rootEl);
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        buttons.forEach(function (b) { b.setAttribute('aria-selected', b === btn ? 'true' : 'false'); });
        $$('[data-panel]', rootEl).forEach(function (panel) {
          panel.hidden = panel.dataset.panel !== btn.dataset.tab;
        });
      });
    });
  });

  /* ── in-page flows ───────────────────────────────────────────────── */
  $$('[data-flow]').forEach(function (flow) {
    function show(id) {
      $$('[data-step-id]', flow).forEach(function (step) {
        step.hidden = step.dataset.stepId !== id;
      });
      flow.dispatchEvent(new CustomEvent('flowchange', { detail: { id: id } }));
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
    $$('[data-goto]', flow).forEach(function (btn) {
      btn.addEventListener('click', function (event) {
        event.preventDefault();
        var target = btn.dataset.goto;
        if (flow.dispatchEvent(new CustomEvent('flowrequest', { detail: { id: target, source: btn }, cancelable: true })) === false) { return; }
        show(target);
      });
    });
    flow.__show = show;
  });
  window.odFlow = function (el) { return el && el.__show; };

  /* ── calendars ───────────────────────────────────────────────────── */
  function wireCalendar(cal) {
    $$('.cal-d', cal).forEach(function (day) {
      if (day.dataset.status === 'off' || day.dataset.status === 'booked' || day.dataset.status === 'blocked') { return; }
      day.addEventListener('click', function () {
        var on = !day.classList.contains('is-on');
        day.classList.toggle('is-on', on);
        day.setAttribute('aria-pressed', on ? 'true' : 'false');
        cal.dispatchEvent(new CustomEvent('calchange', { detail: { iso: day.dataset.iso, day: day, on: on } }));
      });
    });
  }
  $$('[data-cal]').forEach(wireCalendar);
  window.odWireCalendar = wireCalendar;

  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  function iso(y, m, d) { return y + '-' + String(m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0'); }

  window.odRenderCalendar = function (container, opts) {
    opts = opts || {};
    var month = opts.month || '2026-06';
    var parts = month.split('-');
    var y = parseInt(parts[0], 10);
    var m = parseInt(parts[1], 10) - 1;
    var booked = opts.booked || [];
    var blocked = opts.blocked || [];
    var first = new Date(y, m, 1);
    var startDow = (first.getDay() + 6) % 7;
    var days = new Date(y, m + 1, 0).getDate();
    var today = opts.today || 0;
    var html = '<div class="cal-head"><span class="m">' + MONTHS[m] + ' ' + y + '</span></div>';
    html += '<div class="cal-grid">';
    ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].forEach(function (d) { html += '<span class="dow">' + d + '</span>'; });
    for (var i = 0; i < startDow; i++) { html += '<span></span>'; }
    for (var d = 1; d <= days; d++) {
      var key = iso(y, m, d);
      var status = 'available';
      if (blocked.indexOf(key) > -1) { status = 'blocked'; }
      else if (booked.indexOf(key) > -1) { status = 'booked'; }
      else if (today && d < today) { status = 'off'; }
      html += '<button class="cal-d" type="button" data-iso="' + key + '" data-status="' + status + '">' + d + '</button>';
    }
    html += '</div>';
    container.innerHTML = html;
    container.setAttribute('data-cal', '');
    wireCalendar(container);
  };

  /* ── search state ────────────────────────────────────────────────── */
  window.odSearchState = read('fh.search', {});
})();
