'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';

/**
 * REASON: Protecting test/debug page for production
 * - This page is for development/debugging only
 * - Only accessible in development mode
 * - Prevents exposing system diagnostics in production
 */
export default function TestConnectionPage() {
  const [isDev, setIsDev] = useState(false);

  useEffect(() => {
    // Only show in development
    setIsDev(process.env.NODE_ENV === 'development');
  }, []);
  const [status, setStatus] = useState<string>('Testing...');
  const [envCheck, setEnvCheck] = useState<{
    hasUrl: boolean;
    urlStart: string;
    hasKey: boolean;
    keyStart: string;
    isKeyValidFormat: boolean;
    isUrlValidFormat: boolean;
    hasQuotes: boolean;
    isPlaceholder: boolean;
  }>({
    hasUrl: false,
    urlStart: 'MISSING',
    hasKey: false,
    keyStart: 'MISSING',
    isKeyValidFormat: false,
    isUrlValidFormat: false,
    hasQuotes: false,
    isPlaceholder: false,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        // Validation Checks
        const isKeyValidFormat = !!key && key.startsWith('eyJh');
        const isUrlValidFormat = !!url && url.includes('.supabase.co');
        const hasQuotes = (!!url && url.includes('"')) || (!!key && key.includes('"'));
        const isPlaceholder = (!!key && key.toLowerCase().includes('place')) || (!!url && url.includes('your-project'));

        setEnvCheck({
          hasUrl: !!url,
          urlStart: url ? url.substring(0, 10) + '...' : 'MISSING',
          hasKey: !!key,
          keyStart: key ? key.substring(0, 6) + '...' : 'MISSING',
          isKeyValidFormat,
          isUrlValidFormat,
          hasQuotes,
          isPlaceholder
        });

        if (!url || !key) throw new Error('Missing Environment Variables');
        if (isPlaceholder) throw new Error('You are using placeholder values, not real keys.');
        if (hasQuotes) throw new Error('Remove the quote marks (") from your .env.local file.');
        if (!isKeyValidFormat) throw new Error('Invalid API Key format. It should start with "eyJh..."');
        if (!isUrlValidFormat) throw new Error('Invalid URL format. It should end in ".supabase.co"');

        // 2. Try to create client
        const supabase = createClient();

        // 3. Try a simple fetch
        const { data, error } = await supabase.from('products').select('count').limit(1);

        if (error) throw error;

        setStatus('SUCCESS: Connected to Supabase!');
      } catch (err: unknown) {
        logger.error('Connection Error', err instanceof Error ? err : undefined);
        const message = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(message);
        setStatus('FAILED');
      }
    };

    checkConnection();
  }, []);

  // Hide in production
  if (!isDev) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">404</h1>
          <p className="text-gray-600">Page not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto font-mono">
      <h1 className="text-2xl font-bold mb-4">System Diagnostics v2</h1>
      
      <div className="bg-gray-100 p-6 rounded mb-6 space-y-2">
        <h2 className="font-bold border-b pb-2 mb-2">Key Analysis</h2>
        
        <div className="flex justify-between">
          <span>URL Format:</span>
          <span>{envCheck.isUrlValidFormat ? '✅ Valid' : '❌ Invalid'}</span>
        </div>
        
        <div className="flex justify-between">
          <span>Key Format:</span>
          <span>{envCheck.isKeyValidFormat ? '✅ Valid (Starts with eyJh)' : `❌ Invalid (Starts with "${envCheck.keyStart}")`}</span>
        </div>

        {envCheck.hasQuotes && (
          <div className="bg-yellow-100 text-yellow-800 p-2 rounded mt-2 text-sm font-bold">
            ⚠️ WARNING: Quotes detected. Delete the " marks in .env.local
          </div>
        )}

        {envCheck.isPlaceholder && (
          <div className="bg-red-100 text-red-800 p-2 rounded mt-2 text-sm font-bold">
            ❌ CRITICAL: You pasted the instructions, not the keys.
          </div>
        )}
      </div>

      <div className={`p-6 rounded text-white ${status.includes('SUCCESS') ? 'bg-green-600' : 'bg-red-600'}`}>
        <h2 className="font-bold text-xl mb-2">{status}</h2>
        {error && (
          <div className="bg-black/20 p-4 rounded font-mono text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
