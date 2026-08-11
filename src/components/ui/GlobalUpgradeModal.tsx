import React, { useEffect, useState } from 'react';
import { UpgradeModal } from './UpgradeModal';

export const GlobalUpgradeModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [feature, setFeature] = useState('');

  useEffect(() => {
    const handleUpgradeRequired = (event: Event) => {
      const customEvent = event as CustomEvent;
      setMessage(customEvent.detail?.message || '');
      setFeature(customEvent.detail?.feature || '');
      setIsOpen(true);
    };

    window.addEventListener('requires_upgrade', handleUpgradeRequired);
    return () => {
      window.removeEventListener('requires_upgrade', handleUpgradeRequired);
    };
  }, []);

  return (
    <UpgradeModal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      description={message}
    />
  );
};
