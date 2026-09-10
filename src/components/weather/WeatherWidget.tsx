'use client';
import { WeatherData } from '@/types';
import { Cloud, Sun, CloudRain, Droplets, Wind } from 'lucide-react';

const WeatherIcon = ({ icon, size = 20 }: { icon: string; size?: number }) => {
  if (icon === 'rain') return <CloudRain size={size} className="text-blue-400" />;
  if (icon === 'sun') return <Sun size={size} className="text-amber-400" />;
  return <Cloud size={size} className="text-white/50" />;
};

export default function WeatherWidget({ weather }: { weather: WeatherData }) {
  return (
    <div className="bg-[#0a0e1a] border border-blue-500/20 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-white text-sm font-semibold">{weather.city}</h3>
          <p className="text-white/40 text-xs">{weather.descriptionKiny}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-white">{weather.temp}°</div>
          <Sun size={20} className="text-amber-400 ml-auto" />
        </div>
      </div>
      <div className="flex gap-3 mb-3 text-xs text-white/50">
        <span className="flex items-center gap-1"><Droplets size={11} />{weather.humidity}%</span>
        <span className="flex items-center gap-1"><Wind size={11} />{weather.wind} km/h</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {weather.forecast.map((day, i) => (
          <div key={i} className="bg-white/5 rounded-lg p-2 text-center">
            <div className="text-white/40 text-[10px] mb-1">{day.dayKiny}</div>
            <WeatherIcon icon={day.icon} size={16} />
            <div className="text-white text-xs font-medium mt-1">{day.high}°</div>
            <div className="text-white/30 text-[10px]">{day.low}°</div>
          </div>
        ))}
      </div>
    </div>
  );
}
