import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="max-w-md w-full liquid-glass p-8 text-center space-y-6 animate-fade-up">
                <div className="text-6xl">🔍</div>
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Page Not Found</h2>
                <p className="text-slate-500 text-sm leading-relaxed">
                    The page you are looking for doesn&apos;t exist or has been moved.
                </p>
                <Link href="/dashboard" className="inline-block liquid-btn liquid-btn-primary px-8 py-3">
                    Back to Dashboard
                </Link>
            </div>
        </div>
    );
}
