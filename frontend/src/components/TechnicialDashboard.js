import React from "react";

function TechnicialDashboard() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-green-400 to-blue-500">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md text-center">
        <h1 className="text-3xl font-bold mb-4 text-gray-800">Technicial Dashboard</h1>
        <p className="text-lg text-gray-700 mb-6">
          Welcome, Technicine! You have successfully logged in.
        </p>
        {/* Add more dashboard features here */}
      </div>
    </div>
  );
}

export default TechnicialDashboard;