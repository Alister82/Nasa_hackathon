import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { App } from '@/app/App';
import { ErrorBoundary } from '@/ui/components/ErrorBoundary';

describe('U3: App Shell & Routing', () => {
  it('renders top bar with app title, crew picker, and urgent help button', () => {
    render(<App />);
    expect(screen.getByText('Vigil')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /select crew member/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /get urgent medical help/i })).toBeInTheDocument();
  });

  it('renders disclaimer banner on app load', () => {
    render(<App />);
    expect(
      screen.getByText('Simulated crew data. Decision support only, not a medical device.'),
    ).toBeInTheDocument();
  });

  it('navigates to Urgent Help screen and displays exact copy', () => {
    render(<App />);
    const urgentBtn = screen.getByRole('button', { name: /get urgent medical help/i });
    fireEvent.click(urgentBtn);

    expect(screen.getByRole('heading', { name: 'Get help now' })).toBeInTheDocument();
    expect(
      screen.getByText(
        'Contact your crew medical officer and ground now. You do not have to handle this alone. Follow your emergency procedures.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'A reply from ground may take a while. Do not wait for a reply before starting emergency procedures.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to Today' })).toBeInTheDocument();
  });
});

describe('U3: ErrorBoundary', () => {
  function ThrowingComponent(): React.ReactNode {
    throw new Error('Test crash');
  }

  it('catches render error and displays friendly fallback with Back to Today button', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Something went wrong on this screen.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to Today' })).toBeInTheDocument();
  });
});
