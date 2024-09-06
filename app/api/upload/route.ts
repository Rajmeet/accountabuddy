import { NextResponse } from 'next/server';
import { firestore, storage } from '@/lib/firebase';
import { getDoc, doc, setDoc, collection, getDocs } from 'firebase/firestore';
import { ref, getDownloadURL, uploadString } from 'firebase/storage';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { taskId, imageFile } = body;
        let imageUrl = '';

        if (imageFile && imageFile.data) {
            const base64Data = imageFile.data;
            const fileRef = ref(storage, `task_images/${Date.now()}_${imageFile.task_id}`);
            await uploadString(fileRef, base64Data, 'base64', { contentType: imageFile.type });
            imageUrl = await getDownloadURL(fileRef);
        }

        const db = firestore;

        const tasksCollectionRef = collection(db, 'tasks');
        const querySnapshot = await getDocs(tasksCollectionRef);

        let taskToUpdate;
        let taskDocRef;

        for (const doc of querySnapshot.docs) {
            const tasks = doc.data().tasks;
            const task = tasks.find((t: any) => t.id === taskId);
            if (task) {
                taskToUpdate = task;
                taskDocRef = doc.ref;
                break;
            }
        }

        if (!taskToUpdate || !taskDocRef) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }

        taskToUpdate.images.push(imageUrl);

        const docSnap = await getDoc(taskDocRef);
        const tasks = docSnap.data()?.tasks;
        const taskIndex = tasks.findIndex((t: any) => t.id === taskId);
        tasks[taskIndex] = taskToUpdate;

        await setDoc(taskDocRef, { tasks });

        return NextResponse.json({ success: true, imageUrl });
    } catch (error) {
        console.error('Error in POST /api/tasks/image:', error);
        return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
    }
}