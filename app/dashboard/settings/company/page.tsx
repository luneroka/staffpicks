import React from 'react';
import { requireCompanyAdmin } from '@/app/lib/auth/helpers';
import CompanySettingsForm from '@/app/components/forms/CompanySettingsForm';
import Link from 'next/link';
import { FaArrowLeft } from 'react-icons/fa';
import { FaBuildingColumns } from 'react-icons/fa6';
import connectDB from '@/app/lib/mongodb';
import { CompanyModel } from '@/app/lib/models/Company';
import { Types } from 'mongoose';
import BackButton from '@/app/components/BackButton';

const CompanySettings = async () => {
  // Require company admin access only
  const session = await requireCompanyAdmin();

  await connectDB();

  // Fetch the company data
  const company = await CompanyModel.findOne({
    _id: new Types.ObjectId(session.companyId!),
  }).lean();

  if (!company) {
    throw new Error('Company not found');
  }

  return (
    <div className='flex flex-col'>
      <BackButton className='mb-4 w-fit' />

      <div className='flex flex-col gap-8'>
        <div>
          <h1 className='text-3xl font-bold flex items-center gap-2'>
            <FaBuildingColumns />
            {company.name}
          </h1>
          <p className='text-base-content/60 mt-2'>
            Gérez les paramètres et les utilisateurs assignés à cette
            organisation
          </p>
        </div>

        <div className='card bg-base-200 shadow-xl'>
          <div className='card-body'>
            <CompanySettingsForm />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanySettings;
