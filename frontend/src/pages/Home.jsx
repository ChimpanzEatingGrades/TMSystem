function Home() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 className="text-4xl font-bold mb-4">Welcome to the Task Management System</h1>
      <p className="text-lg mb-8">Your tasks, organized and managed efficiently.</p>
      <a
        href="/login"
        className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-300"
      >
        Get Started
      </a>
    </div>
  );
}

export default Home;
// This is the Home page component for the Task Management System.