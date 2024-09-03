import React from 'react';
import AccountabilityFeed from './components/AccountabilityFeed';

export default async function Home() {

  const fetchUrl = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:3000' 
  : process.env.NEXT_PUBLIC_BASE_URL;

  const getTasks = async () => {
    const response = await fetch(`${fetchUrl}/api/tasks`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });
    const data = await response.json();
    return data;
  };

  return (
    <div className="p-6 max-w-2xl mx-auto bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Daily Accountability</h1>
      <AccountabilityFeed tasks={await getTasks()} />
    </div>
  );
}
