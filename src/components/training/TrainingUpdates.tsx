import { useTraining } from '@/context/TrainingContext';
import { format } from 'date-fns';
import { Plus, Bell } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AnimateIn } from '@/components/ui/animate-in';

export function TrainingUpdates() {
  const { recentCreatedTrainings } = useTraining();

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm h-full">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Latest Updates</h3>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Recent training activity
        </p>
      </div>

      <ScrollArea className="h-[400px]">
        <div className="p-3 space-y-2">
          {recentCreatedTrainings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No trainings created yet</p>
            </div>
          ) : (
            recentCreatedTrainings.map((training, index) => (
              <AnimateIn key={training.id} delay={index * 50} from="right">
                <div
                  className="p-3 rounded-lg border bg-green-500/10 border-green-500/20 transition-all hover:shadow-sm"
                >
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5">
                      <Plus className="h-4 w-4 text-green-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground line-clamp-1">
                        {training.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        New training added
                      </p>
                      <p className="text-[10px] text-muted-foreground/70 mt-1">
                        {training.date ? `Scheduled: ${format(training.date, 'PPP')}` : 'Scheduled date not set'}
                      </p>
                    </div>
                  </div>
                </div>
              </AnimateIn>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
