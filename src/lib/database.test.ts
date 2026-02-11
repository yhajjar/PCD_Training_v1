import { beforeEach, describe, expect, it, vi } from 'vitest';

const hoisted = vi.hoisted(() => {
  return {
    collectionMock: vi.fn(),
    getListMock: vi.fn(),
    createMock: vi.fn(),
  };
});

vi.mock('@/integrations/pocketbase/client', () => {
  return {
    pb: {
      baseURL: 'https://training-hub.ku.ac.ae',
      files: { getURL: vi.fn(() => 'https://training-hub.ku.ac.ae/api/files/mock') },
      collection: hoisted.collectionMock,
    },
  };
});

import { createTrainingUpdate, fetchRecentCreatedTrainings, fetchTrainingUpdates } from './database';

describe('database recent-created widget + updates behavior', () => {
  beforeEach(() => {
    hoisted.collectionMock.mockReset();
    hoisted.getListMock.mockReset();
    hoisted.createMock.mockReset();

    hoisted.collectionMock.mockImplementation(() => ({
      getList: hoisted.getListMock,
      create: hoisted.createMock,
    }));
  });

  it('fetches recent created trainings using row-order sort and maps minimal fields', async () => {
    hoisted.getListMock.mockResolvedValueOnce({
      items: [
        {
          id: 'train-1',
          name: 'Strategic Leadership',
          date: '2026-11-02 00:00:00.000Z',
          status: 'Scheduled',
          category_id: 'cat-1',
        },
      ],
    });

    const result = await fetchRecentCreatedTrainings();

    expect(hoisted.collectionMock).toHaveBeenCalledWith('trainings');
    expect(hoisted.getListMock).toHaveBeenCalledWith(1, 10, { sort: '-@rowid' });
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 'train-1',
      name: 'Strategic Leadership',
      status: 'Scheduled',
      categoryId: 'cat-1',
    });
    expect(result[0].date).toBeInstanceOf(Date);
  });

  it('does not treat missing update timestamp as current time', async () => {
    hoisted.getListMock.mockResolvedValueOnce({
      items: [
        {
          id: 'upd-1',
          type: 'training_modified',
          training_id: 'train-1',
          training_name: 'Strategic Leadership',
          message: 'Training details updated',
          timestamp: '',
          previous_value: '',
          new_value: '',
        },
      ],
    });

    const result = await fetchTrainingUpdates();

    expect(hoisted.collectionMock).toHaveBeenCalledWith('training_updates');
    expect(hoisted.getListMock).toHaveBeenCalledWith(1, 50, { sort: '-timestamp,-@rowid' });
    expect(result).toHaveLength(1);
    expect(result[0].timestamp.getTime()).toBe(0);
  });

  it('parses explicit update timestamp and writes timestamp on create', async () => {
    hoisted.getListMock.mockResolvedValueOnce({
      items: [
        {
          id: 'upd-2',
          type: 'training_added',
          training_id: 'train-2',
          training_name: 'Executive Coaching',
          message: 'New training added',
          timestamp: '2026-02-11T10:00:00.000Z',
          previous_value: '',
          new_value: '',
        },
      ],
    });

    const fetched = await fetchTrainingUpdates();
    expect(fetched[0].timestamp.getTime()).toBe(Date.parse('2026-02-11T10:00:00.000Z'));

    hoisted.createMock.mockResolvedValueOnce({
      id: 'upd-created',
      type: 'training_added',
      training_id: 'train-3',
      training_name: 'New Program',
      message: 'New training added',
      timestamp: '2026-02-11T11:00:00.000Z',
      previous_value: '',
      new_value: '',
    });

    const created = await createTrainingUpdate({
      type: 'training_added',
      trainingId: 'train-3',
      trainingName: 'New Program',
      message: 'New training added',
    });

    expect(hoisted.collectionMock).toHaveBeenCalledWith('training_updates');
    expect(hoisted.createMock).toHaveBeenCalledTimes(1);
    const createPayload = hoisted.createMock.mock.calls[0][0] as { timestamp?: string };
    expect(typeof createPayload.timestamp).toBe('string');
    expect(Number.isNaN(Date.parse(createPayload.timestamp || ''))).toBe(false);
    expect(created?.timestamp.getTime()).toBe(Date.parse('2026-02-11T11:00:00.000Z'));
  });
});
