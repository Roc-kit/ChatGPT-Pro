/** Context budget: active-branch-only estimation and DevSpace tool payloads. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'scripts/context-budget.js'), 'utf8');
const context = {};
vm.createContext(context);
vm.runInContext(source, context);
const budget = context.ChatGPTProContextBudget;
assert(budget.estimateTextTokens('Hello world') >= 2 && budget.estimateTextTokens('Hello world') <= 4,
  'ordinary English text is not counted as one token per word and space');
const msg = (id, role, content, recipient) => ({ id, author: { role }, content,
  ...(recipient ? { recipient } : {}) });
const data = {
  id: 'current-conversation', current_node: 'reply', mapping: {
    root: { parent: null, message: null },
    user: { parent: 'root', message: msg('user', 'user', { content_type: 'text', parts: ['中文测试 hello'] }) },
    call: { parent: 'user', message: msg('call', 'assistant', {
      content_type: 'text', parts: ['{"path":"mcp__DevSpaceGO__exec_command","args":{"cmd":"git status"}}']
    }, 'mcp__DevSpaceGO__exec_command') },
    result: { parent: 'call', message: msg('result', 'tool', {
      content_type: 'text', parts: ['hello from DevSpace\n' + 'build output '.repeat(500)]
    }) },
    reply: { parent: 'result', message: msg('reply', 'assistant', { parts: ['Tests passed'] }) },
    unused: { parent: 'user', message: msg('unused', 'assistant', {
      parts: ['bad branch '.repeat(10000)]
    }) }
  }
};

const stats = budget.estimateConversation(data);
assert.equal(stats.messageCount, 4, 'only the current_node ancestry counts');
assert(stats.tokens > 1000 && stats.tokens < 10000, 'tool output is counted but unused branch is not');
assert.equal(stats.incomplete, false);
assert.equal(budget.percent(stats.tokens, 100000), Math.round(stats.tokens / 1000));
assert.equal(budget.normalizeBudget('200000'), 200000);
assert.equal(budget.normalizeBudget('banana'), 100000);
assert.equal(budget.normalizeBudget(-1), 100000);
assert.equal(budget.percent(125000, 100000), 125, 'over-budget values are not clamped');

const missing = { ...data, current_node: 'not-found' };
assert.equal(budget.estimateConversation(missing), null, 'invalid branches are not guessed');
const cycle = structuredClone(data);
cycle.mapping.root.parent = 'reply';
assert.equal(budget.estimateConversation(cycle), null, 'cycles fail closed');
const multimodal = structuredClone(data);
multimodal.mapping.user.message.content.parts.push({ content_type: 'image_asset_pointer', asset_pointer: 'file-service://id' });
assert.equal(budget.estimateConversation(multimodal).incomplete, true);

const nested = budget.estimateConversation({
  current_node: 'tool', mapping: { root: { parent: null }, tool: { parent: 'root', message: msg('tool', 'tool', {
    content_type: 'json', payload: { result: { output: 'Hello world '.repeat(50) },
      metadata: { status: 'ok' }, asset_pointer: 'file://skip-me' }
  }) } }
});
assert(nested.tokens > 50, 'nested tool result payloads are not omitted');

const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
const scripts = manifest.content_scripts[0].js;
assert(scripts.includes('scripts/context-budget.js'));
assert(scripts.indexOf('scripts/context-budget.js') < scripts.indexOf('scripts/content-chatgpt.js'));
const content = fs.readFileSync(path.join(root, 'scripts/content-chatgpt.js'), 'utf8');
assert(content.includes('actions.insertBefore(button, autoButton || actions.firstChild)'),
  'ring button is before the existing auto-continue action');
assert(content.includes('window.ChatGPTProContextBudget.estimateConversation(data)'));
console.log('CONTEXT_BUDGET_PASS: active branch, DevSpace tool text, malformed branches, estimate, budget, UI wiring');
