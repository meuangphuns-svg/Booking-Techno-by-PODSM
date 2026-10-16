import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, User, Phone, IdCard, Building2, CheckCircle2 } from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, userProfile, updateProfile, isAdmin } = useAuth();
  const [displayName, setDisplayName] = useState(userProfile?.displayName || currentUser?.displayName || '');
  const [studentId, setStudentId] = useState(userProfile?.studentId || '');
  const [department, setDepartment] = useState(userProfile?.department || 'ภาควิชาเทคโนโลยีการศึกษา คณะศึกษาศาสตร์');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!displayName.trim()) {
      setErrorMsg('กรุณากรอกชื่อ-นามสกุล');
      return;
    }
    if (!phone.trim()) {
      setErrorMsg('กรุณากรอกเบอร์โทรศัพท์ที่ติดต่อได้สะดวก');
      return;
    }

    setSaving(true);
    try {
      await updateProfile({
        displayName: displayName.trim(),
        studentId: studentId.trim(),
        department: department.trim(),
        phone: phone.trim(),
      });
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-orange-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-5 text-white flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">โปรไฟล์ผู้ใช้งาน</h3>
              <p className="text-xs text-orange-100">ข้อมูลติดต่อสำหรับการยืม-คืนอุปกรณ์</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 transition text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {savedSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-3 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>บันทึกข้อมูลส่วนตัวเรียบร้อยแล้ว</span>
            </div>
          )}

          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">
              {errorMsg}
            </div>
          )}

          {/* User Avatar & Email Readonly */}
          <div className="flex items-center space-x-3 p-3 bg-orange-50/60 rounded-2xl border border-orange-100">
            {currentUser?.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt="Profile"
                className="w-12 h-12 rounded-full ring-2 ring-orange-300 object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-orange-200 text-orange-800 font-bold flex items-center justify-center text-lg">
                {currentUser?.displayName?.[0] || 'U'}
              </div>
            )}
            <div className="overflow-hidden">
              <p className="text-xs text-gray-500">อีเมล Google ที่ใช้เข้าสู่ระบบ</p>
              <p className="text-sm font-semibold text-gray-800 truncate">{currentUser?.email}</p>
              <span className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-medium ${
                isAdmin ? 'bg-orange-600 text-white' : 'bg-orange-200 text-orange-800'
              }`}>
                {isAdmin ? '🛡️ ผู้ดูแลระบบ (Admin)' : '🎓 ผู้ใช้งานทั่วไป'}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-orange-500" />
              <span>ชื่อ - นามสกุล <span className="text-red-500">*</span></span>
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 text-sm outline-none transition"
              placeholder="ระบุชื่อจริง นามสกุล"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
              <IdCard className="w-3.5 h-3.5 text-orange-500" />
              <span>รหัสนักศึกษา / รหัสอาจารย์หรือเจ้าหน้าที่</span>
            </label>
            <input
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 text-sm outline-none transition"
              placeholder="เช่น 6401234567 หรือ รหัสประจำตัวอาจารย์"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-orange-500" />
              <span>เบอร์โทรศัพท์ที่ติดต่อได้ <span className="text-red-500">*</span></span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 text-sm outline-none transition"
              placeholder="เช่น 081-234-5678 (สำหรับแจ้งเตือนและติดต่อเวลารับอุปกรณ์)"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-orange-500" />
              <span>ภาควิชา / สาขา / สังกัด</span>
            </label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 text-sm outline-none transition"
              placeholder="เช่น เทคโนโลยีการศึกษา ปี 3 หรือ ภาควิชา..."
            />
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition font-medium"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-5 py-2.5 rounded-xl shadow-md shadow-orange-500/20 text-sm transition disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
