'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

const SignupForm = () => {
  const router = useRouter();
  const [passwordValue, setPasswordValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form fields
  const [formData, setFormData] = useState({
    companyName: '',
    storeName: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Update password value for hint display
    if (name === 'password') {
      setPasswordValue(value);
    }

    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/signup', {
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

      // Success - redirect to onboarding
      router.push(data.redirectUrl || '/onboarding');
    } catch (err) {
      console.error('Signup error:', err);
      setError('Une erreur réseau est survenue. Veuillez réessayer.');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <fieldset className='fieldset bg-base-200 border-base-300 rounded-box w-xs border p-4'>
        <legend className='fieldset-legend'>
          Informations professionelles
        </legend>

        {error && (
          <div className='alert alert-error mb-4'>
            <span>{error}</span>
          </div>
        )}

        <label className='label'>Nom de l'entreprise *</label>
        <input
          type='text'
          name='companyName'
          className='input'
          placeholder="Nom de l'entreprise"
          value={formData.companyName}
          onChange={handleChange}
          required
          disabled={isSubmitting}
        />

        <label className='label'>Nom du magasin</label>
        <input
          type='text'
          name='storeName'
          className='input'
          placeholder='Nom du magasin (optionnel)'
          value={formData.storeName}
          onChange={handleChange}
          disabled={isSubmitting}
        />
      </fieldset>

      <fieldset className='fieldset bg-base-200 border-base-300 rounded-box w-xs border p-4'>
        <legend className='fieldset-legend'>Informations personnelles</legend>

        <label className='label'>Votre nom *</label>
        <input
          type='text'
          name='name'
          className='input'
          placeholder='Votre nom'
          value={formData.name}
          onChange={handleChange}
          required
          disabled={isSubmitting}
        />

        <label className='label'>Email *</label>
        <input
          type='email'
          name='email'
          className='input'
          placeholder='Adresse email'
          value={formData.email}
          onChange={handleChange}
          required
          disabled={isSubmitting}
        />

        <label className='label'>Mot de passe *</label>
        <input
          type='password'
          name='password'
          className='input validator'
          required
          placeholder='Mot de passe'
          minLength={8}
          pattern='(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}'
          title='Must be more than 8 characters, including number, lowercase letter, uppercase letter'
          value={formData.password}
          onChange={handleChange}
          disabled={isSubmitting}
        />
        <label className='label'>Confirmer mot de passe *</label>
        <input
          type='password'
          name='confirmPassword'
          className='input'
          required
          placeholder='Confirmer mot de passe'
          value={formData.confirmPassword}
          onChange={handleChange}
          disabled={isSubmitting}
        />
        {passwordValue.length > 0 && (
          <p className='validator-hint'>
            Doit contenir plus de 8 caractères, incluant :
            <br />
            Au moins un chiffre
            <br />
            Au moins une lettre minuscule
            <br />
            Au moins une lettre majuscule
          </p>
        )}
      </fieldset>
      <button
        type='submit'
        className='btn btn-soft btn-primary mt-4 w-full'
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Création en cours...' : 'Créer mon compte'}
      </button>
    </form>
  );
};

export default SignupForm;
