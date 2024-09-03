import { NextResponse } from 'next/server';
import { firestore, storage } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, arrayUnion, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { ref, getDownloadURL, uploadString } from 'firebase/storage';

export async function GET() {
    try {
        const db = firestore;
        const tasksCollection = collection(db, 'tasks');
        const snapshot = await getDocs(tasksCollection);
        const tasks = snapshot.docs.flatMap(doc => {
            const data = doc.data();
            return data.tasks || [{
                id: doc.id,
                title: data.title,
                date: data.date,
                images: data.image ? [data.image] : []
            }];
        });
        
        return NextResponse.json(tasks);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, imageFile } = body;
        let imageUrl = '';

        if (imageFile && imageFile.data) {
            // Remove the "data:image/jpeg;base64," prefix if present
            const base64Data = imageFile.data.replace(/^data:image\/\w+;base64,/, '');
            const fileRef = ref(storage, `task_images/${Date.now()}_${imageFile.name}`);
            await uploadString(fileRef, base64Data, 'base64', { contentType: imageFile.type });
            imageUrl = await getDownloadURL(fileRef);
        }

        const db = firestore;
        const today = new Date().toISOString().split('T')[0];

        const tasksRef = doc(db, 'tasks', today);

        // Generate a unique ID for the new task
        const newTaskId = Date.now().toString();

        // Check if the document for today already exists
        const docSnap = await getDoc(tasksRef);

        if (docSnap.exists()) {
            // If the document exists, update it by adding the new task to the array
            await updateDoc(tasksRef, {
                tasks: arrayUnion({
                    id: newTaskId,
                    date: new Date().toISOString(),
                    title: name,
                    images: imageUrl ? [imageUrl] : []
                })
            });
        } else {
            // If the document doesn't exist, create it with the new task
            await setDoc(tasksRef, {
                tasks: [{
                    id: newTaskId,
                    date: new Date().toISOString(),
                    title: name,
                    images: imageUrl ? [imageUrl] : []
                }]
            });
        }

        return NextResponse.json({ id: newTaskId, name, imageUrl });
    } catch (error) {
        console.error('Error in POST /api/tasks:', error);
        return NextResponse.json({ error: 'Failed to add task' }, { status: 500 });
    }
}