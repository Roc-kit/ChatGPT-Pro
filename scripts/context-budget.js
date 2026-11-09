/** Current-branch text budget estimate. Never represents server-side context usage. */
globalThis.ChatGPTProContextBudget = (() => {
  'use strict';

  const DEFAULT_BUDGET = 256000;
  const MIN_BUDGET = 10000;
  const MAX_BUDGET = 2000000;

  function normalizeBudget(value) {
    const number = Number(value);
    return Number.isFinite(number) && number >= MIN_BUDGET && number <= MAX_BUDGET
      ? Math.round(number) : DEFAULT_BUDGET;
  }

  // Dependency-free approximation. Code and multilingual texts vary by model.
  function estimateTextTokens(value) {
    const text = String(value || '');
    let total = 0;
    let asciiRun = 0;
    const flush = () => {
      if (asciiRun) total += Math.ceil(asciiRun / 4);
      asciiRun = 0;
    };
    for (let index = 0; index < text.length; index++) {
      const point = text.codePointAt(index);
      if (point > 0xffff) index++;
      if ((point >= 65 && point <= 90) || (point >= 97 && point <= 122)
          || (point >= 48 && point <= 57) || point === 32) {
        // Ordinary spaces often merge with the next word in BPE tokenizers.
        asciiRun++;
      } else {
        flush();
        if (point === 10 || point === 9 || point === 13) total += 0.5;
        else if (point >= 33 && point <= 126) total += 0.8;
        else total += point > 0xffff ? 2 : 1;
      }
    }
    flush();
    return Math.ceil(total);
  }

  // Tool content may be nested. Ignore identifiers and non-text asset pointers.
  const SKIP_FIELDS = new Set([
    'content_type', 'type', 'mime_type', 'asset_pointer', 'url', 'download_url',
    'file_id', 'file_name', 'filename', 'id', 'width', 'height', 'duration',
    'thumbnail', 'metadata', 'format', 'name', 'status', 'checksum'
  ]);
  function contentTokens(content, depth = 0) {
    if (depth > 12 || content == null) return { tokens: 0, incomplete: false };
    if (typeof content === 'string') return { tokens: estimateTextTokens(content), incomplete: false };
    if (Array.isArray(content)) {
      return content.reduce((result, part) => {
        const next = contentTokens(part, depth + 1);
        result.tokens += next.tokens;
        result.incomplete ||= next.incomplete;
        return result;
      }, { tokens: 0, incomplete: false });
    }
    if (typeof content !== 'object') return { tokens: 0, incomplete: false };
    const type = String(content.content_type || content.type || '');
    if (/image|audio|video|file_asset_pointer|asset_pointer/.test(type)) {
      return { tokens: 0, incomplete: true };
    }
    if (Array.isArray(content.parts)) return contentTokens(content.parts, depth + 1);
    if (typeof content.text === 'string') return contentTokens(content.text, depth + 1);
    if (typeof content.content === 'string') return contentTokens(content.content, depth + 1);
    const result = { tokens: 0, incomplete: false };
    for (const [key, value] of Object.entries(content)) {
      if (SKIP_FIELDS.has(key)) continue;
      const next = contentTokens(value, depth + 1);
      result.tokens += next.tokens;
      result.incomplete ||= next.incomplete;
    }
    return result;
  }

  function activeBranch(data) {
    const mapping = data?.mapping;
    let nodeId = data?.current_node;
    if (!mapping || typeof mapping !== 'object' || !nodeId || !Object.hasOwn(mapping, nodeId)) return null;
    const messages = [];
    const seen = new Set();
    while (nodeId) {
      if (seen.has(nodeId)) return null;
      seen.add(nodeId);
      const node = mapping[nodeId];
      if (!node || !Object.hasOwn(node, 'parent')) return null;
      if (node.message) messages.push(node.message);
      nodeId = node.parent || null;
      if (nodeId && !Object.hasOwn(mapping, nodeId)) return null;
    }
    return messages.reverse();
  }

  function estimateConversation(data) {
    const messages = activeBranch(data);
    if (!messages) return null;
    let tokens = 0;
    let incomplete = false;
    for (const message of messages) {
      const result = contentTokens(message.content);
      tokens += result.tokens + 4;
      incomplete ||= result.incomplete || Boolean(message.metadata?.attachments?.length);
      const recipient = typeof message.recipient === 'string' ? message.recipient : '';
      if (recipient && recipient !== 'all') tokens += estimateTextTokens(recipient);
    }
    return { tokens, incomplete, messageCount: messages.length };
  }

  function percent(tokens, budget) {
    return Math.max(0, Math.round(tokens / normalizeBudget(budget) * 100));
  }

  return { DEFAULT_BUDGET, MIN_BUDGET, MAX_BUDGET,
    normalizeBudget, estimateTextTokens, activeBranch, estimateConversation, percent };
})();
