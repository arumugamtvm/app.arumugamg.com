import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TodoWorkspace } from './TodoWorkspace';
import * as todoApi from '../api/todoApi';

vi.mock('../api/todoApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/todoApi')>();
  return {
    ...actual,
    fetchTodos: vi.fn().mockResolvedValue([]),
    fetchTodayTodos: vi.fn().mockResolvedValue([]),
    fetchOverdueTodos: vi.fn().mockResolvedValue([]),
    fetchUpcomingTodos: vi.fn().mockResolvedValue([]),
    fetchSubtasksForTodos: vi.fn().mockResolvedValue([]),
    getJwtToken: vi.fn().mockReturnValue(''),
    decodeJwt: vi.fn().mockReturnValue(null),
    isTokenExpired: vi.fn().mockReturnValue(true),
  };
});

describe('TodoWorkspace', () => {
  it('renders the TodoWorkspace header and quick view tabs', () => {
    render(<TodoWorkspace onBackToDashboard={vi.fn()} sessionKey={1} onTokenChange={vi.fn()} />);

    // Check header
    expect(screen.getByText('Task Workspace')).toBeInTheDocument();

    // Check quick view tabs
    expect(screen.getAllByText('All Tasks')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Today')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Upcoming')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Overdue')[0]).toBeInTheDocument();
  });

  it('calls fetchOverdueTodos on mount', () => {
    render(<TodoWorkspace onBackToDashboard={vi.fn()} sessionKey={1} onTokenChange={vi.fn()} />);
    expect(todoApi.fetchOverdueTodos).toHaveBeenCalled();
  });
});
