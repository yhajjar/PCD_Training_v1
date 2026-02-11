export function normalizeSsoEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function deriveDeterministicPocketBasePassword(email: string): Promise<string> {
  const normalizedEmail = normalizeSsoEmail(email);
  const encoder = new TextEncoder();
  const data = encoder.encode(`training-hub-pb-auth:${normalizedEmail}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return `${hashArray.map((byte) => byte.toString(16).padStart(2, '0')).join('')}Zz9A`;
}
