import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import Navbar from '../Navbar';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';

// Mock dependencies
vi.mock('../../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../../context/ThemeContext', () => ({
  useTheme: vi.fn(),
}));

// Helper to wrap component with Router
const renderWithRouter = (ui) => {
  return render(ui, { wrapper: BrowserRouter });
};

describe('Navbar Component', () => {
  it('renders logo and basic links', () => {
    useAuth.mockReturnValue({ user: null });
    useTheme.mockReturnValue({ dark: false, toggle: vi.fn() });

    renderWithRouter(<Navbar />);
    
    expect(screen.getByText('BlogVerse')).toBeInTheDocument();
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Explore')).toBeInTheDocument();
  });

  it('shows login/signup buttons when not logged in', () => {
    useAuth.mockReturnValue({ user: null });
    useTheme.mockReturnValue({ dark: false, toggle: vi.fn() });

    renderWithRouter(<Navbar />);
    
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Sign Up')).toBeInTheDocument();
  });

  it('shows user profile menu when logged in', () => {
    useAuth.mockReturnValue({ 
      user: { username: 'testuser', full_name: 'Test User', email: 'test@example.com' } 
    });
    useTheme.mockReturnValue({ dark: false, toggle: vi.fn() });

    renderWithRouter(<Navbar />);
    
    // Check for the initial letter of the username in the profile button
    expect(screen.getByText('T')).toBeInTheDocument();
  });

  it('toggles theme when theme button is clicked', () => {
    const toggleMock = vi.fn();
    useAuth.mockReturnValue({ user: null });
    useTheme.mockReturnValue({ dark: false, toggle: toggleMock });

    renderWithRouter(<Navbar />);
    
    // Theme toggle button is identified by its interaction since icons are hard to find by text
    const buttons = screen.getAllByRole('button');
    // The theme toggle is usually the second button (search is first, theme is second)
    // In our code: Search, Theme, Auth, Mobile Menu.
    // Let's find it by icon name if possible or index.
    // Actually, let's just click all buttons that don't have text.
    fireEvent.click(buttons[1]); 
    expect(toggleMock).toHaveBeenCalled();
  });
});
