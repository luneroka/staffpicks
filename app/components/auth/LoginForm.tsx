'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const LoginForm = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form fields
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Une erreur est survenue.');
        setIsSubmitting(false);
        return;
      }

      // Success - redirect to dashboard and refresh to update server components
      router.push(data.redirectUrl || '/dashboard');
      router.refresh(); // Force refresh to update NavBar and other server components
    } catch (err) {
      console.error('Login error:', err);
      setError('Une erreur réseau est survenue. Veuillez réessayer.');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <fieldset className='fieldset bg-base-200 border-base-300 rounded-box w-xs border p-4'>
        <legend className='fieldset-legend'>Connexion</legend>

        {error && (
          <div className='alert alert-error mb-4'>
            <span>{error}</span>
          </div>
        )}

        <label className='label'>Email</label>
        <input
          type='email'
          name='email'
          className='input'
          placeholder='Email'
          value={formData.email}
          onChange={handleChange}
          required
          disabled={isSubmitting}
          autoComplete='email'
        />

        <label className='label'>Mot de passe</label>
        <input
          type='password'
          name='password'
          className='input'
          placeholder='Mot de passe'
          value={formData.password}
          onChange={handleChange}
          required
          disabled={isSubmitting}
          autoComplete='current-password'
        />

        <button
          type='submit'
          className='btn btn-soft btn-primary mt-4 w-full'
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Connexion...' : 'Se connecter'}
        </button>

        <div className='mt-4 text-center text-sm'>
          <span className='text-base-content/70'>Pas encore de compte ? </span>
          <Link href='/signup' className='link link-primary'>
            S'inscrire
          </Link>
        </div>
      </fieldset>
    </form>
  );
};

export default LoginForm;
