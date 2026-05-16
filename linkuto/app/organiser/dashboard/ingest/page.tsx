'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

export default function IngestProfilePage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to ingest profile');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Startup Ingestion Engine</h1>
        <p className="mt-2 text-lg text-gray-500">
          Enter a startup website URL below. The system will use Firecrawl to deeply analyze the site, extract company info, and search for recent interactions of the CEO via Gemini.
        </p>
      </div>

      <div className="bg-white shadow sm:rounded-lg overflow-hidden border border-gray-200">
        <div className="px-4 py-5 sm:p-6">
          <form onSubmit={handleIngest} className="flex gap-4 items-end">
            <div className="flex-1">
              <label htmlFor="url" className="block text-sm font-medium text-gray-700">
                Startup Website URL
              </label>
              <div className="mt-1">
                <input
                  type="url"
                  name="url"
                  id="url"
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-3 border"
                  placeholder="https://example-startup.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Crawling & Analyzing...' : 'Ingest Startup'}
            </button>
          </form>
        </div>
      </div>

      {loading && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 bg-blue-50 border border-blue-200 rounded-md p-6 text-center"
        >
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-12 w-12 bg-blue-400 rounded-full mb-4"></div>
            <div className="h-4 bg-blue-400 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-blue-400 rounded w-1/2"></div>
            <p className="mt-4 text-blue-700 font-medium">Firecrawl is analyzing the site and Gemini is searching for the CEO...</p>
          </div>
        </motion.div>
      )}

      {error && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-8 bg-red-50 border border-red-200 rounded-md p-4"
        >
          <h3 className="text-sm font-medium text-red-800">Error</h3>
          <div className="mt-2 text-sm text-red-700">{error}</div>
        </motion.div>
      )}

      {result && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 bg-gray-900 rounded-lg shadow overflow-hidden"
        >
          <div className="px-4 py-3 bg-gray-800 border-b border-gray-700 flex justify-between items-center">
            <h3 className="text-sm font-medium text-white">Extraction Result (ID: {result.id})</h3>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Saved to Firestore
            </span>
          </div>
          <div className="p-4 overflow-x-auto">
            <pre className="text-sm text-green-400 font-mono">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          </div>
        </motion.div>
      )}
    </div>
  );
}
