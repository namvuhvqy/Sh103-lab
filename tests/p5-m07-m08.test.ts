import { describe, expect, it } from "vitest";
import {
  getNotifications,
  getUnreadNotificationCount,
  getAdminAnnouncements,
  getIncidentCategories,
  getIncidents,
  getIncidentDetail,
} from "@/lib/p5/queries";
import {
  markNotificationReadAction,
  markAllNotificationsReadAction,
  publishAnnouncementAction,
  deactivateAnnouncementAction,
  createIncidentAction,
  transitionIncidentAction,
} from "@/lib/p5/actions";

describe("P5 Queries and Actions (M07 & M08)", () => {
  it("exports expected notification queries and actions", () => {
    expect(typeof getNotifications).toBe("function");
    expect(typeof getUnreadNotificationCount).toBe("function");
    expect(typeof markNotificationReadAction).toBe("function");
    expect(typeof markAllNotificationsReadAction).toBe("function");
  });

  it("exports expected admin announcement queries and actions", () => {
    expect(typeof getAdminAnnouncements).toBe("function");
    expect(typeof publishAnnouncementAction).toBe("function");
    expect(typeof deactivateAnnouncementAction).toBe("function");
  });

  it("exports expected incident queries and actions", () => {
    expect(typeof getIncidentCategories).toBe("function");
    expect(typeof getIncidents).toBe("function");
    expect(typeof getIncidentDetail).toBe("function");
    expect(typeof createIncidentAction).toBe("function");
    expect(typeof transitionIncidentAction).toBe("function");
  });
});
