import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

const UnauthorizedPage = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar />
      <div className="flex-grow flex items-center justify-center text-center px-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-4xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-700 mb-6">
            You do not have the necessary permissions to view this page.
          </p>
          <Link to="/" className="text-blue-600 hover:underline">Go to Home Page</Link>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;