import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Category, Training, Registration, Resource, TrainingUpdate, RecentCreatedTrainingItem } from '@/types/training';
import { useAuth } from '@/hooks/useAuth';
import { pb } from '@/integrations/pocketbase/client';
import {
  fetchCategories,
  fetchTrainings,
  fetchRecentCreatedTrainings,
  fetchRegistrations,
  fetchResources,
  fetchTrainingUpdates,
  createCategory,
  updateCategoryDb,
  deleteCategoryDb,
  createTraining,
  updateTrainingDb,
  deleteTrainingDb,
  createRegistration,
  updateRegistrationDb,
  deleteRegistrationDb,
  createResource,
  updateResourceDb,
  deleteResourceDb,
  createTrainingUpdate,
} from '@/lib/database';

interface TrainingContextType {
  categories: Category[];
  trainings: Training[];
  recentCreatedTrainings: RecentCreatedTrainingItem[];
  registrations: Registration[];
  resources: Resource[];
  trainingUpdates: TrainingUpdate[];
  isLoading: boolean;
  addCategory: (category: Omit<Category, 'id'>) => Promise<Category | null>;
  updateCategory: (category: Category) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addTraining: (training: Omit<Training, 'id'> & { heroImageFile?: File | null; attachmentFiles?: { file: File; name: string; fileType: string }[] }) => Promise<Training | null>;
  updateTraining: (training: Training & { heroImageFile?: File | null; attachmentFiles?: { file: File; name: string; fileType: string }[]; removedAttachmentIds?: string[] }) => Promise<void>;
  deleteTraining: (id: string) => Promise<void>;
  addRegistration: (registration: Omit<Registration, 'id'>) => Promise<Registration | null>;
  updateRegistration: (registration: Registration) => Promise<void>;
  deleteRegistration: (id: string) => Promise<void>;
  addResource: (resource: Omit<Resource, 'id'>) => Promise<Resource | null>;
  updateResource: (resource: Resource) => Promise<void>;
  deleteResource: (id: string) => Promise<void>;
  getCategoryById: (id: string) => Category | undefined;
  getTrainingById: (id: string) => Training | undefined;
  getRegistrationsByTrainingId: (trainingId: string) => Registration[];
  getFeaturedTrainings: () => Training[];
  getRecommendedTrainings: () => Training[];
  addTrainingUpdate: (update: Omit<TrainingUpdate, 'id' | 'timestamp'>) => Promise<void>;
  refreshData: () => Promise<void>;
}

const TrainingContext = createContext<TrainingContextType | undefined>(undefined);

