// components/checkout/VoucherCheckout.js
import React, { useState } from 'react';
import { useVouchers } from '../../hooks/useVouchers';
import './VoucherCheckout.css';

const VoucherCheckout = ({ 
  totalAmount, 
  userId, 
  onVoucherApplied, 
  onVoucherRemoved,
  appliedVoucher = null 
}) => {
  const { validateVoucher, loading } = useVouchers();
  const [voucherCode, setVoucherCode] = useState('');
  const [validationError, setValidationError] = useState('');
  const [validationSuccess, setValidationSuccess] = useState('');

  const handleApplyVoucher = async (e) => {
    e.preventDefault();
    
    if (!voucherCode.trim()) {
      setValidationError('Masukkan kode voucher');
      return;
    }

    try {
      setValidationError('');
      setValidationSuccess('');
      
      const result = await validateVoucher(voucherCode, totalAmount, userId);
      
      setValidationSuccess(`Voucher berhasil diterapkan! Diskon: ${formatCurrency(result.discountAmount)}`);
      
      // Callback to parent component
      if (onVoucherApplied) {
        onVoucherApplied(result);
      }
      
    } catch (error) {
      setValidationError(error.message);
      setValidationSuccess('');
    }
  };

  const handleRemoveVoucher = () => {
    setVoucherCode('');
    setValidationError('');
    setValidationSuccess('');
    
    if (onVoucherRemoved) {
      onVoucherRemoved();
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
  };

  return (
    <div className="voucher-checkout">
      <h4>Gunakan Voucher</h4>
      
      {!appliedVoucher ? (
        <form onSubmit={handleApplyVoucher} className="voucher-form">
          <div className="voucher-input-group">
            <input
              type="text"
              value={voucherCode}
              onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
              placeholder="Masukkan kode voucher"
              className="voucher-input"
              disabled={loading}
            />
            <button 
              type="submit" 
              className="apply-btn"
              disabled={loading || !voucherCode.trim()}
            >
              {loading ? 'Validasi...' : 'Gunakan'}
            </button>
          </div>
          
          {validationError && (
            <div className="error-message">
              {validationError}
            </div>
          )}
          
          {validationSuccess && (
            <div className="success-message">
              {validationSuccess}
            </div>
          )}
        </form>
      ) : (
        <div className="applied-voucher">
          <div className="voucher-info">
            <div className="voucher-details">
              <strong>{appliedVoucher.voucher.kode_voucher}</strong>
              <span className="voucher-name">{appliedVoucher.voucher.nama_voucher}</span>
              <div className="discount-info">
                Diskon: {formatCurrency(appliedVoucher.discountAmount)}
              </div>
            </div>
            <button 
              onClick={handleRemoveVoucher}
              className="remove-btn"
              type="button"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoucherCheckout;