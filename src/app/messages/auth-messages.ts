export const authErrorMessages = {
  'auth/user-not-found': 'Can’t find a user with that email. Please register first.',
  'auth/wrong-password': 'Invalid email or password. Please try again.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/invalid-credential': 'Invalid credentials. Please check your login details.',
  'auth/email-already-in-use': 'This email is already registered. Please log in instead.',
  'auth/weak-password': 'Password is too weak. Use at least 6 characters.',
  'auth/too-many-requests': 'Too many attempts. Please try again later.',
  default: 'Unable to sign in. Please check your email and password and try again.'
} as const;

export function getAuthErrorMessage(code?: string): string {
  return authErrorMessages[code as keyof typeof authErrorMessages] ?? authErrorMessages.default;
}
