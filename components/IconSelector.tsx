import React, { useState } from 'react';
import { Search } from 'lucide-react';
import Icon, { IconName } from './Icon';

interface IconSelectorProps {
  onSelectIcon: (iconName: string) => void;
}

// 常用图标列表，可以根据需要扩展
const commonIcons: IconName[] = [
  'star', 'heart', 'bookmark', 'flag', 'tag', 'hash',
  'home', 'user', 'users', 'settings', 'bell', 'mail',
  'calendar', 'clock', 'map-pin', 'phone', 'camera', 'image',
  'folder', 'file', 'archive', 'trash-2', 'download', 'upload',
  'search', 'filter', 'menu', 'more-vertical', 'chevron-down', 'chevron-up',
  'plus', 'minus', 'x', 'check', 'alert-circle', 'info',
  'edit', 'copy', 'share', 'link', 'external-link', 'lock',
  'code', 'terminal', 'database', 'server', 'cloud', 'wifi',
  'shopping-cart', 'credit-card', 'package', 'truck', 'store', 'tag',
  'music', 'play', 'pause', 'volume-2', 'headphones', 'mic',
  'book', 'book-open', 'file-text', 'pen-tool', 'highlighter', 'type',
  'layout', 'grid', 'list', 'columns', 'sidebar', 'layers',
  'circle', 'square', 'triangle', 'hexagon', 'zap', 'target',
  'rocket', 'plane', 'car', 'bike', 'ship', 'train',
  'moon', 'sun', 'cloud-rain', 'cloud-snow', 'wind', 'thermometer',
  'message-square', 'message-circle', 'send', 'at-sign', 'percent'
];

const IconSelector: React.FC<IconSelectorProps> = ({ 
  onSelectIcon
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<IconName>('folder');

  // 获取当前目标图标
  const getCurrentIcon = () => {
    return selectedIcon;
  };

  // 过滤图标
  const filteredIcons = commonIcons.filter(icon => 
    icon.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (iconName: IconName) => {
    setSelectedIcon(iconName);
  };

  const handleConfirm = () => {
    onSelectIcon(selectedIcon);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="搜索图标..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            autoFocus
          />
        </div>
      </div>

      {/* Current Selection */}
      <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-600 dark:text-slate-400">当前选择:</span>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600">
            <Icon name={selectedIcon} size={18} />
            <span className="text-sm font-medium dark:text-slate-200">{selectedIcon}</span>
          </div>
        </div>
      </div>

      {/* Icons Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredIcons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-slate-400">
            <Search size={40} className="mb-3 opacity-50" />
            <p>没有找到匹配的图标</p>
          </div>
        ) : (
          <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
            {filteredIcons.map(iconName => (
              <button
                key={iconName}
                onClick={() => handleSelect(iconName)}
                className={`p-3 rounded-lg flex flex-col items-center justify-center gap-1 transition-all ${
                  selectedIcon === iconName 
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500' 
                    : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'
                }`}
                title={iconName}
              >
                <Icon name={iconName} size={20} />
                <span className="text-xs truncate w-full text-center">{iconName}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            提示：也可以直接输入 emoji 作为图标
          </span>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            确定选择
          </button>
        </div>
      </div>
    </div>
  );
};

export default IconSelector;