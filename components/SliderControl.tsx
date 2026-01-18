
import React from 'react';

interface SliderControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (val: number) => void;
  onReset: () => void;
}

// 使用 memo 防止无关重绘
const SliderControl: React.FC<SliderControlProps> = React.memo(({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange,
  onReset,
}) => {
  const percentage = ((value - min) / (max - min)) * 100;
  
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <label className="text-xs font-bold text-gray-900">{label}</label>
        <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded border border-gray-100">
          {value}{unit}
        </span>
      </div>
      
      <div className="relative group flex items-center h-6">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-1 bg-gray-100 rounded-full appearance-none cursor-pointer outline-none transition-all"
          style={{ 
            background: `linear-gradient(to right, #2563EB 0%, #2563EB ${percentage}%, #F3F4F6 ${percentage}%, #F3F4F6 100%)`
          }}
        />
        <style>{`
          input[type=range]::-webkit-slider-thumb {
            -webkit-appearance: none;
            height: 14px;
            width: 14px;
            border-radius: 50%;
            background: #ffffff;
            border: 2px solid #2563EB;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            cursor: pointer;
            transition: transform 0.1s ease;
          }
          input[type=range]::-webkit-slider-thumb:hover {
            transform: scale(1.2);
          }
        `}</style>
      </div>
    </div>
  );
});

export default SliderControl;
