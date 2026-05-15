import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import StoriesGallery from '../StoriesGallery';
import * as api from '../../services/api';

vi.mock('../../services/api', () => ({
  getStories: vi.fn(),
  getStory: vi.fn(),
  formatImageUrl: vi.fn((url) => url),
}));

describe('StoriesGallery', () => {
  it('renders stories list correctly', async () => {
    const mockStories = [
      { id: 1, title: 'Story 1', slug: 'story-1', cover_image: 'img1.jpg', created_at: new Date().toISOString() },
      { id: 2, title: 'Story 2', slug: 'story-2', cover_image: 'img2.jpg', created_at: new Date().toISOString() },
    ];
    
    api.getStories.mockResolvedValue({ data: mockStories });

    render(
      <BrowserRouter>
        <StoriesGallery />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Web Stories/i)).toBeInTheDocument();
      expect(screen.getByText('Story 1')).toBeInTheDocument();
      expect(screen.getByText('Story 2')).toBeInTheDocument();
    });
  });

  it('renders empty state when no stories found', async () => {
    api.getStories.mockResolvedValue({ data: [] });

    render(
      <BrowserRouter>
        <StoriesGallery />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/No web stories yet/i)).toBeInTheDocument();
    });
  });
});
