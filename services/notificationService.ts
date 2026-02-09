import { Notification, VerificationEvent } from '../types';

class NotificationService {
    private storageKey = 'lune_notifications';
    private eventsKey = 'lune_verification_events';

    // Get all notifications for a user
    getNotifications(userId: string): Notification[] {
        const stored = localStorage.getItem(this.storageKey);
        if (!stored) return [];

        const all: Notification[] = JSON.parse(stored);
        return all.filter(n => n.userId === userId)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    // Create a new notification
    createNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Notification {
        const newNotification: Notification = {
            ...notification,
            id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date().toISOString()
        };

        const existing = this.getAllNotifications();
        existing.push(newNotification);
        localStorage.setItem(this.storageKey, JSON.stringify(existing));

        return newNotification;
    }

    // Record a certificate verification event
    recordVerificationEvent(event: Omit<VerificationEvent, 'id' | 'verifiedAt'>): void {
        const verificationEvent: VerificationEvent = {
            ...event,
            id: `verify_${Date.now()}`,
            verifiedAt: new Date().toISOString()
        };

        // Store verification event
        const events = this.getVerificationEvents();
        events.push(verificationEvent);
        localStorage.setItem(this.eventsKey, JSON.stringify(events));

        // Create notification for candidate
        this.createNotification({
            userId: event.candidateId,
            type: 'certificate_verified',
            title: 'Certificate Verified!',
            message: `${event.verifiedBy} verified your ${event.skill} certificate`,
            relatedData: {
                certificateHash: event.certificateHash,
                skill: event.skill,
                companyName: event.verifiedBy
            },
            read: false
        });
    }

    // Mark notification as read
    markAsRead(notificationId: string): void {
        const all = this.getAllNotifications();
        const index = all.findIndex(n => n.id === notificationId);
        if (index !== -1) {
            all[index].read = true;
            localStorage.setItem(this.storageKey, JSON.stringify(all));
        }
    }

    // Mark all as read for a user
    markAllAsRead(userId: string): void {
        const all = this.getAllNotifications();
        all.forEach(n => {
            if (n.userId === userId) n.read = true;
        });
        localStorage.setItem(this.storageKey, JSON.stringify(all));
    }

    // Delete a notification
    deleteNotification(notificationId: string): void {
        const all = this.getAllNotifications();
        const filtered = all.filter(n => n.id !== notificationId);
        localStorage.setItem(this.storageKey, JSON.stringify(filtered));
    }

    // Get unread count
    getUnreadCount(userId: string): number {
        return this.getNotifications(userId).filter(n => !n.read).length;
    }

    // Get verification events (for analytics)
    getVerificationEvents(): VerificationEvent[] {
        const stored = localStorage.getItem(this.eventsKey);
        return stored ? JSON.parse(stored) : [];
    }

    // Get verification events for a certificate
    getVerificationEventsForCertificate(certificateHash: string): VerificationEvent[] {
        return this.getVerificationEvents()
            .filter(e => e.certificateHash === certificateHash)
            .sort((a, b) => new Date(b.verifiedAt).getTime() - new Date(a.verifiedAt).getTime());
    }

    private getAllNotifications(): Notification[] {
        const stored = localStorage.getItem(this.storageKey);
        return stored ? JSON.parse(stored) : [];
    }
}

export const notificationService = new NotificationService();
