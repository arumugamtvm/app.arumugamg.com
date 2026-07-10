import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotesWorkspace } from './NotesWorkspace';
import * as todoApi from '../api/todoApi';

vi.mock('../api/todoApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/todoApi')>();
  return {
    ...actual,
    fetchNotes: vi.fn().mockResolvedValue([
      { id: 1, title: 'Test Note', content: '## Hello', pinned: 0, created_at: '2023-01-01', updated_at: '2023-01-01' }
    ]),
    createNote: vi.fn(),
    updateNote: vi.fn(),
    deleteNote: vi.fn(),
    togglePinNote: vi.fn(),
  };
});

describe('NotesWorkspace', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sanitizes markdown content to prevent XSS', async () => {
    const maliciousNote = {
      id: 2,
      title: 'XSS Note',
      content: '<img src="x" onerror="alert(\'XSS\')">',
      pinned: 0,
      created_at: '2023-01-01',
      updated_at: '2023-01-01'
    };

    vi.mocked(todoApi.fetchNotes).mockResolvedValueOnce([maliciousNote]);

    render(<NotesWorkspace onBackToDashboard={vi.fn()} />);

    // Wait for the note to load in sidebar and click it
    const sidebarItem = await screen.findByText('XSS Note');
    await userEvent.click(sidebarItem);

    // Click preview mode
    const previewBtn = screen.getByText('Preview');
    await userEvent.click(previewBtn);

    // The dangerous onerror attribute should be stripped by DOMPurify
    const previewContainer = document.querySelector('.markdown-body');
    expect(previewContainer).not.toBeNull();
    expect(previewContainer?.innerHTML).not.toContain('onerror');
    // But it should still render the safe parts of the img tag
    expect(previewContainer?.innerHTML).toContain('<img src="x"');
  });
});
