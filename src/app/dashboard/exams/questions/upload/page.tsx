'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, Upload, CheckCircle, AlertCircle, FileSpreadsheet } from 'lucide-react';

type UploadResult = {
  success: boolean;
  imported?: number;
  failed?: number;
  errors?: Array<{ row: number; error: string }>;
};

export default function BulkUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);

  async function downloadTemplate() {
    try {
      const res = await fetch('/api/exams/questions/template');
      if (!res.ok) throw new Error('Failed to download template');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'question-bank-template.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Download failed');
    }
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/exams/questions/bulk-upload', {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      setResult(data);
    } catch (e: any) {
      setResult({ success: false, errors: [{ row: 0, error: e.message }] });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6">
      <Link
        href="/dashboard/exams/questions"
        className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Question Bank
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">Bulk Upload Questions</h1>
      <p className="text-sm text-gray-500 mb-6">Upload multiple questions from an Excel spreadsheet</p>

      {/* Step 1: Download template */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold flex-shrink-0">
            1
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-1">Download the Excel template</h3>
            <p className="text-sm text-gray-600 mb-3">
              Get the template file with example questions and required columns.
            </p>
            <button
              onClick={downloadTemplate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              Download template.xlsx
            </button>
          </div>
        </div>
      </div>

      {/* Step 2: Fill in */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold flex-shrink-0">
            2
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-1">Fill in your questions</h3>
            <p className="text-sm text-gray-600 mb-3">
              Open the template in Excel and add your questions row-by-row. Save it as .xlsx.
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs">
              <div className="font-semibold text-gray-700 mb-2">Required columns:</div>
              <ul className="space-y-1 text-gray-600">
                <li>• <strong>subject</strong> — must match a subject in your school (e.g. "Mathematics")</li>
                <li>• <strong>class_level</strong> — e.g. "JSS 1", "SS 2"</li>
                <li>• <strong>question_type</strong> — mcq_single, mcq_multiple, true_false, fill_blank, short_answer, essay</li>
                <li>• <strong>difficulty</strong> — easy, medium, hard</li>
                <li>• <strong>question_text</strong> — the question itself</li>
                <li>• <strong>option_a, option_b, option_c, option_d</strong> — for MCQ questions</li>
                <li>• <strong>correct_answer</strong> — for MCQ: A, B, C, D. For T/F: TRUE or FALSE. For Fill: accepted answers separated by ";"</li>
                <li>• <strong>topic</strong> — optional, e.g. "Algebra"</li>
                <li>• <strong>points</strong> — default 1</li>
                <li>• <strong>explanation</strong> — optional, shown after submit</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Step 3: Upload */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold flex-shrink-0">
            3
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-1">Upload your file</h3>
            <p className="text-sm text-gray-600 mb-3">
              We'll validate each row and add valid questions to your bank.
            </p>

            <label className="flex items-center justify-center gap-3 p-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors">
              <FileSpreadsheet className="w-8 h-8 text-gray-400" />
              <div>
                <div className="font-medium text-gray-700 text-sm">
                  {file ? file.name : 'Click to select .xlsx file'}
                </div>
                {file && (
                  <div className="text-xs text-gray-500 mt-0.5">
                    {(file.size / 1024).toFixed(1)} KB
                  </div>
                )}
              </div>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => {
                  setFile(e.target.files?.[0] || null);
                  setResult(null);
                }}
                className="hidden"
              />
            </label>

            {file && (
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="mt-3 inline-flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                {uploading ? 'Uploading...' : 'Upload & Import'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className={`border rounded-xl p-5 ${
          result.success ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
        }`}>
          <div className="flex items-center gap-2 mb-3">
            {result.success ? (
              <>
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-green-900">Upload complete</h3>
              </>
            ) : (
              <>
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <h3 className="font-semibold text-yellow-900">Upload had issues</h3>
              </>
            )}
          </div>

          <div className="text-sm space-y-1">
            {result.imported !== undefined && (
              <div>✓ Imported: <strong>{result.imported}</strong> questions</div>
            )}
            {result.failed !== undefined && result.failed > 0 && (
              <div>✗ Failed: <strong>{result.failed}</strong> rows</div>
            )}
          </div>

          {result.errors && result.errors.length > 0 && (
            <div className="mt-3">
              <div className="text-sm font-semibold text-gray-700 mb-2">Errors:</div>
              <div className="max-h-48 overflow-auto bg-white border border-gray-200 rounded-lg text-xs">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="text-left p-2">Row</th>
                      <th className="text-left p-2">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.errors.map((e, i) => (
                      <tr key={i} className="border-t border-gray-100">
                        <td className="p-2 text-gray-600">{e.row}</td>
                        <td className="p-2 text-gray-900">{e.error}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {result.success && result.imported && result.imported > 0 && (
            <Link
              href="/dashboard/exams/questions"
              className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-green-700 hover:text-green-800"
            >
              View imported questions →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
