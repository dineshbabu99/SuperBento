import React, { useState } from 'react';
import { useGetPrepTasksQuery, useUpdatePrepTaskStatusMutation } from '../api/kitchenApi';
import { Button } from '../../../shared/ui/button';

interface PrepTask {
  id: string;
  taskName: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  assignedTo?: { id: string; firstName: string; lastName: string } | null;
  dailyMenu?: { id: string; date: string } | null;
}

const columns: { id: 'TODO' | 'IN_PROGRESS' | 'DONE'; title: string; color: string; dot: string }[] = [
  { id: 'TODO', title: 'To Do', color: 'bg-muted/50 border-border', dot: 'bg-muted-foreground' },
  { id: 'IN_PROGRESS', title: 'In Progress', color: 'bg-yellow-500/5 border-yellow-500/30', dot: 'bg-yellow-500' },
  { id: 'DONE', title: 'Done', color: 'bg-green-500/5 border-green-500/30', dot: 'bg-green-500' },
];

export const PrepBoardPage: React.FC = () => {
  const [filterDate, setFilterDate] = useState('');
  const { data: tasks, isLoading } = useGetPrepTasksQuery({});
  const [updateStatus, { isLoading: isUpdating }] = useUpdatePrepTaskStatusMutation();

  const handleStatusChange = async (id: string, newStatus: string) => {
    await updateStatus({ id, status: newStatus });
  };

  const filteredTasks = (tasks as PrepTask[] | undefined)?.filter((t) => {
    if (!filterDate) return true;
    if (!t.dailyMenu?.date) return false;
    return new Date(t.dailyMenu.date).toISOString().startsWith(filterDate);
  }) ?? [];

  if (isLoading) {
    return (
      <div className="p-12 text-center text-muted-foreground">
        <div className="text-4xl mb-3">👨‍🍳</div>
        Loading prep board...
      </div>
    );
  }

  return (
    <div className="p-6 h-full flex flex-col space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Kitchen Prep Board</h1>
          <p className="text-sm text-muted-foreground mt-1">Track kitchen preparation tasks</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">Filter by date:</label>
          <input
            type="date"
            className="px-3 py-1.5 bg-background border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
          {filterDate && (
            <Button variant="outline" size="sm" onClick={() => setFilterDate('')}>
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-4">
        {columns.map((col) => {
          const count = filteredTasks.filter((t) => t.status === col.id).length;
          return (
            <div key={col.id} className="bg-card border rounded-lg p-4 flex items-center gap-3">
              <span className={`w-3 h-3 rounded-full flex-shrink-0 ${col.dot}`} />
              <div>
                <p className="text-xs text-muted-foreground">{col.title}</p>
                <p className="text-2xl font-bold leading-tight">{count}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Kanban Board */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 min-h-0">
        {columns.map((col) => {
          const colTasks = filteredTasks.filter((t) => t.status === col.id);
          return (
            <div
              key={col.id}
              className={`flex flex-col rounded-xl border overflow-hidden ${col.color}`}
            >
              {/* Column header */}
              <div className="p-4 border-b flex items-center gap-2 bg-background/50">
                <span className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
                <span className="font-semibold text-sm">{col.title}</span>
                <span className="ml-auto px-2 py-0.5 bg-background border rounded-full text-xs text-muted-foreground font-medium">
                  {colTasks.length}
                </span>
              </div>

              {/* Task cards */}
              <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                {colTasks.length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground border-2 border-dashed rounded-lg">
                    No tasks
                  </div>
                ) : (
                  colTasks.map((task) => (
                    <div
                      key={task.id}
                      className="bg-card p-4 rounded-lg border shadow-sm space-y-3 hover:border-primary/40 transition-all duration-150"
                    >
                      <p className="font-medium text-sm leading-snug">{task.taskName}</p>

                      {task.dailyMenu?.date && (
                        <p className="text-xs text-muted-foreground">
                          📅{' '}
                          {new Date(task.dailyMenu.date).toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      )}

                      {task.assignedTo && (
                        <p className="text-xs text-muted-foreground">
                          👤 {task.assignedTo.firstName} {task.assignedTo.lastName}
                        </p>
                      )}

                      <div className="flex justify-end gap-2 pt-1">
                        {task.status === 'TODO' && (
                          <Button
                            size="sm"
                            disabled={isUpdating}
                            onClick={() => handleStatusChange(task.id, 'IN_PROGRESS')}
                          >
                            Start
                          </Button>
                        )}
                        {task.status === 'IN_PROGRESS' && (
                          <Button
                            size="sm"
                            disabled={isUpdating}
                            onClick={() => handleStatusChange(task.id, 'DONE')}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            Complete
                          </Button>
                        )}
                        {task.status === 'DONE' && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isUpdating}
                            onClick={() => handleStatusChange(task.id, 'TODO')}
                          >
                            Reopen
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
