const MAP: Record<string, string> = {
  'Too many requests. Please try again later.': 'Demasiados intentos. Esperá un momento e intentá de nuevo.',
  'Invalid credentials': 'Email o contraseña incorrectos.',
  'Account is locked': 'Tu cuenta está bloqueada. Contactá al soporte.',
};

export function mapGuardError(error?: string): string | undefined {
  return error ? (MAP[error] ?? error) : undefined;
}

export async function parseGuardError(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json();
    return mapGuardError(data.error) || fallback;
  } catch {
    return fallback;
  }
}
