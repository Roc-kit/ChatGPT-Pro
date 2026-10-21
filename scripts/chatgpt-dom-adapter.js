/** Stable, semantic accessors for ChatGPT's evolving conversation DOM. */

(function () {
  'use strict';

  const SEARCH_UNIT_SELECTOR = [
    '[data-chatgpt-search-unit-key$=":user"]',
    '[data-chatgpt-search-unit-key$=":assistant"]'
  ].join(',');

  const CONTENT_UNIT_SELECTOR = [
    '[data-content-search-unit-key$=":user"]',
    '[data-content-search-unit-key$=":assistant"]'
  ].join(',');

  const UNIT_SELECTOR = `${SEARCH_UNIT_SELECTOR},${CONTENT_UNIT_SELECTOR}`;

  const MESSAGE_SELECTOR = [
    UNIT_SELECTOR,
    '[data-chatgpt-selection-message-id]',
    '[data-message-author-role][data-message-id]',
    '[data-turn-key]',
    'section[data-turn-id]'
  ].join(',');

  function conversationRoot() {
    return document.querySelector('main') || document;
  }

  function canonicalMessageElement(element) {
    if (!(element instanceof Element)) return null;
    return element.closest(SEARCH_UNIT_SELECTOR)
      || element.closest(CONTENT_UNIT_SELECTOR)
      || element.closest('[data-turn-key]')
      || element.closest('section[data-turn-id]')
      || element;
  }

  function attributeValues(element, name) {
    const values = [];
    const own = element.getAttribute(name);
    if (own) values.push(own);
    element.querySelectorAll(`[${name}]`).forEach(child => {
      const value = child.getAttribute(name);
      if (value) values.push(value);
    });
    return values;
  }

  function messageIds(element) {
    if (!(element instanceof Element)) return [];
    const ids = new Set();
    for (const name of ['data-chatgpt-selection-message-id', 'data-message-id']) {
      for (const value of attributeValues(element, name)) ids.add(value.trim());
    }
    for (const value of attributeValues(element, 'data-chatgpt-search-message-ids')) {
      value.split(/\s+/).filter(Boolean).forEach(id => ids.add(id));
    }
    const turnId = element.getAttribute('data-turn-id');
    if (turnId) ids.add(turnId.trim());
    return [...ids].filter(Boolean);
  }

  function messageRole(element) {
    if (!(element instanceof Element)) return '';
    const explicit = element.getAttribute('data-message-author-role')
      || element.querySelector('[data-message-author-role]')?.getAttribute('data-message-author-role');
    if (explicit === 'user' || explicit === 'assistant') return explicit;

    const keyed = [element, element.closest(UNIT_SELECTOR), element.querySelector(UNIT_SELECTOR)].filter(Boolean);
    for (const candidate of keyed) {
      for (const name of ['data-chatgpt-search-unit-key', 'data-content-search-unit-key']) {
        const match = candidate.getAttribute(name)?.match(/:(user|assistant)$/);
        if (match) return match[1];
      }
    }
    return '';
  }

  function messageElements() {
    const root = conversationRoot();
    const searchUnits = root.querySelectorAll(SEARCH_UNIT_SELECTOR);
    const contentUnits = searchUnits.length ? [] : root.querySelectorAll(CONTENT_UNIT_SELECTOR);
    const candidates = searchUnits.length
      ? searchUnits
      : (contentUnits.length
          ? contentUnits
          : root.querySelectorAll('[data-chatgpt-selection-message-id], [data-message-author-role][data-message-id], [data-turn-key], section[data-turn-id]'));
    const seenNodes = new Set();
    const seenIds = new Set();
    const result = [];
    candidates.forEach(candidate => {
      const element = canonicalMessageElement(candidate);
      if (!element || seenNodes.has(element)) return;
      const ids = messageIds(element);
      if (ids.length && ids.some(id => seenIds.has(id))) return;
      seenNodes.add(element);
      ids.forEach(id => seenIds.add(id));
      result.push(element);
    });
    return result;
  }

  function timestampTarget(element) {
    if (!(element instanceof Element)) return null;
    return element.matches('[data-chatgpt-selection-message-id], [data-message-id]')
      ? element
      : element.querySelector('[data-chatgpt-selection-message-id], [data-message-id]') || element;
  }

  function containsMessageNode(node) {
    if (!(node instanceof Element)) return false;
    return node.matches(MESSAGE_SELECTOR) || Boolean(node.querySelector(MESSAGE_SELECTOR));
  }

  function findMessage(messageId) {
    if (!messageId) return null;
    return messageElements().find(element => messageIds(element).includes(messageId)) || null;
  }

  window.ChatGPTDomAdapter = Object.freeze({
    MESSAGE_SELECTOR,
    conversationRoot,
    messageElements,
    messageIds,
    messageRole,
    timestampTarget,
    containsMessageNode,
    findMessage
  });
})();
