import type { Training, RegistrationMethod } from '@/types/training';

export type TrainingFormErrors = Record<string, string>;

export interface TrainingFormValidationResult {
  isValid: boolean;
  errors: TrainingFormErrors;
  errorSummary: string[];
  invalidFields: string[];
  firstInvalidStep: number;
}

const STEP_FIELD_MAP: Record<number, string[]> = {
  0: ['name', 'categoryId', 'description', 'shortDescription'],
  1: ['date', 'endDate'],
  2: ['availableSlots', 'maxRegistrations', 'externalLink', 'registrationMethod'],
  3: ['location', 'speakers'],
  4: ['isRegistrationOpen'],
};

function parseDate(value: unknown): Date | null {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isHttpsUrl(value: string): boolean {
  return value.startsWith('https://');
}

function setError(errors: TrainingFormErrors, field: string, message: string) {
  if (!errors[field]) {
    errors[field] = message;
  }
}

function summarizeErrors(errors: TrainingFormErrors): string[] {
  return Object.entries(errors).map(([field, message]) => `${field}: ${message}`);
}

export function getFirstInvalidStep(invalidFields: string[]): number {
  for (let step = 0; step <= 4; step += 1) {
    const stepFields = STEP_FIELD_MAP[step] || [];
    if (invalidFields.some((field) => stepFields.includes(field))) {
      return step;
    }
  }
  return 0;
}

export function validateTrainingFormForSubmit(
  formData: Omit<Training, 'id'>
): TrainingFormValidationResult {
  const errors: TrainingFormErrors = {};

  if (!formData.name?.trim()) {
    setError(errors, 'name', 'Training name is required');
  } else if (formData.name.length > 200) {
    setError(errors, 'name', 'Name must be less than 200 characters');
  }

  if (!formData.categoryId) {
    setError(errors, 'categoryId', 'Category is required');
  }

  if (!formData.description?.trim()) {
    setError(errors, 'description', 'Description is required');
  } else if (formData.description.length > 5000) {
    setError(errors, 'description', 'Description must be less than 5000 characters');
  }

  if (formData.shortDescription && formData.shortDescription.length > 300) {
    setError(errors, 'shortDescription', 'Short description must be less than 300 characters');
  }

  const startDate = parseDate(formData.date);
  if (!startDate) {
    setError(errors, 'date', 'Start date is required');
  }

  const endDate = parseDate(formData.endDate);
  if (formData.endDate && !endDate) {
    setError(errors, 'endDate', 'End date is invalid');
  } else if (startDate && endDate && endDate.getTime() < startDate.getTime()) {
    setError(errors, 'endDate', 'End date cannot be earlier than start date');
  }

  if (!Number.isFinite(formData.availableSlots) || formData.availableSlots < 0) {
    setError(errors, 'availableSlots', 'Available slots cannot be negative');
  } else if (formData.availableSlots > 10000) {
    setError(errors, 'availableSlots', 'Maximum 10,000 slots allowed');
  }

  if (!Number.isFinite(formData.maxRegistrations) || formData.maxRegistrations < 1) {
    setError(errors, 'maxRegistrations', 'Maximum registrations must be at least 1');
  } else if (formData.maxRegistrations > 10000) {
    setError(errors, 'maxRegistrations', 'Maximum 10,000 registrations allowed');
  }

  if (
    Number.isFinite(formData.availableSlots) &&
    Number.isFinite(formData.maxRegistrations) &&
    formData.availableSlots > formData.maxRegistrations
  ) {
    setError(errors, 'availableSlots', 'Available slots cannot exceed max registrations');
  }

  const registrationMethod = formData.registrationMethod as RegistrationMethod;
  if (registrationMethod === 'external') {
    const externalLink = formData.externalLink?.trim() || '';
    if (!externalLink) {
      setError(errors, 'externalLink', 'External registration URL is required');
    } else if (!isHttpsUrl(externalLink)) {
      setError(errors, 'externalLink', 'URL must start with https://');
    }
  }

  const invalidFields = Object.keys(errors);
  return {
    isValid: invalidFields.length === 0,
    errors,
    errorSummary: summarizeErrors(errors),
    invalidFields,
    firstInvalidStep: getFirstInvalidStep(invalidFields),
  };
}
