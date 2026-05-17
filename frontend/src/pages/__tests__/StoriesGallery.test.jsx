import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import StoriesGallery from '../StoriesGallery';
import * as api from '../../services/api';

vi.mock('../../services/api', () => ({
  getStories: vi.fn(),
  getStory: vi.fn(),
  getCategories: vi.fn(),
  getTags: vi.fn(),
  formatImageUrl: vi.fn((url) => url),
}));

describe('StoriesGallery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getCategories.mockResolvedValue({ data: [] });
    api.getTags.mockResolvedValue({ data: [] });
  });

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
      expect(screen.getByText('Latest Chapters')).toBeInTheDocument();
      expect(screen.getAllByText('Story 2').length).toBeGreaterThan(0);
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
      expect(screen.getByText(/The gallery is currently being curated/i)).toBeInTheDocument();
    });
  });
});

