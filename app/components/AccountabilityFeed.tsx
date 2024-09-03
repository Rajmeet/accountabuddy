'use client'
import React, { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, Camera, Plus, X } from 'lucide-react';
import { Card, CardHeader, CardContent, CardFooter, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ToastContainer, toast } from 'react-toastify';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface Task {
  id: string;
  title: string;
  date: string;
  images: string[];
}

interface AccountabilityFeedProps {
  tasks: Task[];
}

const AccountabilityFeed: React.FC<AccountabilityFeedProps> = ({ tasks }) => {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState<boolean>(false);
  const [newTaskTitle, setNewTaskTitle] = useState<string>('');
  const [newTaskImage, setNewTaskImage] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const router = useRouter();
  
  const handleAddPhoto = (taskId: string) => {
    setSelectedTaskId(taskId);
    if (fileInputRef.current) {
      setIsLoading(true);
      fileInputRef.current.click();
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedTaskId) return;

    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Prepare the request body
      const body = {
        taskId: selectedTaskId,
        imageFile: {
          data: base64,
          type: file.type,
          name: file.name
        }
      };

      // Send POST request to the API endpoint
      const fetchUrl = process.env.NODE_ENV === 'development'  
      ? 'http://localhost:3000' 
      : process.env.NEXT_PUBLIC_BASE_URL;
      const response = await fetch(`${fetchUrl}/api/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const result = await response.json();
      
      toast.success('Photo uploaded successfully!');
      router.refresh();
      setIsLoading(false);
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Failed to upload photo. Please try again.');
    }
    setSelectedTaskId(null);
  };
  const handleAddTaskClick = () => {
    setIsAddTaskModalOpen(true);
  };

  const handleAddTaskModalClose = () => {
    setIsAddTaskModalOpen(false);
    setNewTaskTitle('');
    setNewTaskImage(null);
    setIsLoading(false);
  };

  const handleAddTask = async () => {
    setIsLoading(true);
    if (!newTaskTitle.trim()) {
      toast.error('Please enter a task title');
      return;
    }

    try {
      let imageData = null;
      if (newTaskImage) {
        const reader = new FileReader();
        imageData = await new Promise((resolve) => {
          reader.onload = (e) => resolve(e.target?.result);
          reader.readAsDataURL(newTaskImage);
        });
      }

      const formData = {
        name: newTaskTitle,
        imageFile: imageData && newTaskImage ? {
          data: imageData,
          type: newTaskImage.type,
          name: newTaskImage.name
        } : null
      };

      const fetchUrl = process.env.NODE_ENV === 'development'  
      ? 'http://localhost:3000' 
      : process.env.NEXT_PUBLIC_BASE_URL;

      const response = await fetch(`${fetchUrl}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to add task');
      }

      const newTask = await response.json();
      toast.success('New task added successfully!');
      handleAddTaskModalClose();
      router.refresh();
    } catch (error) {
      console.error('Error adding new task:', error);
      toast.error('Failed to add new task. Please try again.');
    }
  };


  return (
    <div className="max-w-md mx-auto p-4 space-y-4">
      {tasks.map(task => (
        <Card key={task.id} className="w-full">
          <CardHeader>
            <CardTitle>{task.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-2">
              {new Date(task.date).toLocaleDateString()}
            </p>
            {task.images && task.images.length > 0 ? (
              <Carousel className="w-full">
                <CarouselContent>
                  {task.images.map((image, index) => (
                    <CarouselItem key={index}>
                      <div className="relative w-full h-96 bg-gray-200 rounded-lg overflow-hidden">
                        <Image
                          src={image}
                          alt={`Progress for ${task.title} - Image ${index + 1}`}
                          width={500}
                          height={500}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                {task.images.length > 1 && (
                  <>
                    <CarouselPrevious />
                    <CarouselNext />
                  </>
                )}
              </Carousel>
            ) : (
              <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">No images yet</p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={() => handleAddPhoto(task.id)}>
              <Camera className="mr-2 h-4 w-4" /> Add Photo
            </Button>
          </CardFooter>
        </Card>
      ))}
      <Button className="w-full" onClick={handleAddTaskClick}>
        <Plus className="mr-2 h-4 w-4" /> Add New Task
      </Button>

      {isAddTaskModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 max-w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Add New Task</h2>
            <Input
              type="text"
              placeholder="Task Title"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="mb-4"
            />
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setNewTaskImage(e.target.files?.[0] || null)}
              className="mb-4"
              capture="environment"
            />
            <div className="flex justify-end">
              <Button onClick={handleAddTaskModalClose} className="mr-2">Cancel</Button>
              <Button onClick={handleAddTask}>Add Task</Button>
            </div>
          </div>
        </div>
      )}

      <Input
        type="file"
        accept="image/*"
        capture="environment"
        ref={fileInputRef}
        className="hidden"
        onChange={handlePhotoUpload}
      />
      
      <ToastContainer />
    </div>
  );
};

export default AccountabilityFeed;
