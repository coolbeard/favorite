import React, { useState, useRef } from 'react';
import { X, Download, Upload, DatabaseBackup } from 'lucide-react';
import { Category, LinkItem, SearchConfig, AIConfig } from '../types';
import { generateBookmarkHtml, downloadHtmlFile } from '../services/exportService';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  links: LinkItem[];
  categories: Category[];
  onRestore: (links: LinkItem[], categories: Category[]) => void;
  searchConfig: SearchConfig;
  onRestoreSearchConfig: (searchConfig: SearchConfig) => void;
  aiConfig: AIConfig;
  onRestoreAIConfig: (aiConfig: AIConfig) => void;
}

const BackupModal: React.FC<BackupModalProps> = ({ 
  isOpen, onClose, links, categories, onRestore, searchConfig, onRestoreSearchConfig, aiConfig, onRestoreAIConfig 
}) => {
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [importMsg, setImportMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportHtml = () => {
    const html = generateBookmarkHtml(links, categories);
    const dateStr = new Date().toISOString().split('T')[0];
    downloadHtmlFile(html, `bookmarks_${dateStr}.html`);
  };

  const handleExportJson = async () => {
    setImportStatus('idle');
    setImportMsg('正在读取并打包本地图标...');

    // 也获取 config key 以备份所有设置
    let appConfig = null;
    try {
      const res = await fetch('/api/storage?key=config');
      if (res.ok) {
        const data = await res.json();
        if (data.value) appConfig = JSON.parse(data.value);
      }
    } catch (e) { /* ignore */ }

    const data = { links, categories, searchConfig, aiConfig, config: appConfig };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cloudnav_backup.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setImportStatus('success');
    setImportMsg('本地备份导出成功！');
  };

  const handleImportJson = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);

        // 验证备份文件基本结构
        if (!Array.isArray(data.links) || !Array.isArray(data.categories)) {
          setImportStatus('error');
          setImportMsg('无效的备份文件：缺少 links 或 categories 数据。');
          return;
        }

        if (!confirm(
          `确定要导入备份吗？\n\n` +
          `将导入 ${data.links.length} 个链接和 ${data.categories.length} 个分类。\n\n` +
          `⚠️ 这将覆盖当前的所有本地数据。`
        )) {
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
        }

        setImportStatus('idle');
        setImportMsg('正在准备导入...');
        
        onRestore(data.links, data.categories);

        // 恢复搜索配置
        if (data.searchConfig) {
          onRestoreSearchConfig(data.searchConfig);
        }

        // 恢复 AI 配置
        if (data.aiConfig) {
          onRestoreAIConfig(data.aiConfig);
        }

        setImportStatus('success');
        setImportMsg(`导入成功！已恢复 ${data.links.length} 个链接、${data.categories.length} 个分类以及关联的自定义图标。`);
      } catch (err) {
        setImportStatus('error');
        setImportMsg('解析备份文件失败，请确认文件格式正确。');
      }

      // 重置 file input
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    reader.readAsText(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-700 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold dark:text-white flex items-center gap-2">
            <DatabaseBackup className="text-blue-500" /> 备份与恢复
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
            <X className="w-5 h-5 dark:text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">

             {/* Section 3: Local Export & Import */}
             <section className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/30 flex items-center justify-between">
                    <div>
                        <h5 className="text-sm font-medium dark:text-slate-200">导出 HTML 书签文件</h5>
                        <p className="text-xs text-slate-500 mt-1">兼容 Chrome, Edge, Firefox 导入格式，保留目录结构</p>
                    </div>
                    <button 
                        onClick={handleExportHtml}
                        className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 hover:border-blue-500 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                        <Download size={16} /> 导出 HTML
                    </button>
                </div>
                
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/30 flex items-center justify-between">
                    <div>
                        <h5 className="text-sm font-medium dark:text-slate-200">导出 cloudnav_backup.json 文件</h5>
                        <p className="text-xs text-slate-500 mt-1">将数据备份至本地，便于数据迁移</p>
                    </div>
                    <button 
                        onClick={handleExportJson}
                        className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 hover:border-blue-500 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                        <Download size={16} /> 导出 JSON
                    </button>
                </div>

                <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 flex items-center justify-between">
                    <div>
                        <h5 className="text-sm font-medium dark:text-slate-200">导入 cloudnav_backup.json 恢复</h5>
                        <p className="text-xs text-slate-500 mt-1">从本地 JSON 备份文件恢复所有数据（链接、分类、搜索和 AI 配置）</p>
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        onChange={handleImportJson}
                        className="hidden"
                        id="import-json-input"
                    />
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shrink-0"
                    >
                        <Upload size={16} /> 导入 JSON
                    </button>
                </div>

                {importStatus !== 'idle' && (
                    <div className={`text-sm text-center p-2 rounded ${
                        importStatus === 'success' ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400' : 
                        'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                    }`}>
                        {importMsg}
                    </div>
                )}
             </section>

        </div>
      </div>
    </div>
  );
};

export default BackupModal;