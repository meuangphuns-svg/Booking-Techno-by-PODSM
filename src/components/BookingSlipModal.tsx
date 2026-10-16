import React from 'react';
import { Booking } from '../types';
import { X, Printer, CheckCircle, Clock, Calendar, QrCode, Building, Phone, User } from 'lucide-react';

interface BookingSlipModalProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
}

export const BookingSlipModal: React.FC<BookingSlipModalProps> = ({ booking, isOpen, onClose }) => {
  if (!isOpen || !booking) return null;

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = (status: Booking['status']) => {
    switch (status) {
      case 'pending':
        return { text: 'รออนุมัติจากเจ้าหน้าที่', bg: 'bg-amber-100 text-amber-800 border-amber-300' };
      case 'approved':
        return { text: 'อนุมัติแล้ว (กำลังยืมใช้งาน)', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
      case 'returned':
        return { text: 'คืนอุปกรณ์เรียบร้อยแล้ว', bg: 'bg-blue-100 text-blue-800 border-blue-300' };
      case 'rejected':
        return { text: 'คำขอถูกปฏิเสธ', bg: 'bg-red-100 text-red-800 border-red-300' };
      case 'cancelled':
        return { text: 'ยกเลิกคำขอแล้ว', bg: 'bg-gray-100 text-gray-800 border-gray-300' };
    }
  };

  const statusInfo = getStatusBadge(booking.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-orange-100 overflow-hidden my-6 print:m-0 print:shadow-none print:border-none print:w-full">
        {/* Header - hide on print or clean header */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-600 px-6 py-4 text-white flex justify-between items-center print:hidden">
          <div className="flex items-center space-x-2">
            <QrCode className="w-5 h-5 text-white" />
            <h3 className="font-bold text-base">ใบคำขอยืมอุปกรณ์ / หลักฐานการยืม</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white flex items-center gap-1.5 text-xs font-medium transition cursor-pointer"
              title="พิมพ์เอกสาร"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/20 transition text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Slip Content */}
        <div className="p-6 space-y-4 print:p-8 text-gray-800" id="printable-slip">
          {/* Organization Title */}
          <div className="text-center border-b pb-4 border-dashed border-gray-300">
            <span className="text-xs font-semibold text-orange-600 uppercase tracking-widest block">
              SILPAKORN UNIVERSITY • FACULTY OF EDUCATION
            </span>
            <h2 className="text-lg font-bold text-gray-900 mt-0.5">
              ภาควิชาเทคโนโลยีการศึกษา คณะศึกษาศาสตร์
            </h2>
            <p className="text-xs text-gray-500">
              ใบขอยืมและส่งคืนอุปกรณ์สื่อการเรียนรู้ดิจิทัล (Borrowing Voucher)
            </p>
            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold uppercase tracking-wider font-mono bg-gray-50 border-gray-200">
              <span>REF:</span> #{booking.id.slice(0, 8).toUpperCase()}
            </div>
          </div>

          {/* Status Banner */}
          <div className={`p-3 rounded-xl border text-center font-bold text-xs uppercase tracking-wide ${statusInfo.bg}`}>
            {statusInfo.text}
          </div>

          {/* Equipment Info */}
          <div className="bg-orange-50/40 p-4 rounded-2xl border border-orange-100 space-y-2">
            <div className="text-[11px] font-bold text-orange-700 uppercase tracking-wider">
              ข้อมูลอุปกรณ์ที่ขอยืม
            </div>
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold text-gray-900 text-sm">{booking.equipmentName}</p>
                <p className="text-xs text-gray-500 font-mono">รหัสอุปกรณ์: {booking.equipmentCode}</p>
              </div>
              <div className="text-right">
                <span className="inline-block bg-orange-500 text-white font-bold text-xs px-2.5 py-1 rounded-lg">
                  {booking.quantity} ชิ้น
                </span>
              </div>
            </div>
          </div>

          {/* Borrower details */}
          <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <div>
              <span className="text-gray-400 block text-[10px]">ผู้ขอยืม:</span>
              <p className="font-semibold text-gray-900 flex items-center gap-1 mt-0.5">
                <User className="w-3.5 h-3.5 text-orange-500" />
                <span>{booking.userName}</span>
              </p>
            </div>
            <div>
              <span className="text-gray-400 block text-[10px]">รหัสนักศึกษา/สังกัด:</span>
              <p className="font-semibold text-gray-900 mt-0.5">
                {booking.userStudentId || '-'}
              </p>
            </div>
            <div>
              <span className="text-gray-400 block text-[10px]">เบอร์โทรศัพท์:</span>
              <p className="font-semibold text-gray-900 flex items-center gap-1 mt-0.5">
                <Phone className="w-3.5 h-3.5 text-orange-500" />
                <span>{booking.userPhone}</span>
              </p>
            </div>
            <div>
              <span className="text-gray-400 block text-[10px]">อีเมล:</span>
              <p className="font-semibold text-gray-900 truncate mt-0.5">
                {booking.userEmail}
              </p>
            </div>
          </div>

          {/* Loan Dates */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl border border-gray-200">
              <span className="text-gray-400 block text-[10px]">วันที่เริ่มยืม:</span>
              <p className="font-bold text-gray-800 flex items-center gap-1 mt-1">
                <Calendar className="w-3.5 h-3.5 text-orange-500" />
                <span>{booking.borrowDate}</span>
              </p>
            </div>
            <div className="p-3 rounded-xl border border-gray-200">
              <span className="text-gray-400 block text-[10px]">กำหนดส่งคืน:</span>
              <p className="font-bold text-orange-700 flex items-center gap-1 mt-1">
                <Clock className="w-3.5 h-3.5 text-orange-500" />
                <span>{booking.returnDate}</span>
              </p>
            </div>
          </div>

          {/* Purpose & Course */}
          <div className="text-xs space-y-1">
            <span className="text-gray-400 block text-[10px]">วัตถุประสงค์ในการยืม:</span>
            <p className="bg-gray-50 p-2.5 rounded-xl border border-gray-100 text-gray-700 font-medium">
              {booking.purpose}
            </p>
            {booking.courseOrProject && (
              <p className="text-gray-500 text-[11px]">
                วิชา/โครงงาน: <span className="font-semibold text-gray-700">{booking.courseOrProject}</span>
              </p>
            )}
          </div>

          {/* Admin notes if any */}
          {booking.adminNotes && (
            <div className="text-xs p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900">
              <span className="font-bold block mb-0.5">หมายเหตุจากเจ้าหน้าที่:</span>
              <p>{booking.adminNotes}</p>
            </div>
          )}

          {/* Signature lines for physical pickup and return */}
          <div className="pt-4 border-t border-dashed border-gray-300 grid grid-cols-2 gap-4 text-center text-[11px] text-gray-600">
            <div className="space-y-6">
              <div className="h-10 border-b border-gray-300 mx-4" />
              <div>
                <p className="font-semibold text-gray-800">ลงชื่อผู้ยืม</p>
                <p className="text-[10px] text-gray-400">( {booking.userName} )</p>
              </div>
            </div>
            <div className="space-y-6">
              <div className="h-10 border-b border-gray-300 mx-4" />
              <div>
                <p className="font-semibold text-gray-800">ลงชื่อเจ้าหน้าที่ผู้จ่ายอุปกรณ์</p>
                <p className="text-[10px] text-gray-400">( เจ้าหน้าที่ห้อง Lab )</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end space-x-2 print:hidden">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-xl transition font-medium"
          >
            ปิด
          </button>
          <button
            onClick={handlePrint}
            className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-5 py-2 rounded-xl shadow-md text-sm transition flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>พิมพ์ใบยืม</span>
          </button>
        </div>
      </div>
    </div>
  );
};
