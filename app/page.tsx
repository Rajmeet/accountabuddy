import React from 'react';
import AccountabilityFeed from './components/AccountabilityFeed';

export default async function Home() {

  const getTasks = async () => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/tasks`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });
    const data = await response.json();
    return data;
  };

  const tasks = await getTasks();

  return (
    <div className="p-6 max-w-2xl mx-auto bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Daily Accountability</h1>
      <AccountabilityFeed tasks={tasks} />
    </div>
  );
}
