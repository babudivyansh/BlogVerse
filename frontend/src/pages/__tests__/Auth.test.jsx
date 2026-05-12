import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import Auth from '../Auth';
import { useAuth } from '../../context/AuthContext';

// Mock AuthContext
vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}));

const renderWithRouter = (ui) => {
  return render(ui, { wrapper: BrowserRouter });
};

describe('Auth Page', () => {
  it('renders login tab by default', () => {
    useAuth.mockReturnValue({ login: vi.fn(), signup: vi.fn() });

    renderWithRouter(<Auth />);
    
    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
  });

  it('switches to signup tab when clicked', () => {
    useAuth.mockReturnValue({ login: vi.fn(), signup: vi.fn() });

    renderWithRouter(<Auth />);
    
    const signupTab = screen.getByRole('button', { name: /Sign Up/i });
    fireEvent.click(signupTab);
    
    expect(screen.getAllByText('Create Account')[0]).toBeInTheDocument();
    expect(screen.getByPlaceholderText('John Doe')).toBeInTheDocument();
  });

  it('calls login function on form submission', async () => {
    const loginMock = vi.fn().mockResolvedValue({});
    useAuth.mockReturnValue({ login: loginMock, signup: vi.fn() });

    renderWithRouter(<Auth />);
    
    fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } });
    
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));
    
    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });
});
