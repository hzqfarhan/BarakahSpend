import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[#0a0a1a]">
            <div className="max-w-md w-full glass-card p-8 text-center space-y-6">
                <div className="text-6xl">🔍</div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Page Not Found</h2>
                <p className="text-slate-400 text-sm leading-relaxed">
                    The page you are looking for doesn&apos;t exist or has been moved.
                </p>
                <Button asChild className="w-full bg-gradient-to-r from-purple-600 to-purple-500">
                    <Link href="/dashboard">Back to Dashboard</Link>
                </Button>
            </div>
        </div>
    );
}
