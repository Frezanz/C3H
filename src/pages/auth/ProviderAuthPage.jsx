export default function ProviderAuthPage({ title = 'Authentication', description = 'Continue with C3H authentication.' }) {
  return <div className="min-h-svh flex items-center justify-center bg-background px-4"><div className="w-full max-w-[28rem] text-center"><h1 className="text-lg font-semibold">{title}</h1><p className="text-sm text-muted-foreground mt-1">{description}</p></div></div>;
}
