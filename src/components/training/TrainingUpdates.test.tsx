import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TrainingUpdates } from './TrainingUpdates';

vi.mock('@/context/TrainingContext', () => {
  return {
    useTraining: () => ({
      recentCreatedTrainings: [
        {
          id: 'train-2',
          name: 'Executive Coaching',
          date: new Date('2026-10-12T00:00:00.000Z'),
          status: 'Scheduled',
          categoryId: 'cat-1',
        },
        {
          id: 'train-1',
          name: 'Strategic Leadership',
          date: new Date('2026-11-02T00:00:00.000Z'),
          status: 'Scheduled',
          categoryId: 'cat-2',
        },
      ],
    }),
  };
});

describe('TrainingUpdates', () => {
  it('renders latest created trainings without modification-noise messages', () => {
    render(<TrainingUpdates />);

    expect(screen.getByText('Latest Updates')).toBeInTheDocument();
    expect(screen.getByText('Executive Coaching')).toBeInTheDocument();
    expect(screen.getByText('Strategic Leadership')).toBeInTheDocument();
    expect(screen.getAllByText('New training added')).toHaveLength(2);
    expect(screen.queryByText('Training details updated')).not.toBeInTheDocument();
    expect(screen.getAllByText(/Scheduled:/)).toHaveLength(2);
  });
});
