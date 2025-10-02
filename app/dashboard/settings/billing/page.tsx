import React from 'react';
import { requireCompanyAdmin } from '@/app/lib/auth/helpers';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/app/lib/auth/session';
import {
  CompanyModel,
  CompanyStatus,
  CompanyPlan,
} from '@/app/lib/models/Company';
import connectDB from '@/app/lib/mongodb';
import { formatDate } from '@/app/lib/utils/dateUtils';
import { redirect } from 'next/navigation';

const BillingSettings = async () => {
  // Require company admin access only
  await requireCompanyAdmin();

  // Get session to fetch company
  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions
  );

  if (!session.companyId) {
    redirect('/unauthorized');
  }

  // Fetch company from database
  await connectDB();
  const company = await CompanyModel.findById(session.companyId).lean();

  if (!company) {
    redirect('/unauthorized');
  }

  // Calculate trial days remaining
  const today = new Date();
  let daysRemaining = 0;
  let trialEndDate = 'Non défini';

  if (company.trialEndsAt) {
    const trialEnd = new Date(company.trialEndsAt);
    const diffTime = trialEnd.getTime() - today.getTime();
    daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (daysRemaining < 0) daysRemaining = 0;
    trialEndDate = formatDate(company.trialEndsAt);
  }

  // Determine status badge
  const isTrial = company.status === CompanyStatus.Trial;
  const isActive = company.status === CompanyStatus.Active;
  const isSuspended = company.status === CompanyStatus.Suspended;

  // Plan display names
  const planNames: Record<CompanyPlan, string> = {
    [CompanyPlan.Starter]: 'Starter',
    [CompanyPlan.Professional]: 'Professionnel',
    [CompanyPlan.Enterprise]: 'Entreprise',
  };

  return (
    <div className='flex flex-col gap-8'>
      <h1 className='text-3xl font-bold'>Facturation et abonnement</h1>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        {/* Trial Period Banner - Only show if in trial */}
        {isTrial && (
          <div className='card bg-info/10 border border-info/20'>
            <div className='card-body'>
              <h3 className='card-title text-info'>
                🎁 Période d&apos;essai de 30 jours
              </h3>
              <p className='text-sm'>
                Profitez de toutes les fonctionnalités de StaffPicks
                gratuitement pendant 30 jours. Aucune carte bancaire requise.
              </p>
              <div className='mt-4'>
                <div className='flex justify-between items-center'>
                  <span className='text-sm font-semibold'>
                    Jours restants :
                  </span>
                  <span
                    className={`badge badge-lg ${
                      daysRemaining > 7
                        ? 'badge-info'
                        : daysRemaining > 3
                        ? 'badge-warning'
                        : 'badge-error'
                    }`}
                  >
                    {daysRemaining} {daysRemaining > 1 ? 'jours' : 'jour'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Subscription Information */}
        <div className='card bg-base-200 shadow-xl'>
          <div className='card-body'>
            <h2 className='card-title'>Informations d&apos;abonnement</h2>
            <div className='divider'></div>
            <div className='space-y-4'>
              <div className='flex justify-between'>
                <span className='font-semibold'>Plan actuel :</span>
                <span>
                  {isTrial
                    ? 'Essai gratuit'
                    : planNames[company.plan as CompanyPlan]}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='font-semibold'>Statut :</span>
                <span
                  className={`badge ${
                    isActive
                      ? 'badge-success'
                      : isSuspended
                      ? 'badge-error'
                      : 'badge-info'
                  }`}
                >
                  {isActive && 'Actif'}
                  {isSuspended && 'Suspendu'}
                  {isTrial && 'Essai'}
                </span>
              </div>
              {isTrial && (
                <div className='flex justify-between'>
                  <span className='font-semibold'>Fin de l&apos;essai :</span>
                  <span>{trialEndDate}</span>
                </div>
              )}
              {company.billingEmail && (
                <div className='flex justify-between'>
                  <span className='font-semibold'>Email de facturation :</span>
                  <span>{company.billingEmail}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className='card bg-base-200 shadow-xl'>
          <div className='card-body'>
            <h2 className='card-title'>Moyen de paiement</h2>
            <div className='divider'></div>
            <p className='text-sm text-base-content/70 mb-4'>
              Aucun moyen de paiement enregistré. Vous pourrez en ajouter un
              avant la fin de votre période d&apos;essai.
            </p>
            <button className='btn btn-primary w-fit' disabled>
              Ajouter une carte bancaire (Bientôt disponible)
            </button>
          </div>
        </div>

        {/* Billing History */}
        <div className='card bg-base-200 shadow-xl'>
          <div className='card-body'>
            <h2 className='card-title'>Historique de facturation</h2>
            <div className='divider'></div>
            <p className='text-sm text-base-content/70'>
              Aucune facture disponible pour le moment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingSettings;
