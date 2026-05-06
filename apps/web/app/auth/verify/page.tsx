import { Loader2 } from "lucide-react";

export default function AuthLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <div className="text-center space-y-6">
        <Loader2 className="w-16 h-16 animate-spin mx-auto text-black" />
        
        <div className="space-y-2">
          <h1 className="text-2xl font-black uppercase tracking-tighter">Verifying Access</h1>
          <p className="text-sm font-mono text-gray-500 uppercase tracking-widest">
            Securing your session...
          </p>
        </div>

        <div className="w-64 h-1 bg-gray-100 mx-auto overflow-hidden rounded-full">
          <div className="w-1/2 h-full bg-black animate-[shimmer_1s_infinite_linear]" />
        </div>
      </div>
    </div>
  );
}
