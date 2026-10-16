import React from 'react';
import { Equipment } from '../types';
import { X, MapPin, Package, CheckCircle2, AlertTriangle, Layers, Calendar } from 'lucide-react';

interface EquipmentDetailModalProps {
  equipment: Equipment | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenBooking: (equipment: Equipment) => void;
}

export const EquipmentDetailModal: React.FC<EquipmentDetailModalProps> = ({
  equipment,
  isOpen,
  onClose,
  onOpenBooking,
}) => {
  if (!isOpen || !equipment) return null;

  const isAvailable = equipment.status === 'available' && equipment.availableQuantity > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-orange-100 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Image & Header */}
        <div className="relative h-64 bg-gray-900 flex-shrink-0">
          <img
            src={equipment.imageUrl}
            alt={equipment.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-xs transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-4 left-4 right-4 text-white">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-bold tracking-wider px-2.5 py-0.5 rounded-md bg-orange-500 text-white shadow-xs">
                {equipment.code}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-md bg-white/20 backdrop-blur-xs text-white">
                {equipment.category}
              </span>
            </div>
            <h3 className="text-xl font-bold leading-tight drop-shadow-sm">{equipment.name}</h3>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Status and Quantities */}
          <div className="grid grid-cols-2 gap-3">
            <div className={`p-3.5 rounded-2xl border flex items-center gap-3 ${
              isAvailable 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}>
              {isAvailable ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0" />
              )}
              <div>
                <p className="text-xs text-gray-500 font-medium">สถานะอุปกรณ์</p>
                <p className="text-sm font-bold">
                  {equipment.status === 'maintenance'
                    ? '🛠️ อยู่ระหว่างซ่อมบำรุง'
                    : isAvailable
                    ? 'พร้อมให้ยืมใช้งาน'
                    : 'ถูกยืมครบแล้วในขณะนี้'}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl border border-orange-100 bg-orange-50/50 flex items-center gap-3">
              <Package className="w-6 h-6 text-orange-600 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500 font-medium">จำนวนคงเหลือ / ทั้งหมด</p>
                <p className="text-sm font-bold text-gray-900">
                  <span className="text-orange-600 text-base">{equipment.availableQuantity}</span> / {equipment.totalQuantity} ชิ้น
                </p>
              </div>
            </div>
          </div>

          {/* Location */}
          {equipment.location && (
            <div className="flex items-start gap-3 p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
              <MapPin className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-gray-500">สถานที่จัดเก็บ / ตู้เก็บอุปกรณ์</p>
                <p className="text-sm font-medium text-gray-800">{equipment.location}</p>
              </div>
            </div>
          )}

          {/* Details / Specs */}
          <div>
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-orange-500" />
              <span>รายละเอียดและสเปคอุปกรณ์</span>
            </h4>
            <div className="text-sm text-gray-600 leading-relaxed bg-orange-50/20 p-4 rounded-2xl border border-orange-100 whitespace-pre-line">
              {equipment.details || 'ไม่มีรายละเอียดเพิ่มเติม'}
            </div>
          </div>

          {/* Borrowing rules notes */}
          <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl text-xs text-amber-800 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <span>📌 กฎเกณฑ์การยืมอุปกรณ์ภาควิชา:</span>
            </p>
            <ul className="list-disc list-inside space-y-0.5 text-amber-900/80">
              <li>โปรดตรวจเช็คอุปกรณ์เสริม (แบตเตอรี่ สายชาร์จ เคส) ร่วมกับเจ้าหน้าที่ก่อนนำออก</li>
              <li>ส่งคืนตามกำหนดเวลาเพื่อไม่ให้กระทบกับการเรียนการสอนของผู้ร่วมภาควิชาท่านอื่น</li>
            </ul>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end space-x-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm text-gray-600 hover:bg-gray-200 rounded-xl transition font-medium"
          >
            ปิด
          </button>
          <button
            onClick={() => {
              onClose();
              onOpenBooking(equipment);
            }}
            disabled={!isAvailable}
            className={`px-6 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition shadow-md ${
              isAvailable
                ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/25 cursor-pointer'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>{isAvailable ? 'ส่งคำขอยืมอุปกรณ์นี้' : 'อุปกรณ์ยังไม่ว่าง'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
