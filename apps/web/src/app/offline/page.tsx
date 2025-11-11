export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center px-4">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          You're Offline
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8">
          It looks like you've lost your internet connection. Some features may be limited.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
