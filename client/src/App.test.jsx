import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach } from 'vitest';
import App from './App';

describe('App', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/');
  });

  it('renders the landing page and opens the join screen from the primary action', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /work together/i })).toBeInTheDocument();
    expect(screen.getByRole('table', { name: /week 1 frontend module status/i })).toBeInTheDocument();
    expect(screen.getAllByText('Complete')).toHaveLength(8);
    expect(screen.getAllByText('Partial')).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: /enter virtual office/i }));
    expect(screen.getByRole('heading', { name: /step into your office/i })).toBeInTheDocument();
  });

  it('validates the display name before attempting a socket connection', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /enter virtual office/i }));
    fireEvent.change(screen.getByLabelText(/your name/i), { target: { value: 'A' } });
    fireEvent.click(screen.getByRole('button', { name: /join office/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/2-24 characters/i);
  });
});
