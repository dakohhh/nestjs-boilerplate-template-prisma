interface NotificationTemplate {
  title: string;
  body: (params: Record<string, any>) => string;
  data?: (params: Record<string, any>) => Record<string, any>;
}

interface NotificationTemplates {
  [key: string]: NotificationTemplate;
}

export enum NotificationTypes {
  VIBE_REQUEST_ACCEPTED = "VIBE_REQUEST_ACCEPTED",
  VIBE_REQUEST_RECEIVED = "VIBE_REQUEST_RECEIVED",
  VIBE_REQUEST_DECLINED = "VIBE_REQUEST_DECLINED",
  NEW_CRAVING_MATCH = "NEW_CRAVING_MATCH",
  CRAVING_EXPIRED = "CRAVING_EXPIRED",
  NEW_MESSAGE = "NEW_MESSAGE",
  MEETING_CONFIRMATION = "MEETING_CONFIRMATION",
  MEETING_NOT_ACCEPTED = "MEETING_NOTACCEPTED",
}

export const NOTIFICATIONS: NotificationTemplates = {
  MEETING_CONFIRMATION: {
    title: "Agree to Meet",
    body: ({ userName }) => `${userName} confirmed agreeing to meet you. You’ll lose your vibe if you don’t agree quickly`,
    data: ({ roomId }) => ({
      type: "meeting",
      roomId,
    }),
  },

  MEETING_NOT_ACCEPTED: {
    title: "Meeting Not Accepted yet",
    body: ({ userName }) => `You’ll lose ${userName} if you don’t agree to meet within the hour.`,
    data: ({ roomId }) => ({
      type: "meeting",
      roomId,
    }),
  },

  VIBE_REQUEST_ACCEPTED: {
    title: "Vibe Request",
    body: ({ userName }) => `${userName} has accepted your vibe request`,
  },

  VIBE_REQUEST_RECEIVED: {
    title: "New Vibe Request",
    body: ({ userName }) => `${userName} sent you a vibe request`,
  },

  VIBE_REQUEST_DECLINED: {
    title: "Vibe Request",
    body: ({ userName }) => `${userName} has declined your vibe request`,
  },

  NEW_CRAVING_MATCH: {
    title: "New Craving Match",
    body: ({ cravingName }) => `Someone else is craving ${cravingName} too!`,
  },

  CRAVING_EXPIRED: {
    title: "Craving Expired",
    body: ({ cravingName }) => `Your craving would expire in an hour hurry and catch a new vibe`,
  },

  NEW_MESSAGE: {
    title: "New Message",
    body: ({ message, isVoice }) => (isVoice ? "Voice message received" : message || "Image received"),
    data: ({ roomId }) => ({
      type: "chat",
      roomId,
    }),
  },
};

// Helper function to get notification options
// TODO: Improve on username logic for optional title here
export const getNotificationOptions = (templateKey: keyof typeof NOTIFICATIONS, params: Record<string, any>, optionalTitle?: string, badge?: number) => {
  const template = NOTIFICATIONS[templateKey];
  if (!template) {
    throw new Error(`Notification template "${templateKey}" not found`);
  }

  return {
    title: optionalTitle ?? template.title,
    body: template.body(params),
    ...(template.data && { data: template.data(params) }),
    badge: badge ?? 1,
  };
};
