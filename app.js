import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

// Replace with your actual Firebase config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_MSG_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;
let tasks = [];

const authSection = document.getElementById("authSection");
const todoSection = document.getElementById("todoSection");

function renderTasks() {
  const taskList = document.getElementById("taskList");
  taskList.innerHTML = '';
  tasks.forEach(task => {
    const li = document.createElement("li");
    li.className = task.completed ? "completed" : "";

    const span = document.createElement("span");
    span.textContent = task.text;
    span.style.flex = "1";
    span.onclick = () => toggleComplete(task);

    const editBtn = document.createElement("button");
    editBtn.textContent = "Edit";
    editBtn.className = "btn edit-btn";
    editBtn.onclick = () => editTask(task);

    const delBtn = document.createElement("button");
    delBtn.textContent = "Delete";
    delBtn.className = "btn delete-btn";
    delBtn.onclick = () => deleteTask(task);

    li.appendChild(span);
    li.appendChild(editBtn);
    li.appendChild(delBtn);
    taskList.appendChild(li);
  });
}

async function loadTasks() {
  const snapshot = await getDocs(collection(db, 'users', currentUser.uid, 'tasks'));
  tasks = [];
  snapshot.forEach(docSnap => {
    tasks.push({ id: docSnap.id, ...docSnap.data() });
  });
  renderTasks();
}

async function addTask() {
  const input = document.getElementById("taskInput");
  const text = input.value.trim();
  if (!text) return;
  await addDoc(collection(db, 'users', currentUser.uid, 'tasks'), {
    text,
    completed: false
  });
  input.value = '';
  loadTasks();
}

async function toggleComplete(task) {
  const ref = doc(db, 'users', currentUser.uid, 'tasks', task.id);
  await updateDoc(ref, { completed: !task.completed });
  loadTasks();
}

async function deleteTask(task) {
  const ref = doc(db, 'users', currentUser.uid, 'tasks', task.id);
  await deleteDoc(ref);
  loadTasks();
}

async function editTask(task) {
  const newText = prompt("Edit your task:", task.text);
  if (newText && newText.trim() !== "") {
    await updateDoc(doc(db, 'users', currentUser.uid, 'tasks', task.id), {
      text: newText
    });
    loadTasks();
  }
}

window.login = async function () {
  const email = document.getElementById("email").value;
  const pass = document.getElementById("password").value;
  try {
    await signInWithEmailAndPassword(auth, email, pass);
  } catch (e) {
    alert(e.message);
  }
};

window.register = async function () {
  const email = document.getElementById("email").value;
  const pass = document.getElementById("password").value;
  try {
    await createUserWithEmailAndPassword(auth, email, pass);
  } catch (e) {
    alert(e.message);
  }
};

window.logout = () => signOut(auth);

onAuthStateChanged(auth, user => {
  if (user) {
    currentUser = user;
    authSection.style.display = "none";
    todoSection.style.display = "block";
    loadTasks();
  } else {
    currentUser = null;
    tasks = [];
    authSection.style.display = "block";
    todoSection.style.display = "none";
  }
});

window.toggleDarkMode = () => {
  document.body.classList.toggle("dark-mode");
  localStorage.setItem("darkMode", document.body.classList.contains("dark-mode"));
};
if (localStorage.getItem("darkMode") === "true") {
  document.body.classList.add("dark-mode");
}
