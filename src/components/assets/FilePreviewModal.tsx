import React, { useState, useEffect } from 'react';
import { Asset } from '../../types/index.js';
import { 
  X, 
  Download, 
  Share2, 
  FileText, 
  Image as ImageIcon, 
  Calendar, 
  HardDrive, 
  User as UserIcon, 
  Eye, 
  Tag
} from 'lucide-react';

interface FilePreviewModalProps {
  asset: Asset | null;
  onClose: () => void;
  onShare?: (asset: Asset) => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({ asset, onClose, onShare }) => {
  const [textContent, setTextContent] = useState<string | null>(null);
  const [loadingText, setLoadingText] = useState(false);

  useEffect(() => {
    if (!asset) {
      setTextContent(null);
      return;
    }

    const isTextual = asset.mimeType.startsWith('text/') || 
      asset.mimeType.includes('json') || 
      asset.mimeType.includes('markdown') ||
      asset.originalName.endsWith('.txt') ||
      asset.originalName.endsWith('.json') ||
      asset.originalName.endsWith('.md');

    if (isTextual) {
      setLoadingText(true);
      fetch(`/api/assets/${asset._id}/preview`, { credentials: 'include' })
        .then(res => res.text())
        .then(txt => {
          setTextContent(txt);
          setLoadingText(false);
        })
        .catch(() => {
          setTextContent('Unable to load file preview content.');
          setLoadingText(false);
        });
    } else {
      setTextContent(null);
      setLoadingText(false);
    }
  }, [asset]);

  if (!asset) return null;

  const isImage = asset.mimeType.startsWith('image/');
  const isPdf = asset.mimeType === 'application/pdf';
  const isAudio = asset.mimeType.startsWith('audio/');
  const isVideo = asset.mimeType.startsWith('video/');

  const handleDownload = () => {
    window.location.href = `/api/assets/${asset._id}/download`;
  };

  const formattedSize = (asset.size / (1024 * 1024)).toFixed(2) + ' MB';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div 
        onClick={e => e.stopPropagation()} 
        className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-3 truncate pr-4">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0">
              {isImage ? <ImageIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            </div>
            <div className="truncate">
              <h3 className="text-base font-semibold text-white truncate">{asset.title}</h3>
              <p className="text-xs text-slate-400 font-mono truncate">{asset.originalName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Viewer */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Main Visual Display */}
          <div className="flex items-center justify-center min-h-[300px] max-h-[500px] bg-slate-950/60 rounded-xl border border-slate-800/80 overflow-hidden p-4">
            {isImage && (
              <img
                src={`/api/assets/${asset._id}/preview`}
                alt={asset.title}
                className="max-h-[460px] max-w-full object-contain rounded-lg shadow-md"
              />
            )}

            {isPdf && (
              <iframe
                src={`/api/assets/${asset._id}/preview#toolbar=0`}
                title={asset.title}
                className="w-full h-[460px] rounded-lg border-0 bg-white"
              />
            )}

            {isAudio && (
              <div className="flex flex-col items-center gap-4 py-8">
                <div className="text-sm text-slate-300 font-medium">{asset.title}</div>
                <audio controls className="w-80">
                  <source src={`/api/assets/${asset._id}/preview`} type={asset.mimeType} />
                  Your browser does not support audio playback.
                </audio>
              </div>
            )}

            {isVideo && (
              <video controls className="max-h-[460px] max-w-full rounded-lg">
                <source src={`/api/assets/${asset._id}/preview`} type={asset.mimeType} />
              </video>
            )}

            {textContent !== null && (
              <pre className="w-full h-full max-h-[440px] overflow-auto p-4 bg-slate-900 font-mono text-xs text-slate-300 leading-relaxed rounded-lg">
                {loadingText ? 'Decrypting and streaming buffer...' : textContent}
              </pre>
            )}

            {!isImage && !isPdf && !isAudio && !isVideo && textContent === null && (
              <div className="flex flex-col items-center justify-center text-center p-8 space-y-3">
                <FileText className="w-16 h-16 text-slate-500 stroke-[1.25]" />
                <div className="text-sm font-medium text-slate-200">Binary Document / Media Asset</div>
                <p className="text-xs text-slate-400 max-w-sm">
                  Direct in-browser interactive preview is not available for format ({asset.mimeType}). Download the file to view locally.
                </p>
                <button
                  onClick={handleDownload}
                  className="mt-2 inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download File ({formattedSize})
                </button>
              </div>
            )}
          </div>

          {/* Asset Metadata & Security Matrix */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-800/40 border border-slate-800 text-xs">
            <div>
              <div className="text-slate-400 flex items-center gap-1.5 mb-1">
                <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                Uploaded By
              </div>
              <div className="font-medium text-white">{asset.ownerName}</div>
            </div>

            <div>
              <div className="text-slate-400 flex items-center gap-1.5 mb-1">
                <HardDrive className="w-3.5 h-3.5 text-slate-400" />
                File Size
              </div>
              <div className="font-mono text-white">{formattedSize}</div>
            </div>

            <div>
              <div className="text-slate-400 flex items-center gap-1.5 mb-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Ingestion Date
              </div>
              <div className="text-white">
                {new Date(asset.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>

            <div>
              <div className="text-slate-400 flex items-center gap-1.5 mb-1">
                <Eye className="w-3.5 h-3.5 text-slate-400" />
                Downloads &amp; Visibility
              </div>
              <div className="text-white font-medium capitalize">
                {asset.visibility} · {asset.downloadCount || 0} downloads
              </div>
            </div>
          </div>

          {/* Description & Tags */}
          {asset.description && (
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Description</div>
              <p className="text-xs text-slate-300 leading-relaxed">{asset.description}</p>
            </div>
          )}

          {asset.tags && asset.tags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap text-xs text-slate-400">
              <span className="flex items-center gap-1 font-medium text-slate-300">
                <Tag className="w-3 h-3 text-slate-400" /> Tags:
              </span>
              {asset.tags.map((t, idx) => (
                <span key={idx} className="text-slate-300 font-mono">
                  #{t}{idx < asset.tags.length - 1 ? ' ·' : ''}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/80">
          <div className="text-xs text-slate-400 font-mono">
            ID: {asset._id}
          </div>

          <div className="flex items-center gap-2">
            {onShare && (
              <button
                onClick={() => onShare(asset)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
              >
                <Share2 className="w-3.5 h-3.5 text-slate-400" />
                Share
              </button>
            )}

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download Asset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
