export default function PendingApprovalPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 p-8 text-center shadow-xl">
        <h1 className="text-xl font-semibold text-slate-50">
          Account pending approval
        </h1>

        <p className="mt-3 text-sm text-slate-400">
          Your account has been created, but approval is required before you can
          access Tradelyse.
        </p>

        <p className="mt-4 text-xs text-slate-500">
          You will receive an email once your account is approved.
        </p>
      </div>
    </main>
  );
}