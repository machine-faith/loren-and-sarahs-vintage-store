'use client';

import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  ArrowRight,
  Download,
  Info
} from 'lucide-react';
import { parseContactsCsv, ParsedContactPreview } from '@/lib/csv-importer';

interface ImportViewProps {
  onImportContacts: (contacts: ParsedContactPreview[]) => Promise<number>;
  setActiveTab: (tab: string) => void;
}

export default function ImportView({ onImportContacts, setActiveTab }: ImportViewProps) {
  const [csvText, setCsvText] = useState('');
  const [previewContacts, setPreviewContacts] = useState<ParsedContactPreview[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccessCount, setImportSuccessCount] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setCsvText(text);
        processCsv(text);
      }
    };
    reader.readAsText(file);
  };

  const processCsv = (text: string) => {
    const res = parseContactsCsv(text);
    setPreviewContacts(res.contacts);
    setParseErrors(res.errors);
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setCsvText(text);
    if (text.trim()) {
      processCsv(text);
    } else {
      setPreviewContacts([]);
      setParseErrors([]);
    }
  };

  const handleConfirmImport = async () => {
    if (previewContacts.length === 0) return;
    setIsImporting(true);
    try {
      const count = await onImportContacts(previewContacts);
      setImportSuccessCount(count);
      setPreviewContacts([]);
      setCsvText('');
    } catch (e: any) {
      alert(`Import error: ${e.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const loadHubSpotSample = () => {
    const sample = `First Name,Last Name,Email,Associated Company,City,Country/Region,Lead Status,Notes
Gilles,Peterson,gilles@worldwidefm.net,Worldwide FM,London,United Kingdom,New,"Eclectic broadcaster, loves fresh international releases"
Lauren,Laverne,lauren.laverne@bbc.co.uk,BBC Radio 6 Music,London,United Kingdom,New,"Morning show host, champion of indie rock & art pop"
Simon,Raymonde,simon@bellareunion.com,Bella Union,Brighton,United Kingdom,New,"Label boss & Amazing Radio DJ"
Hugo,Cassavetti,hugo@telerama.fr,Télérama,Paris,France,New,"Senior music critic"
Christian,Morin,christian@tsfjazz.com,TSF Jazz,Paris,France,New,"Radio programmer"
Eneko,Celayeta,info@bifmradio.com,Bi FM,Bilbao,Spain,New,"Spanish indie garage radio show"`;
    setCsvText(sample);
    processCsv(sample);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
          <Upload className="w-6 h-6 text-amber-400" />
          <span>HubSpot & CSV Contact Importer</span>
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Export your contacts from HubSpot or Excel and drop the file here. We automatically map columns into your Love Banana pipeline.
        </p>
      </div>

      {/* Success Notification */}
      {importSuccessCount !== null && (
        <div className="bg-emerald-950/60 border border-emerald-500/50 rounded-xl p-5 flex items-center justify-between shadow-lg">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <div>
              <p className="text-sm font-bold text-emerald-300">
                Successfully imported {importSuccessCount} contact{importSuccessCount === 1 ? '' : 's'}!
              </p>
              <p className="text-xs text-gray-300">
                They have been added to your media directory and are ready for pitching.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('contacts')}
            className="px-4 py-2 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-black transition"
          >
            View Contacts &rarr;
          </button>
        </div>
      )}

      {/* Drag & Drop File Zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="cursor-pointer border-2 border-dashed border-gray-700 hover:border-amber-500/70 bg-[#11141e] hover:bg-[#151926] rounded-2xl p-8 text-center transition group space-y-3"
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".csv,.txt"
          className="hidden"
        />
        <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mx-auto text-amber-400 group-hover:scale-110 transition">
          <FileSpreadsheet className="w-6 h-6" />
        </div>
        <div>
          <span className="text-sm font-bold text-white group-hover:text-amber-400 transition">
            Click to upload HubSpot or CSV export
          </span>
          <p className="text-xs text-gray-400 mt-0.5">
            Accepts standard CSV or HubSpot Export (.csv)
          </p>
        </div>
      </div>

      {/* HubSpot Support Info Card */}
      <div className="bg-[#0f121a] border border-gray-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-start space-x-2 text-gray-300">
          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>
            <strong>HubSpot Export Tip:</strong> In HubSpot, click <em>Contacts &rarr; Export</em>. Our importer automatically detects headers like <code>First Name</code>, <code>Last Name</code>, <code>Associated Company</code>, <code>Email</code>, and <code>Lead Status</code>.
          </span>
        </div>
        <button
          type="button"
          onClick={loadHubSpotSample}
          className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-amber-400 font-semibold shrink-0 transition"
        >
          Load Sample HubSpot File
        </button>
      </div>

      {/* Fallback Textarea */}
      <div className="bg-[#11141e] border border-gray-800/80 rounded-xl p-5 space-y-3">
        <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider">
          Or Paste Raw CSV Data Below
        </label>
        <textarea
          rows={5}
          value={csvText}
          onChange={handleTextareaChange}
          placeholder="First Name,Last Name,Email,Associated Company,City,Country&#10;Steve,Lamacq,steve@bbc.co.uk,BBC 6 Music,London,UK"
          className="w-full bg-[#0a0d13] border border-gray-700 rounded-xl p-3 text-xs text-gray-200 font-mono focus:outline-none focus:border-amber-500"
        />
      </div>

      {/* Parsed Preview Section */}
      {previewContacts.length > 0 && (
        <div className="bg-[#11141e] border border-gray-800/80 rounded-xl p-5 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Ready to Import ({previewContacts.length} Contacts Detected)</span>
              </h3>
              <p className="text-xs text-gray-400">
                Previewing mapped columns. Duplicates with existing emails will be safely updated.
              </p>
            </div>

            <button
              onClick={handleConfirmImport}
              disabled={isImporting}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20 transition flex items-center space-x-1.5"
            >
              <span>{isImporting ? 'Importing...' : `Confirm & Import ${previewContacts.length} Contacts`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Preview Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-[#0a0d13] text-gray-400 uppercase text-[10px] tracking-wider border-b border-gray-800">
                <tr>
                  <th className="p-2.5">Name</th>
                  <th className="p-2.5">Email</th>
                  <th className="p-2.5">Outlet / Station</th>
                  <th className="p-2.5">Detected Type</th>
                  <th className="p-2.5">Location</th>
                  <th className="p-2.5">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {previewContacts.slice(0, 10).map((c, idx) => (
                  <tr key={idx} className="hover:bg-[#151926]">
                    <td className="p-2.5 font-bold text-white">{c.name}</td>
                    <td className="p-2.5 text-gray-400 font-mono">{c.email}</td>
                    <td className="p-2.5 font-semibold text-gray-200">{c.outlet || '—'}</td>
                    <td className="p-2.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400">
                        {c.category}
                      </span>
                    </td>
                    <td className="p-2.5 text-gray-400">{[c.city, c.country].filter(Boolean).join(', ') || '—'}</td>
                    <td className="p-2.5 text-gray-500 truncate max-w-xs">{c.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {previewContacts.length > 10 && (
            <p className="text-center text-xs text-gray-500 pt-2">
              ...and {previewContacts.length - 10} more contacts.
            </p>
          )}
        </div>
      )}

    </div>
  );
}
