'use client';

const SignupForm = () => {
  return (
    <form action=''>
      <fieldset className='fieldset bg-base-200 border-base-300 rounded-box w-xs border p-4'>
        <legend className='fieldset-legend'>
          Informations professionelles
        </legend>

        <label className='label'>Nom de l'entreprise</label>
        <input
          type='text'
          className='input'
          placeholder="Nom de l'entreprise"
        />

        <label className='label'>Nom du magasin</label>
        <input type='email' className='input' placeholder='Nom du magasin' />
      </fieldset>

      <fieldset className='fieldset bg-base-200 border-base-300 rounded-box w-xs border p-4'>
        <legend className='fieldset-legend'>Informations personnelles</legend>

        <label className='label'>Votre nom</label>
        <input type='email' className='input' placeholder='Votre nom' />

        <label className='label'>Email</label>
        <input type='email' className='input' placeholder='Adresse email' />

        <label className='label'>Mot de passe</label>
        <input
          type='password'
          className='input validator'
          required
          placeholder='Mot de passe'
          minLength={8}
          pattern='(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}'
          title='Must be more than 8 characters, including number, lowercase letter, uppercase letter'
        />
        <p className='validator-hint'>
          Doit contenir plus de 8 caractères, incluant :
          <br />
          Au moins un chiffre
          <br />
          Au moins une lettre minuscule
          <br />
          Au moins une lettre majuscule
        </p>
      </fieldset>
      <button className='btn btn-soft btn-primary mt-4 w-full'>
        Créer mon compte
      </button>
    </form>
  );
};

export default SignupForm;
