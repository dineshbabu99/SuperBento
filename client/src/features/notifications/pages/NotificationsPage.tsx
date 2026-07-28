import React, { useState } from 'react';
import {
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} from '../../users/api/systemPeopleApi';
import { Button } from '../../../shared/ui/button';

export const NotificationsPage: React.FC = () => {
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');
  const [page, setPage] = useState(1);

  const { data: response, isLoading, refetch } = useGetNotificationsQuery({ page, limit: 15 });
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead, { isLoading: isMarkingAll }] = useMarkAllNotificationsReadMutation();

  const notifications = response?.data ?? [];
  const total = response?.total ?? 0;
  const totalPages = Math.ceil(total / 15);

  const handleMarkRead = async (id: string) => {
    try {
      await markRead(id).unwrap();
    } catch {
      alert('Failed to mark notification as read.');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllRead().unwrap();
      refetch();
    } catch {
      alert('Failed to mark all notifications as read.');
    }
  };

  const displayedNotifications = filter === 'UNREAD' 
    ? notifications.filter(n => !n.isRead) 
    : notifications;

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Notifications Center</h1>
          <p className="text-sm text-muted-foreground mt-1">Review important updates, alerts, and process triggers</p>
        </div>
        {notifications.some(n => !n.isRead) && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead} disabled={isMarkingAll}>
            {isMarkingAll ? 'Marking...' : '✓ Mark all as read'}
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex rounded-md border bg-muted/40 p-1 text-sm self-start max-w-max">
        <button
          className={`px-3 py-1.5 rounded-sm transition-all ${
            filter === 'ALL'
              ? 'bg-background text-foreground shadow-sm font-medium'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setFilter('ALL')}
        >
          All Notifications ({total})
        </button>
        <button
          className={`px-3 py-1.5 rounded-sm transition-all ${
            filter === 'UNREAD'
              ? 'bg-background text-foreground shadow-sm font-medium'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setFilter('UNREAD')}
        >
          Unread ({notifications.filter((n) => !n.isRead).length})
        </button>
      </div>

      {/* Inbox feed */}
      <div className="bg-card border rounded-lg overflow-hidden divide-y">
        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground">Loading inbox...</div>
        ) : displayedNotifications.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <div className="text-4xl mb-2">📬</div>
            <p className="font-medium">Your inbox is clear!</p>
            <p className="text-xs text-muted-foreground mt-0.5">No notifications match this filter.</p>
          </div>
        ) : (
          displayedNotifications.map((n) => (
            <div
              key={n.id}
              className={`p-5 transition-colors flex gap-4 items-start ${
                !n.isRead ? 'bg-primary/5 hover:bg-primary/10 border-l-4 border-l-primary' : 'hover:bg-muted/40'
              }`}
            >
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm">{n.title}</h3>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {new Date(n.createdAt).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{n.message}</p>
              </div>

              {!n.isRead && (
                <button
                  onClick={() => handleMarkRead(n.id)}
                  className="text-xs text-primary hover:underline font-medium shrink-0"
                >
                  Mark read
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <span className="text-xs text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
export default NotificationsPage;
