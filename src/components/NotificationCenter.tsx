import { useState, useEffect } from "react";
import { Bell, CheckCircle2, AlertCircle, Mail, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface Notification {
  id: string;
  type: "policy_expiring" | "email_sent" | "email_failed" | "automation_complete";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  icon: any;
  variant: "default" | "success" | "warning" | "destructive";
}

export const NotificationCenter = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    loadNotifications();
    subscribeToChanges();
  }, []);

  const loadNotifications = async () => {
    // Check for policies expiring soon
    const { data: policies } = await supabase
      .from("policies")
      .select("*")
      .eq("jotform_submitted", false)
      .order("expiration_date", { ascending: true })
      .limit(5);

    const today = new Date();
    const notifs: Notification[] = [];

    policies?.forEach((policy) => {
      const expDate = new Date(policy.expiration_date);
      const daysUntil = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntil <= 7 && daysUntil >= 0) {
        notifs.push({
          id: `policy-${policy.id}`,
          type: "policy_expiring",
          title: "Policy Expiring Soon",
          message: `Policy ${policy.policy_number} expires in ${daysUntil} days`,
          timestamp: new Date(),
          read: false,
          icon: Calendar,
          variant: "warning",
        });
      } else if (daysUntil < 0) {
        notifs.push({
          id: `policy-overdue-${policy.id}`,
          type: "policy_expiring",
          title: "Policy Overdue",
          message: `Policy ${policy.policy_number} is ${Math.abs(daysUntil)} days overdue`,
          timestamp: new Date(),
          read: false,
          icon: AlertCircle,
          variant: "destructive",
        });
      }
    });

    // Check recent email logs
    const { data: emailLogs } = await supabase
      .from("email_logs")
      .select("*")
      .order("sent_at", { ascending: false })
      .limit(5);

    emailLogs?.forEach((log) => {
      if (log.status === "failed") {
        notifs.push({
          id: `email-${log.id}`,
          type: "email_failed",
          title: "Email Failed",
          message: `Failed to send email to ${log.recipient_email}`,
          timestamp: new Date(log.sent_at),
          read: false,
          icon: AlertCircle,
          variant: "destructive",
        });
      }
    });

    // Load from localStorage
    const saved = localStorage.getItem("notifications");
    if (saved) {
      const savedNotifs = JSON.parse(saved);
      notifs.push(...savedNotifs);
    }

    setNotifications(notifs.slice(0, 10));
    setUnreadCount(notifs.filter((n) => !n.read).length);
  };

  const subscribeToChanges = () => {
    // Subscribe to email_logs changes
    const emailChannel = supabase
      .channel("email-log-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "email_logs",
        },
        (payload) => {
          const log = payload.new;
          const newNotif: Notification = {
            id: `email-${log.id}`,
            type: log.status === "sent" ? "email_sent" : "email_failed",
            title: log.status === "sent" ? "Email Sent" : "Email Failed",
            message: `${log.email_type === "reminder1" ? "First" : "Follow-up"} email to ${log.recipient_email}`,
            timestamp: new Date(log.sent_at),
            read: false,
            icon: log.status === "sent" ? CheckCircle2 : AlertCircle,
            variant: log.status === "sent" ? "success" : "destructive",
          };

          setNotifications((prev) => [newNotif, ...prev].slice(0, 10));
          setUnreadCount((prev) => prev + 1);
          saveNotifications([newNotif]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(emailChannel);
    };
  };

  const saveNotifications = (notifs: Notification[]) => {
    const existing = localStorage.getItem("notifications");
    const existingNotifs = existing ? JSON.parse(existing) : [];
    const combined = [...notifs, ...existingNotifs].slice(0, 10);
    localStorage.setItem("notifications", JSON.stringify(combined));
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
    localStorage.removeItem("notifications");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Notifications</h3>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                  Mark all read
                </Button>
              )}
              {notifications.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearAll}>
                  Clear
                </Button>
              )}
            </div>
          </div>

          <ScrollArea className="h-96">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No notifications</p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map((notif) => {
                  const Icon = notif.icon;
                  return (
                    <div
                      key={notif.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        notif.read ? "bg-background" : "bg-muted/50"
                      }`}
                      onClick={() => markAsRead(notif.id)}
                    >
                      <div className="flex items-start gap-3">
                        <Icon
                          className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                            notif.variant === "success"
                              ? "text-green-500"
                              : notif.variant === "warning"
                              ? "text-yellow-500"
                              : notif.variant === "destructive"
                              ? "text-red-500"
                              : "text-blue-500"
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{notif.title}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {notif.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(notif.timestamp, "MMM d, h:mm a")}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
};
