'use client';

const LoginForm = () => {
  return (
    <form action=''>
      <fieldset className='fieldset bg-base-200 border-base-300 rounded-box w-xs border p-4'>
        <legend className='fieldset-legend'>Login</legend>

        <label className='label'>Email</label>
        <input type='email' className='input' placeholder='Email' />

        <label className='label'>Mot de passe</label>
        <input type='password' className='input' placeholder='Mot de passe' />

        <button className='btn btn-soft btn-primary mt-4'>Se connecter</button>
      </fieldset>
    </form>
  );
};

export default LoginForm;
