
import React from 'react';

interface SidebarProps {
  sortOption: string;
  onSortChange: (option: string) => void;
  availableAirlines: string[];
  filteredAirlines: string[];
  onAirlineFilterChange: (airline: string, checked: boolean) => void;
  onSelectAllAirlines: () => void;
  onDeselectAllAirlines: () => void;
  timeFilters: string[];
  onTimeFilterChange: (timeRange: string) => void;
  stopFilters: number[];
  onStopFilterChange: (stopCount: number) => void;
}

const SidebarCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-[var(--card-bg-color)] rounded-md shadow">
        <h3 className="text-sm font-bold text-gray-800 bg-yellow-400 p-3 rounded-t-md">{title}</h3>
        <div className="p-4 space-y-3">
            {children}
        </div>
    </div>
);

const TimeFilterButton: React.FC<{ label: string; range: string; subtext: string; isActive: boolean; onClick: () => void; }> = ({ label, range, subtext, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full text-left p-2 rounded-md border text-sm transition-colors ${isActive ? 'bg-blue-100 border-blue-300 text-blue-800 font-semibold' : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'}`}
    >
        <div className="flex justify-between items-center">
            <span>{label}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">{subtext}</span>
        </div>
    </button>
);


const Sidebar: React.FC<SidebarProps> = ({ 
    sortOption, 
    onSortChange, 
    availableAirlines,
    filteredAirlines, 
    onAirlineFilterChange,
    onSelectAllAirlines,
    onDeselectAllAirlines,
    timeFilters,
    onTimeFilterChange,
    stopFilters,
    onStopFilterChange
}) => {

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      onSelectAllAirlines();
    } else {
      onDeselectAllAirlines();
    }
  };

  const areAllAirlinesSelected = availableAirlines.length > 0 && filteredAirlines.length === availableAirlines.length;

  const stopOptions = [
      { label: 'Bay thẳng', value: 0 },
      { label: '1 điểm dừng', value: 1 },
      { label: '2+ điểm dừng', value: 2 },
  ];

  return (
    <aside className="flex-shrink-0 space-y-6">
        <SidebarCard title="Sắp xếp">
            <label className="flex items-center space-x-2 cursor-pointer">
                <input type="radio" name="sort" value="price" checked={sortOption === 'price'} onChange={e => onSortChange(e.target.value)} className="form-radio text-red-600"/>
                <span className="text-sm">Giá thấp</span>
            </label>
             <label className="flex items-center space-x-2 cursor-pointer">
                <input type="radio" name="sort" value="time" checked={sortOption === 'time'} onChange={e => onSortChange(e.target.value)} className="form-radio text-red-600"/>
                <span className="text-sm">Thời gian khởi hành</span>
            </label>
             <label className="flex items-center space-x-2 cursor-pointer">
                <input type="radio" name="sort" value="airline" checked={sortOption === 'airline'} onChange={e => onSortChange(e.target.value)} className="form-radio text-red-600"/>
                <span className="text-sm">Hãng</span>
            </label>
        </SidebarCard>

        <SidebarCard title="Khai thác bởi">
            {availableAirlines.length > 1 && (
                <label className="flex items-center space-x-2 cursor-pointer border-b border-[var(--border-color)] pb-3">
                    <input 
                        type="checkbox"
                        checked={areAllAirlinesSelected}
                        onChange={handleSelectAll}
                        className="form-checkbox text-red-600 rounded"
                    />
                    <span className="text-sm font-semibold">Chọn tất cả</span>
                </label>
            )}
            {availableAirlines.map(airline => (
                 <label key={airline} className="flex items-center space-x-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={filteredAirlines.includes(airline)}
                        onChange={(e) => onAirlineFilterChange(airline, e.target.checked)}
                        className="form-checkbox text-red-600 rounded"
                     />
                    <span className="text-sm">{airline}</span>
                </label>
            ))}
        </SidebarCard>
        
        <SidebarCard title="Thời gian khởi hành">
            <div className="space-y-2">
                <TimeFilterButton label="Sáng sớm" range="early_morning" subtext="00:00-06:00" isActive={timeFilters.includes('early_morning')} onClick={() => onTimeFilterChange('early_morning')} />
                <TimeFilterButton label="Buổi sáng" range="morning" subtext="06:00-12:00" isActive={timeFilters.includes('morning')} onClick={() => onTimeFilterChange('morning')} />
                <TimeFilterButton label="Buổi chiều" range="afternoon" subtext="12:00-18:00" isActive={timeFilters.includes('afternoon')} onClick={() => onTimeFilterChange('afternoon')} />
                <TimeFilterButton label="Buổi tối" range="evening" subtext="18:00-24:00" isActive={timeFilters.includes('evening')} onClick={() => onTimeFilterChange('evening')} />
            </div>
        </SidebarCard>

        <SidebarCard title="Nối chuyến">
            <div className="space-y-2">
                {stopOptions.map(option => (
                    <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={stopFilters.includes(option.value)}
                            onChange={() => onStopFilterChange(option.value)}
                            className="form-checkbox text-red-600 rounded"
                        />
                        <span className="text-sm">{option.label}</span>
                    </label>
                ))}
            </div>
        </SidebarCard>

    </aside>
  );
};

export default Sidebar;