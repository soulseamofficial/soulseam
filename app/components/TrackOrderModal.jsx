"use client";
import React from "react";
import GlobalModal from "./GlobalModal";

const TrackOrderModal = ({ isOpen, onClose }) => {
  const handleContinue = () => {
    // Open Delhivery tracking in a new tab
    window.open("https://www.delhivery.com/tracking", "_blank");
    // Close modal
    onClose();
  };

  return (
    <GlobalModal
      isOpen={isOpen}
      onClose={onClose}
      title="Track Your Order"
      message="We are redirecting you to the Delhivery tracking website to track your order."
      primaryButtonText="Yes, Continue"
      secondaryButtonText="Cancel"
      onPrimaryAction={handleContinue}
    />
  );
};

export default TrackOrderModal;
