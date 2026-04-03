export interface User {
  name: string;
  avatar: string;
}

export const USERS: Record<string, User> = {
  cyan: { name: "彤彤", avatar: "/avatar-cyan.jpg" },
  ryan: { name: "可可", avatar: "/avatar-ryan.jpg" },
  parent: { name: "家长", avatar: "/avatar-parent.jpg" },
};

export function getUserName(id: string): string {
  return USERS[id]?.name || id;
}

export function getUserAvatar(id: string): string {
  return USERS[id]?.avatar || "/avatar-parent.jpg";
}

export function getAllUsers(): Array<{ id: string } & User> {
  return Object.entries(USERS).map(([id, user]) => ({ id, ...user }));
}
