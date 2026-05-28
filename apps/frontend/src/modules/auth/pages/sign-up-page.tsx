import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { AuthLayout } from '../components/auth-layout';
import { useAuth } from '../hooks/use-auth';

export function SignUpPage() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (password !== confirmPassword) {
      setError('Hasła nie są identyczne.');
      return;
    }

    setIsSubmitting(true);
    const { error: signUpError } = await signUp(email, password);
    setIsSubmitting(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    setInfo('Konto utworzone. Jeśli wymagane jest potwierdzenie e-mail, sprawdź skrzynkę.');
    navigate('/dashboard', { replace: true });
  }

  return (
    <AuthLayout title="Utwórz konto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jan@firma.pl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Hasło</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Powtórz hasło</Label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        {info && (
          <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground" role="status">
            {info}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Tworzenie konta…' : 'Zarejestruj się'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Masz już konto?{' '}
        <Link to="/signin" className="font-medium text-foreground underline-offset-4 hover:underline">
          Zaloguj się
        </Link>
      </p>
    </AuthLayout>
  );
}
