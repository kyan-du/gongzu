const TOKEN_KEY = 'gongzu_token';
const USER_KEY = 'gongzu_user';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): string | null {
  return localStorage.getItem(USER_KEY);
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

export async function login(passphrase: string, userId?: string): Promise<string> {
  const res = await fetch('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ passphrase, userId }),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || '密码错误');
  }

  const data = await res.json();
  localStorage.setItem(TOKEN_KEY, data.token);
  if (userId) {
    localStorage.setItem(USER_KEY, userId);
  }
  return data.token;
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function setUser(userId: string) {
  localStorage.setItem(USER_KEY, userId);
}

export interface Question {
  id: string;
  type: 'choice' | 'blank' | 'rewrite' | 'card';
  content: any;
  answer: any;
  explanation: string;
  tags: string[];
  difficulty: number;
}
