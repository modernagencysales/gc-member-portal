import React from 'react';
import { Copy, Check, Download, FileText, Image, Video, File, Loader2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAffiliateAssetsList } from '../../hooks/useAffiliate';

const typeIcon: Record<string, React.ElementType> = {
  swipe_copy: FileText,
  image: Image,
  video: Video,
  document: File,
};

const AffiliateAssetsPage: React.FC = () => {
  const { isDarkMode } = useTheme();
  const { assets, loading } = useAffiliateAssetsList();
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const copyText = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Marketing Assets</h2>
        <p className="text-sm mt-1 text-zinc-400">
          Swipe copy, images, and other materials to help you promote.
        </p>
      </div>

      {assets.length === 0 ? (
        <div
          className={`p-8 rounded-xl border text-center ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}
        >
          <p className="text-sm text-zinc-500">
            No marketing assets available yet. Check back soon!
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {assets.map((asset) => {
            const Icon = typeIcon[asset.assetType] || File;
            return (
              <div
                key={asset.id}
                className={`p-4 rounded-xl border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
                      <Icon className="w-4 h-4 text-violet-500" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">{asset.title}</h3>
                      {asset.description && (
                        <p className="text-xs text-zinc-500 mt-1">{asset.description}</p>
                      )}
                    </div>
                  </div>

                  {asset.contentText && (
                    <button
                      onClick={() => copyText(asset.id, asset.contentText!)}
                      className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                        isDarkMode
                          ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                          : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                      }`}
                    >
                      {copiedId === asset.id ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      {copiedId === asset.id ? 'Copied' : 'Copy'}
                    </button>
                  )}

                  {asset.fileUrl && (
                    <a
                      href={asset.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                        isDarkMode
                          ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                          : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                      }`}
                    >
                      <Download className="w-3 h-3" />
                      Download
                    </a>
                  )}
                </div>

                {asset.contentText && (
                  <div
                    className={`mt-3 p-3 rounded-lg text-xs font-mono whitespace-pre-wrap ${
                      isDarkMode ? 'bg-zinc-950 text-zinc-400' : 'bg-zinc-50 text-zinc-600'
                    }`}
                  >
                    {asset.contentText}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AffiliateAssetsPage;
