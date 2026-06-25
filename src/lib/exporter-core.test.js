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

const { deriveConversationTitle, protectMarkdown } = mockGlobal.ChatGPTMarkdownExporter;

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

describe('protectMarkdown', () => {
  const cases = [
    { input: 'hello', expected: 'hello', name: 'basic string' },
    { input: '', expected: '', name: 'empty string' },
    { input: null, expected: '', name: 'null input' },
    { input: undefined, expected: '', name: 'undefined input' },
    { input: '\\', expected: '\\\\', name: 'backslash' },
    { input: '`', expected: '\\`', name: 'backtick' },
    { input: '*', expected: '\\*', name: 'asterisk' },
    { input: '_', expected: '\\_', name: 'underscore' },
    { input: '#', expected: '\\#', name: 'hash' },
    { input: '[', expected: '\\[', name: 'left bracket' },
    { input: ']', expected: '\\]', name: 'right bracket' },
    { input: 'hello *world*', expected: 'hello \\*world\\*', name: 'string with asterisks' },
    { input: '[link](url)', expected: '\\[link\\](url)', name: 'string with brackets' },
    { input: '# Header', expected: '\\# Header', name: 'string with hash' },
    { input: 'back\\slash', expected: 'back\\\\slash', name: 'embedded backslash' },
    { input: 'already \\*escaped\\*', expected: 'already \\\\\\*escaped\\\\\\*', name: 'already escaped characters' }
  ];

  for (const { input, expected, name } of cases) {
    it(name, () => {
      assert.strictEqual(protectMarkdown(input), expected);
    });
  }
});
