import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Equipment, Booking } from '../types';
import { collection, addDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { 
  X, 
  Calendar, 
  Package, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Phone, 
  FileText, 
  Info,
  Sparkles
} from 'lucide-react';

interface BookingModalProps {
  equipment: Equipment | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (bookingId: string) => void;
  onOpenProfile: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  equipment,
  isOpen,
  onClose,
  onSuccess,
  onOpenProfile,
}) => {
  const { currentUser, userProfile, signInWithGoogle } = useAuth();

  // Tomorrow as default borrow date
  const todayStr = new Date().toISOString().split('T')[0];
  const nextDay = new Date();
  nextDay.setDate(nextDay.getDate() + 1);
  const tomorrowStr = nextDay.toISOString().split('T')[0];

  const returnDefault = new Date();
  returnDefault.setDate(returnDefault.getDate() + 3);
  const defaultReturnStr = returnDefault.toISOString().split('T')[0];

  const [quantity, setQuantity] = useState<number>(1);
  const [borrowDate, setBorrowDate] = useState<string>(tomorrowStr);
  const [returnDate, setReturnDate] = useState<string>(defaultReturnStr);
  const [purpose, setPurpose] = useState<string>('');
  const [courseOrProject, setCourseOrProject] = useState<string>('');
  const [borrowerPhone, setBorrowerPhone] = useState<string>(userProfile?.phone || '');
  const [borrowerStudentId, setBorrowerStudentId] = useState<string>(userProfile?.studentId || '');
  const [borrowerDepartment, setBorrowerDepartment] = useState<string>(userProfile?.department || 'ภาควิชาเทคโนโลยีการศึกษา');

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [agreeTerms, setAgreeTerms] = useState<boolean>(true);

  if (!isOpen || !equipment) return null;

  // Sync state if userProfile loaded later
  if (userProfile?.phone && !borrowerPhone) {
    setBorrowerPhone(userProfile.phone);
  }
  if (userProfile?.studentId && !borrowerStudentId) {
    setBorrowerStudentId(userProfile.studentId);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!currentUser) {
      setErrorMessage('กรุณาเข้าสู่ระบบด้วย Google ก่อนส่งคำขอยืมอุปกรณ์');
      return;
    }

    if (quantity <= 0 || quantity > equipment.availableQuantity) {
      setErrorMessage(`จำนวนที่ยืมต้องอยู่ระหว่าง 1 ถึง ${equipment.availableQuantity} ชิ้น`);
      return;
    }

    if (!borrowDate || !returnDate) {
      setErrorMessage('กรุณาระบุวันที่ต้องการยืมและวันที่กำหนดส่งคืน');
      return;
    }

    if (new Date(returnDate) < new Date(borrowDate)) {
      setErrorMessage('วันที่ส่งคืนต้องไม่ก่อนวันที่เริ่มยืม');
      return;
    }

    if (!purpose.trim()) {
      setErrorMessage('กรุณาระบุวัตถุประสงค์ในการยืมใช้งานอุปกรณ์');
      return;
    }

    if (!borrowerPhone.trim()) {
      setErrorMessage('กรุณาระบุเบอร์โทรศัพท์ที่ติดต่อได้');
      return;
    }

    if (!agreeTerms) {
      setErrorMessage('กรุณายอมรับเงื่อนไขและข้อตกลงการยืมอุปกรณ์');
      return;
    }

    setSubmitting(true);
    const path = 'bookings';
    try {
      const newBooking: Omit<Booking, 'id'> = {
        equipmentId: equipment.id,
        equipmentName: equipment.name,
        equipmentCode: equipment.code,
        equipmentImageUrl: equipment.imageUrl,
        userId: currentUser.uid,
        userName: userProfile?.displayName || currentUser.displayName || 'ผู้ใช้งาน',
        userEmail: currentUser.email || '',
        userPhone: borrowerPhone.trim(),
        userStudentId: borrowerStudentId.trim(),
        userDepartment: borrowerDepartment.trim(),
        quantity,
        borrowDate,
        returnDate,
        purpose: purpose.trim(),
        courseOrProject: courseOrProject.trim(),
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const docRef = await addDoc(collection(db, path), newBooking);
      onSuccess(docRef.id);
      onClose();
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, OperationType.CREATE, path);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-orange-100 overflow-hidden my-8 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 px-6 py-4 text-white flex justify-between items-center flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">แบบฟอร์มขอจองอุปกรณ์</h3>
              <p className="text-xs text-orange-100">ภาควิชาเทคโนโลยีการศึกษา</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 transition text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Selected Equipment Snapshot */}
          <div className="flex items-center gap-4 p-3.5 bg-orange-50/70 rounded-2xl border border-orange-200/70">
            <img
              src={equipment.imageUrl}
              alt={equipment.name}
              className="w-20 h-20 rounded-xl object-cover bg-gray-100 flex-shrink-0 border border-orange-200"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=400&q=80';
              }}
            />
            <div className="flex-1 min-w-0">
              <span className="text-[11px] font-semibold tracking-wider text-orange-700 bg-orange-200/80 px-2 py-0.5 rounded-md">
                {equipment.code}
              </span>
              <h4 className="font-bold text-gray-900 text-sm mt-1 leading-snug line-clamp-2">
                {equipment.name}
              </h4>
              <p className="text-xs text-gray-500 mt-0.5">{equipment.category}</p>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  คงเหลือว่าง: {equipment.availableQuantity} ชิ้น
                </span>
                <span className="text-[11px] text-gray-500">
                  (ทั้งหมด {equipment.totalQuantity} ชิ้น)
                </span>
              </div>
            </div>
          </div>

          {!currentUser ? (
            <div className="p-6 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-300 space-y-3">
              <Info className="w-8 h-8 text-orange-500 mx-auto" />
              <p className="text-sm text-gray-700 font-medium">
                กรุณาเข้าสู่ระบบด้วย Google Account ก่อนดำเนินการจองอุปกรณ์
              </p>
              <button
                type="button"
                onClick={signInWithGoogle}
                className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-5 py-2.5 rounded-xl shadow-md text-sm transition"
              >
                เข้าสู่ระบบด้วย Google
              </button>
            </div>
          ) : (
            <form id="booking-form" onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Quantity selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-orange-500" />
                    <span>จำนวนที่ต้องการยืม (ชิ้น) <span className="text-red-500">*</span></span>
                  </span>
                  <span className="text-[11px] text-gray-500 font-normal">
                    สูงสุด {equipment.availableQuantity} ชิ้น
                  </span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    max={equipment.availableQuantity}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Math.min(equipment.availableQuantity, parseInt(e.target.value) || 1)))}
                    className="w-32 px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 text-sm font-semibold outline-none"
                    required
                  />
                  <div className="flex gap-1.5">
                    {[1, 2, 3].filter(n => n <= equipment.availableQuantity).map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setQuantity(n)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                          quantity === n
                            ? 'bg-orange-500 text-white border-orange-500'
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-orange-50'
                        }`}
                      >
                        {n} ชิ้น
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-orange-500" />
                    <span>วันที่ต้องการยืม <span className="text-red-500">*</span></span>
                  </label>
                  <input
                    type="date"
                    min={todayStr}
                    value={borrowDate}
                    onChange={(e) => setBorrowDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 text-sm outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-orange-500" />
                    <span>วันที่กำหนดส่งคืน <span className="text-red-500">*</span></span>
                  </label>
                  <input
                    type="date"
                    min={borrowDate || todayStr}
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 text-sm outline-none"
                    required
                  />
                </div>
              </div>

              {/* Purpose & Course */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-orange-500" />
                  <span>วัตถุประสงค์ในการยืมใช้งาน <span className="text-red-500">*</span></span>
                </label>
                <textarea
                  rows={2}
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="เช่น ผลิตสื่อการสอนวิชาคอมพิวเตอร์เพื่อการศึกษา, ถ่ายทำภาพยนตร์สั้นภาควิชา, บันทึกภาพกิจกรรมค่าย EdTech"
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 text-sm outline-none resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  ชื่อวิชา / โครงงาน / อาจารย์ที่ปรึกษา (ถ้ามี)
                </label>
                <input
                  type="text"
                  value={courseOrProject}
                  onChange={(e) => setCourseOrProject(e.target.value)}
                  placeholder="เช่น ED-304 การผลิตสื่อวีดิทัศน์ทางการศึกษา (อ.ดร. ...)"
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 text-sm outline-none"
                />
              </div>

              {/* Borrower contact snapshot */}
              <div className="p-3.5 bg-orange-50/50 rounded-2xl border border-orange-100 space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-orange-600" />
                    <span>ข้อมูลผู้ขอยืม (สำหรับเจ้าหน้าที่ติดต่อ)</span>
                  </span>
                  <button
                    type="button"
                    onClick={onOpenProfile}
                    className="text-[11px] text-orange-600 hover:underline"
                  >
                    แก้ไขโปรไฟล์
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[11px] text-gray-500 block mb-0.5">เบอร์โทรติดต่อ <span className="text-red-500">*</span></label>
                    <input
                      type="tel"
                      value={borrowerPhone}
                      onChange={(e) => setBorrowerPhone(e.target.value)}
                      placeholder="08X-XXX-XXXX"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-gray-500 block mb-0.5">รหัสนักศึกษา / สังกัด</label>
                    <input
                      type="text"
                      value={borrowerStudentId}
                      onChange={(e) => setBorrowerStudentId(e.target.value)}
                      placeholder="รหัสนักศึกษา"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Terms checkbox */}
              <div className="pt-1">
                <label className="flex items-start gap-2.5 text-xs text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 rounded text-orange-500 focus:ring-orange-400"
                  />
                  <span>
                    ข้าพเจ้ายินดีดูแลรักษาอุปกรณ์ให้อยู่ในสภาพสมบูรณ์ พร้อมส่งคืนตามวันและเวลาที่กำหนด และหากเกิดความเสียหายหรือสูญหาย ยินดีรับผิดชอบตามระเบียบของภาควิชาเทคโนโลยีการศึกษา
                  </span>
                </label>
              </div>
            </form>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end space-x-2 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-200 rounded-xl transition font-medium"
          >
            ยกเลิก
          </button>
          {currentUser && (
            <button
              type="submit"
              form="booking-form"
              disabled={submitting || equipment.availableQuantity <= 0}
              className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-6 py-2.5 rounded-xl shadow-md shadow-orange-500/20 text-sm transition disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>กำลังส่งคำขอ...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>ยืนยันการส่งคำขอจอง</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