export function TrainingProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [recentCreatedTrainings, setRecentCreatedTrainings] = useState<RecentCreatedTrainingItem[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [trainingUpdates, setTrainingUpdates] = useState<TrainingUpdate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load all data from database
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [cats, trains, recentCreated, regs, res, updates] = await Promise.all([
        fetchCategories(),
        fetchTrainings(),
        fetchRecentCreatedTrainings(),
        fetchRegistrations(),
        fetchResources(),
        fetchTrainingUpdates(),
      ]);

      setCategories(cats);
      setTrainings(trains);
      setRecentCreatedTrainings(recentCreated);
      setRegistrations(regs);
      setResources(res);
      setTrainingUpdates(updates);

      if (cats.length === 0 && trains.length === 0 && res.length === 0) {
        console.warn('[TrainingContext] Loaded empty datasets', {
          hasUser: Boolean(user),
          pbAuthValid: pb.authStore.isValid,
          likelyCause: user
            ? 'empty_dataset_or_rule_restriction'
            : 'guest_session_or_empty_seed_data',
        });
      }
    } catch (error) {
      console.error('[TrainingContext] Failed to load one or more datasets; keeping last known state.', {
        hasUser: Boolean(user),
        pbAuthValid: pb.authStore.isValid,
        error,
      });
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Load data when auth state resolves (works for both guests and signed-in users)
  useEffect(() => {
    if (authLoading) {
      return;
    }
    loadData();
  }, [user, authLoading, loadData]);

  const refreshData = useCallback(async () => {
    await loadData();
  }, [loadData]);

  // Category operations
  const addCategoryHandler = async (category: Omit<Category, 'id'>): Promise<Category | null> => {
    const created = await createCategory({ name: category.name, color: category.color });
    if (created) {
      setCategories(prev => [...prev, created]);
    }
    return created;
  };

  const updateCategoryHandler = async (category: Category) => {
    const success = await updateCategoryDb(category);
    if (success) {
      setCategories(prev => prev.map(c => c.id === category.id ? category : c));
    }
  };

  const deleteCategoryHandler = async (id: string) => {
    const success = await deleteCategoryDb(id);
    if (success) {
      setCategories(prev => prev.filter(c => c.id !== id));
    }
  };

  // Training operations
  const addTrainingHandler = async (training: Omit<Training, 'id'> & { heroImageFile?: File | null; attachmentFiles?: { file: File; name: string; fileType: string }[] }): Promise<Training | null> => {
    const created = await createTraining(training);
    if (created) {
      setTrainings(prev => [...prev, created]);
      setRecentCreatedTrainings(prev => [
        {
          id: created.id,
          name: created.name,
          date: created.date,
          status: created.status,
          categoryId: created.categoryId,
        },
        ...prev,
      ].slice(0, 10));
    }
    return created;
  };

  const updateTrainingHandler = async (training: Training & { heroImageFile?: File | null; attachmentFiles?: { file: File; name: string; fileType: string }[]; removedAttachmentIds?: string[] }) => {
    const success = await updateTrainingDb(training);
    if (success) {
      setTrainings(prev => prev.map(t => t.id === training.id ? training : t));
    }
  };

  const deleteTrainingHandler = async (id: string) => {
    const success = await deleteTrainingDb(id);
    if (success) {
      setTrainings(prev => prev.filter(t => t.id !== id));
      setRecentCreatedTrainings(prev => prev.filter(t => t.id !== id));
    }
  };

  // Registration operations
  const addRegistrationHandler = async (registration: Omit<Registration, 'id'>): Promise<Registration | null> => {
    const created = await createRegistration(registration);
    if (created) {
      setRegistrations(prev => [...prev, created]);
    }
    return created;
  };

  const updateRegistrationHandler = async (registration: Registration) => {
    const success = await updateRegistrationDb(registration);
    if (success) {
      setRegistrations(prev => prev.map(r => r.id === registration.id ? registration : r));
    }
  };

  const deleteRegistrationHandler = async (id: string) => {
    const success = await deleteRegistrationDb(id);
    if (success) {
      setRegistrations(prev => prev.filter(r => r.id !== id));
    }
  };

  // Resource operations
  const addResourceHandler = async (resource: Omit<Resource, 'id'>): Promise<Resource | null> => {
    const created = await createResource(resource);
    if (created) {
      setResources(prev => [...prev, created]);
    }
    return created;
  };

  const updateResourceHandler = async (resource: Resource) => {
    const success = await updateResourceDb(resource);
    if (success) {
      setResources(prev => prev.map(r => r.id === resource.id ? resource : r));
    }
  };

  const deleteResourceHandler = async (id: string) => {
    const success = await deleteResourceDb(id);
    if (success) {
      setResources(prev => prev.filter(r => r.id !== id));
    }
  };

  // Getter functions
  const getCategoryById = (id: string) => categories.find(c => c.id === id);
  const getTrainingById = (id: string) => trainings.find(t => t.id === id);
  const getRegistrationsByTrainingId = (trainingId: string) => 
    registrations.filter(r => r.trainingId === trainingId);
  const getFeaturedTrainings = () =>
    trainings.filter(t => t.isFeatured).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  const getRecommendedTrainings = () =>
    trainings.filter(t => t.isRecommended).slice(0, 4);

  // Training updates
  const addTrainingUpdateHandler = async (update: Omit<TrainingUpdate, 'id' | 'timestamp'>) => {
    const created = await createTrainingUpdate(update);
    if (created) {
      setTrainingUpdates(prev => [created, ...prev].slice(0, 50));
    }
  };

  return (
    <TrainingContext.Provider
      value={{
        categories,
        trainings,
        recentCreatedTrainings,
        registrations,
        resources,
        trainingUpdates,
        isLoading,
        addCategory: addCategoryHandler,
        updateCategory: updateCategoryHandler,
        deleteCategory: deleteCategoryHandler,
        addTraining: addTrainingHandler,
        updateTraining: updateTrainingHandler,
        deleteTraining: deleteTrainingHandler,
        addRegistration: addRegistrationHandler,
        updateRegistration: updateRegistrationHandler,
        deleteRegistration: deleteRegistrationHandler,
        addResource: addResourceHandler,
        updateResource: updateResourceHandler,
        deleteResource: deleteResourceHandler,
        getCategoryById,
        getTrainingById,
        getRegistrationsByTrainingId,
        getFeaturedTrainings,
        getRecommendedTrainings,
        addTrainingUpdate: addTrainingUpdateHandler,
        refreshData,
      }}
    >
      {children}
    </TrainingContext.Provider>
  );
}

export function useTraining() {
  const context = useContext(TrainingContext);
  if (context === undefined) {
    throw new Error('useTraining must be used within a TrainingProvider');
  }
  return context;
}
