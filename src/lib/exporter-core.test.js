import test, { describe, it } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Simulate browser environment for the library
const mockGlobal = {};
const code = readFileSync(resolve('src/lib/exporter-core.js'), 'utf8');

// We need to mock some globals that the script might expect to exist even if it doesn't use them immediately in deriveConversationTitle
// The script defines a function and calls it with globalThis
new Function('globalThis', 'Node', 'Element', code)(mockGlobal, class {}, class {});

const { deriveConversationTitle } = mockGlobal.ChatGPTMarkdownExporter;

describe('deriveConversationTitle', () => {
  it('should return default title if documentRoot.title is missing', () => {
    assert.strictEqual(deriveConversationTitle({}), 'ChatGPT Thread');
  });

  it('should return trimmed title', () => {
    assert.strictEqual(deriveConversationTitle({ title: '  My Conversation  ' }), 'My Conversation');
  });

  it('should remove "- ChatGPT" suffix case-insensitively', () => {
    assert.strictEqual(deriveConversationTitle({ title: 'My Topic - ChatGPT' }), 'My Topic');
    assert.strictEqual(deriveConversationTitle({ title: 'My Topic - chatgpt' }), 'My Topic');
  });

  it('should remove "- Comet" suffix case-insensitively', () => {
    assert.strictEqual(deriveConversationTitle({ title: 'My Topic - Comet' }), 'My Topic');
    assert.strictEqual(deriveConversationTitle({ title: 'My Topic - comet' }), 'My Topic');
  });

  it('should handle titles without the specific suffixes', () => {
    assert.strictEqual(deriveConversationTitle({ title: 'My Topic - Other' }), 'My Topic - Other');
  });

  it('should return default title if title becomes empty after stripping', () => {
    // If title is " - ChatGPT", it strips to empty and returns default
    assert.strictEqual(deriveConversationTitle({ title: ' - ChatGPT' }), 'ChatGPT Thread');
  });

  it('should handle complex titles with multiple hyphens', () => {
    assert.strictEqual(deriveConversationTitle({ title: 'Real-time - News - ChatGPT' }), 'Real-time - News');
  });

  it('should handle titles with no space before hyphen', () => {
    assert.strictEqual(deriveConversationTitle({ title: 'My Topic-ChatGPT' }), 'My Topic');
  });

  it('should handle titles with trailing spaces after suffix', () => {
    assert.strictEqual(deriveConversationTitle({ title: 'My Topic - ChatGPT  ' }), 'My Topic');
  });
});
