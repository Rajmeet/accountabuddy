import { NextResponse } from 'next/server';
import { firestore, storage } from '@/lib/firebase';
import { getDoc, doc, setDoc } from 'firebase/firestore';
import { ref, getDownloadURL, uploadString } from 'firebase/storage';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { taskId, imageFile } = body;
        let imageUrl = '';

        if (imageFile && imageFile.data) {
            // Remove the "data:image/jpeg;base64," prefix if present
            const base64Data = imageFile.data.replace(/^data:image\/\w+;base64,/, '');
            const fileRef = ref(storage, `task_images/${Date.now()}_${imageFile.task_id}`);
            await uploadString(fileRef, base64Data, 'base64', { contentType: imageFile.type });
            imageUrl = await getDownloadURL(fileRef);
        }

        const db = firestore;
        const today = new Date().toISOString().split('T')[0];

        const tasksRef = doc(db, 'tasks', today);

        const docSnap = await getDoc(tasksRef);
        const tasks = docSnap.data()?.tasks;
        console.log("task_id", taskId);
        // tasks is a list of dictionaries with id, date, title, and images
        // find the task with the given task_id and add the imageUrl to the images list
        const task = tasks.find((task: any) => task.id === taskId);
        console.log("task", task);

        task.images.push(imageUrl);
        console.log("task", task);

        // update the task in the list
        const taskIndex = tasks.findIndex((task: any) => task.id === taskId);
        tasks[taskIndex] = task;

        // update the tasks in the database
        await setDoc(tasksRef, { tasks });

        console.log("tasks", tasks);

        return NextResponse.json({ success: true, imageUrl });
    } catch (error) {
        console.error('Error in POST /api/tasks/image:', error);
        return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
    }
}