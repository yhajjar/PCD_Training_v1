import { describe, expect, it } from 'vitest';
import type { Training } from '@/types/training';
import { validateTrainingFormForSubmit } from './trainingFormValidation';

function createBaseForm(): Omit<Training, 'id'> {
  return {
    name: 'Project Management Fundamentals',
    description: 'Core workshop',
    shortDescription: 'Short description',
    categoryId: 'category-1',
    date: new Date('2026-02-15T00:00:00.000Z'),
    endDate: new Date('2026-02-15T00:00:00.000Z'),
    timeFrom: '09:00',
    timeTo: '17:00',
    duration: '8 hours',
    status: 'Scheduled',
    availableSlots: 20,
    maxRegistrations: 25,
    registrationMethod: 'internal',
    externalLink: '',
    heroImage: '',
    isFeatured: false,
    isRecommended: false,
    isRegistrationOpen: true,
    attachments: [],
    location: 'Training Room A',
    speakers: 'Speaker Name',
    targetAudience: 'General',
  };
}

describe('validateTrainingFormForSubmit', () => {
  it('returns valid for complete internal registration form', () => {
    const result = validateTrainingFormForSubmit(createBaseForm());
    expect(result.isValid).toBe(true);
    expect(result.errorSummary).toEqual([]);
  });

  it('returns firstInvalidStep and summary for blocked submit', () => {
    const invalidForm = createBaseForm();
    invalidForm.name = '';
    invalidForm.categoryId = '';
    invalidForm.availableSlots = 30;
    invalidForm.maxRegistrations = 10;

    const result = validateTrainingFormForSubmit(invalidForm);
    expect(result.isValid).toBe(false);
    expect(result.firstInvalidStep).toBe(0);
    expect(result.errors.name).toContain('required');
    expect(result.errors.categoryId).toContain('required');
    expect(result.errors.availableSlots).toContain('cannot exceed');
    expect(result.errorSummary.length).toBeGreaterThan(0);
  });

  it('enforces https external link for external registration', () => {
    const invalidForm = createBaseForm();
    invalidForm.registrationMethod = 'external';
    invalidForm.externalLink = 'http://example.com';

    const result = validateTrainingFormForSubmit(invalidForm);
    expect(result.isValid).toBe(false);
    expect(result.errors.externalLink).toBe('URL must start with https://');
    expect(result.firstInvalidStep).toBe(2);
  });
});
