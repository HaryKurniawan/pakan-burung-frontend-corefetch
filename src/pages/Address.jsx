import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { addressAPI } from '../services/api';
import './Address.css'; // Import CSS file
import Header from '../components/common/Header'

const Address = () => {
  const { currentUser } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [loading, setLoading] = useState(false);

  // Form data
  const [provinsiList, setProvinsiList] = useState([]);
  const [kotaKabupatenList, setKotaKabupatenList] = useState([]);
  const [kecamatanList, setKecamatanList] = useState([]);
  
  const [formData, setFormData] = useState({
    provinsi_id: '',
    kota_kabupaten_id: '',
    kecamatan_id: '',
    nama_desa: '',
    rt: '',
    rw: '',
    alamat_lengkap: '',
    catatan_alamat: ''
  });

  useEffect(() => {
    loadAddresses();
    loadProvinsi();
  }, []);

  const loadAddresses = async () => {
    try {
      const data = await addressAPI.getUserAddresses(currentUser.id);
      setAddresses(data);
    } catch (error) {
      console.error('Error loading addresses:', error);
    }
  };

  const loadProvinsi = async () => {
    try {
      const data = await addressAPI.getProvinsi();
      setProvinsiList(data);
    } catch (error) {
      console.error('Error loading provinsi:', error);
    }
  };

  // Fungsi untuk memuat kota/kabupaten berdasarkan provinsi
  const loadKotaKabupaten = async (provinsiId) => {
    if (!provinsiId) {
      setKotaKabupatenList([]);
      return;
    }
    try {
      const data = await addressAPI.getKotaKabupaten(provinsiId);
      setKotaKabupatenList(data);
    } catch (error) {
      console.error('Error loading kota/kabupaten:', error);
      setKotaKabupatenList([]);
    }
  };

  // Fungsi untuk memuat kecamatan berdasarkan kota/kabupaten
  const loadKecamatan = async (kotaKabupatenId) => {
    if (!kotaKabupatenId) {
      setKecamatanList([]);
      return;
    }
    try {
      const data = await addressAPI.getKecamatan(kotaKabupatenId);
      setKecamatanList(data);
    } catch (error) {
      console.error('Error loading kecamatan:', error);
      setKecamatanList([]);
    }
  };

  const handleProvinsiChange = async (provinsiId) => {
    setFormData({ 
      ...formData, 
      provinsi_id: provinsiId, 
      kota_kabupaten_id: '', 
      kecamatan_id: '' 
    });
    
    // Reset dan load kota/kabupaten
    setKecamatanList([]);
    await loadKotaKabupaten(provinsiId);
  };

  const handleKotaKabupatenChange = async (kotaKabupatenId) => {
    setFormData({ 
      ...formData, 
      kota_kabupaten_id: kotaKabupatenId, 
      kecamatan_id: '' 
    });
    
    // Load kecamatan
    await loadKecamatan(kotaKabupatenId);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const addressData = {
        ...formData,
        user_id: currentUser.id,
        rt: parseInt(formData.rt),
        rw: parseInt(formData.rw)
      };

      if (editingAddress) {
        await addressAPI.updateAddress(editingAddress.id, addressData);
      } else {
        await addressAPI.addAddress(addressData);
      }

      setShowAddressForm(false);
      setEditingAddress(null);
      resetForm();
      await loadAddresses();
    } catch (error) {
      console.error('Error saving address:', error);
      alert('Gagal menyimpan alamat');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      provinsi_id: '',
      kota_kabupaten_id: '',
      kecamatan_id: '',
      nama_desa: '',
      rt: '',
      rw: '',
      alamat_lengkap: '',
      catatan_alamat: ''
    });
    setKotaKabupatenList([]);
    setKecamatanList([]);
  };

  const handleEdit = async (address) => {
    setEditingAddress(address);
    
    // Set form data
    setFormData({
      provinsi_id: address.provinsi_id,
      kota_kabupaten_id: address.kota_kabupaten_id,
      kecamatan_id: address.kecamatan_id,
      nama_desa: address.nama_desa,
      rt: address.rt,
      rw: address.rw,
      alamat_lengkap: address.alamat_lengkap,
      catatan_alamat: address.catatan_alamat || ''
    });

    // Load dropdown data secara berurutan
    try {
      // Load kota/kabupaten berdasarkan provinsi yang dipilih
      if (address.provinsi_id) {
        await loadKotaKabupaten(address.provinsi_id);
      }
      
      // Load kecamatan berdasarkan kota/kabupaten yang dipilih
      if (address.kota_kabupaten_id) {
        await loadKecamatan(address.kota_kabupaten_id);
      }
    } catch (error) {
      console.error('Error loading dropdown data for edit:', error);
    }
    
    setShowAddressForm(true);
  };

  const handleDelete = async (addressId) => {
    if (window.confirm('Yakin ingin menghapus alamat ini?')) {
      try {
        await addressAPI.deleteAddress(addressId);
        await loadAddresses();
      } catch (error) {
        console.error('Error deleting address:', error);
        alert('Gagal menghapus alamat');
      }
    }
  };

  const handleSetPrimary = async (addressId) => {
    try {
      await addressAPI.setPrimaryAddress(currentUser.id, addressId);
      await loadAddresses();
    } catch (error) {
      console.error('Error setting primary address:', error);
      alert('Gagal mengatur alamat utama');
    }
  };

  const handleCancelForm = () => {
    setShowAddressForm(false);
    setEditingAddress(null);
    resetForm();
  };

  return (
    <div className="contain-address">
       <Header title="Alamat" />
      <button 
        className="button add-address-button" 
        onClick={() => {
          setShowAddressForm(true);
          setEditingAddress(null);
          resetForm();
        }}
      >
        Tambah Alamat Baru
      </button>

      {addresses.length > 0 ? (
        <div>
          <h3 className="address-list-header">Daftar Alamat ({addresses.length})</h3>
          {addresses.map(address => (
            <div key={address.id} className={`address-card ${address.is_primary ? 'primary' : ''}`}>
              {address.is_primary && (
                <span className="primary-badge">
                  ⭐ ALAMAT UTAMA
                </span>
              )}
              
              <div className="address-info">
                <h4 className="address-title"><p>Desa :{address.nama_desa}</p></h4>
                <div className="address-grid">
                  <div>
                    <strong>Kecamatan:</strong><br />
                    {address.kecamatan?.nama || 'N/A'}
                  </div>
                  <div>
                    <strong>Kota/Kabupaten:</strong><br />
                    {address.kota_kabupaten?.nama || 'N/A'}
                  </div>
                  <div>
                    <strong>Provinsi:</strong><br />
                    {address.provinsi?.nama || 'N/A'}
                  </div>
                  <div>
                    <strong>RT/RW:</strong><br />
                    {address.rt}/{address.rw}
                  </div>
                </div>
              </div>
              
              <div className="address-full">
                <strong>Alamat Lengkap:</strong><br />
                <span>{address.alamat_lengkap}</span>
              </div>
              
              {address.catatan_alamat && (
                <div className="address-notes">
                  <strong>Catatan:</strong><br />
                  <span>{address.catatan_alamat}</span>
                </div>
              )}
              
              <div className="address-actions">
                <button 
                  className="button edit-button" 
                  onClick={() => handleEdit(address)}
                >
                  ✏️ Edit
                </button>
                <button 
                  className="button delete-button" 
                  onClick={() => handleDelete(address.id)}
                >
                  🗑️ Hapus
                </button>
                {!address.is_primary && (
                  <button 
                    className="button primary-button" 
                    onClick={() => handleSetPrimary(address.id)}
                  >
                    ⭐ Jadikan Utama
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h3>📍 Belum Ada Alamat</h3>
          <p>Anda belum memiliki alamat tersimpan. Tambahkan alamat pertama Anda!</p>
        </div>
      )}

      {showAddressForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">
              {editingAddress ? '✏️ Edit Alamat' : '➕ Tambah Alamat'}
            </h3>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Provinsi:</label>
                <select 
                  className="form-select"
                  value={formData.provinsi_id} 
                  onChange={(e) => handleProvinsiChange(e.target.value)}
                  required
                >
                  <option value="">Pilih Provinsi</option>
                  {provinsiList.map(provinsi => (
                    <option key={provinsi.id} value={provinsi.id}>{provinsi.nama}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Kota/Kabupaten:</label>
                <select 
                  className="form-select"
                  value={formData.kota_kabupaten_id} 
                  onChange={(e) => handleKotaKabupatenChange(e.target.value)}
                  required
                  disabled={!formData.provinsi_id}
                >
                  <option value="">Pilih Kota/Kabupaten</option>
                  {kotaKabupatenList.map(kota => (
                    <option key={kota.id} value={kota.id}>{kota.nama}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Kecamatan:</label>
                <select 
                  className="form-select"
                  value={formData.kecamatan_id} 
                  onChange={(e) => setFormData({...formData, kecamatan_id: e.target.value})}
                  required
                  disabled={!formData.kota_kabupaten_id}
                >
                  <option value="">Pilih Kecamatan</option>
                  {kecamatanList.map(kecamatan => (
                    <option key={kecamatan.id} value={kecamatan.id}>{kecamatan.nama}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Nama Desa:</label>
                <input 
                  type="text" 
                  className="form-input"
                  value={formData.nama_desa}
                  onChange={(e) => setFormData({...formData, nama_desa: e.target.value})}
                  required
                  placeholder="Masukkan nama desa/kelurahan"
                />
              </div>

              <div className="form-row">
                <div className="form-col">
                  <label className="form-label">RT:</label>
                  <input 
                    type="number" 
                    className="form-input"
                    value={formData.rt}
                    onChange={(e) => setFormData({...formData, rt: e.target.value})}
                    required
                    min="1"
                    placeholder="001"
                  />
                </div>
                <div className="form-col">
                  <label className="form-label">RW:</label>
                  <input 
                    type="number" 
                    className="form-input"
                    value={formData.rw}
                    onChange={(e) => setFormData({...formData, rw: e.target.value})}
                    required
                    min="1"
                    placeholder="001"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Alamat Lengkap:</label>
                <textarea 
                  className="form-textarea"
                  value={formData.alamat_lengkap}
                  onChange={(e) => setFormData({...formData, alamat_lengkap: e.target.value})}
                  required
                  rows="3"
                  placeholder="Contoh: Jl. Merdeka No. 123, RT 01/RW 02"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Catatan Alamat (Opsional):</label>
                <textarea 
                  className="form-textarea"
                  value={formData.catatan_alamat}
                  onChange={(e) => setFormData({...formData, catatan_alamat: e.target.value})}
                  rows="2"
                  placeholder="Contoh: Rumah cat biru, depan warung Pak Budi"
                />
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className={`button cancel-button ${loading ? 'disabled' : ''}`}
                  onClick={handleCancelForm}
                  disabled={loading}
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className={`button submit-button ${loading ? 'disabled' : ''}`}
                  disabled={loading}
                >
                  {loading ? 'Menyimpan...' : (editingAddress ? 'Update Alamat' : 'Simpan Alamat')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Address;