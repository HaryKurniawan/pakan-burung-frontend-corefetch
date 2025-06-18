import React from 'react';
import '../styles/VoucherSection.css';

const VoucherSection = ({
  voucherCode,
  setVoucherCode,
  onApplyVoucher,
  onRemoveVoucher,
  appliedVoucher,
  voucherError,
  voucherSuccess,
  loading
}) => {
  return (
    <div className="voucher-section">
      <h3>Kode Voucher</h3>
      
      {!appliedVoucher ? (
        <div className="voucher-input-section">
          <div className="voucher-input-group">
            <input
              type="text"
              placeholder="Masukkan kode voucher"
              value={voucherCode}
              onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
              className="voucher-input"
              disabled={loading}
            />
            <button
              onClick={onApplyVoucher}
              disabled={loading || !voucherCode.trim()}
              className="apply-voucher-btn"
            >
              {loading ? 'Validating...' : 'Terapkan'}
            </button>
          </div>
          
          {voucherError && (
            <div className="voucher-message error">
              {voucherError}
            </div>
          )}
          
          {voucherSuccess && (
            <div className="voucher-message success">
              {voucherSuccess}
            </div>
          )}
        </div>
      ) : (
        <div className="applied-voucher">
          <div className="voucher-info">
            <div className="voucher-details">
              <h4>{appliedVoucher.nama_voucher}</h4>
              <p className="voucher-code">Kode: {appliedVoucher.kode_voucher}</p>
              <p className="voucher-description">{appliedVoucher.deskripsi}</p>
              <div className="voucher-discount-info">
                {appliedVoucher.tipe_diskon === 'PERCENTAGE' ? (
                  <span>Diskon {appliedVoucher.nilai_diskon}%</span>
                ) : (
                  <span>Diskon Rp {appliedVoucher.nilai_diskon.toLocaleString()}</span>
                )}
                {appliedVoucher.maksimal_diskon && appliedVoucher.tipe_diskon === 'PERCENTAGE' && (
                  <span className="max-discount">
                    (Maks. Rp {appliedVoucher.maksimal_diskon.toLocaleString()})
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onRemoveVoucher}
              className="remove-voucher-btn"
              title="Hapus voucher"
            >
              ✕
            </button>
          </div>
          
          <div className="voucher-message success">
            ✅ Voucher berhasil diterapkan!
          </div>
        </div>
      )}
    </div>
  );
};

export default VoucherSection;