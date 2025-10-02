'use client';

import { useRouter } from 'next/navigation';
import { FaArrowLeft } from 'react-icons/fa';

interface BackButtonProps {
  className?: string;
  label?: string;
}

const BackButton = ({ className = '', label = 'Retour' }: BackButtonProps) => {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  return (
    <button onClick={handleBack} className={`btn btn-ghost ${className}`}>
      <FaArrowLeft />
      {label}
    </button>
  );
};

export default BackButton;
