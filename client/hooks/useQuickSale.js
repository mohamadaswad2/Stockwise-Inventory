/**
 * useQuickSale Hook - Manages quick sale modal state
 * Provides open/close functionality and success handling
 */
import { useState, useCallback } from 'react';

const useQuickSale = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const openModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleSuccess = useCallback(() => {
    // This can be used to refresh data or trigger other actions
    // For example: refresh inventory, update dashboard, etc.
    console.log('Quick sale completed successfully');
  }, []);

  return {
    isModalOpen,
    isLoading,
    openModal,
    closeModal,
    handleSuccess,
  };
};

export default useQuickSale;
