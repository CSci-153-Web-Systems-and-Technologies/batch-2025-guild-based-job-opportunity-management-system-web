export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md text-center bg-white/5 p-8 rounded">
        <h1 className="text-2xl font-semibold mb-2">Unauthorized</h1>
        <p className="mb-4">You do not have permission to view this page. If you believe this is an error, contact an administrator.</p>
        <a href="/" className="text-blue-500 underline">Return home</a>
      </div>
    </div>
  )
}
