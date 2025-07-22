// Initialize Firebase after config loaded
    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const db = firebase.firestore();

    // Dark mode toggle
    function toggleDarkMode() {
      document.body.classList.toggle("dark-mode");
      localStorage.setItem("theme", document.body.classList.contains("dark-mode") ? "dark" : "light");
    }

    window.onload = () => {
      const savedTheme = localStorage.getItem("theme");
      if (savedTheme === "dark") {
        document.body.classList.add("dark-mode");
      }
    };

    // Register new user
    function register() {
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      if (!email || !password) return alert("Please enter email and password.");
      auth.createUserWithEmailAndPassword(email, password)
        .then(() => {
          alert("Registration successful! You are now logged in.");
          document.getElementById("loginContainer").classList.add("hidden");
          document.getElementById("todoContainer").classList.remove("hidden");
          document.getElementById("bottomBar").classList.remove("hidden");
          loadTasks();
        })
        .catch(err => alert("Registration failed: " + err.message));
    }

    // Login existing user
    function login() {
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      auth.signInWithEmailAndPassword(email, password)
        .then(() => {
          document.getElementById("loginContainer").classList.add("hidden");
          document.getElementById("todoContainer").classList.remove("hidden");
          document.getElementById("bottomBar").classList.remove("hidden");
          loadTasks();
        })
        .catch(err => alert("Login failed: " + err.message));
    }

    // Logout user
    function logout() {
      auth.signOut().then(() => {
        document.getElementById("loginContainer").classList.remove("hidden");
        document.getElementById("todoContainer").classList.add("hidden");
        document.getElementById("bottomBar").classList.add("hidden");
        document.getElementById("taskList").innerHTML = "";
      });
    }

    // Add new task
    function addTask() {
      const user = auth.currentUser;
      if (!user) return alert("Login first.");
      const task = document.getElementById("taskInput").value.trim();
      if (!task) return;
      db.collection("users").doc(user.uid).collection("tasks").add({
        text: task,
        completed: false,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      }).then(() => {
        document.getElementById("taskInput").value = "";
        loadTasks();
      }).catch(err => alert("Error adding task: " + err.message));
    }

    // Load tasks from Firestore and display
    function loadTasks() {
      const user = auth.currentUser;
      if (!user) return;
      const list = document.getElementById("taskList");
      list.innerHTML = "Loading tasks...";
      db.collection("users").doc(user.uid).collection("tasks")
        .orderBy("createdAt", "desc")
        .get()
        .then(snapshot => {
          list.innerHTML = "";
          if (snapshot.empty) {
            list.innerHTML = "<li>No tasks found.</li>";
            return;
          }
          snapshot.forEach(doc => {
            const data = doc.data();
            const li = document.createElement("li");
            li.setAttribute("data-id", doc.id);

            // Task text span
            const span = document.createElement("span");
            span.className = "task-text";
            span.textContent = data.text;

            // Edit button
            const editBtn = document.createElement("button");
            editBtn.textContent = "Edit";
            editBtn.className = "btn edit-btn";
            editBtn.onclick = () => editTask(li, doc.id);

            // Delete button
            const delBtn = document.createElement("button");
            delBtn.textContent = "Delete";
            delBtn.className = "btn delete-btn";
            delBtn.onclick = () => deleteTask(doc.id);

            li.appendChild(span);
            li.appendChild(editBtn);
            li.appendChild(delBtn);

            list.appendChild(li);
          });
        })
        .catch(err => {
          alert("Failed to load tasks: " + err.message);
          list.innerHTML = "";
        });
    }

    // Edit task in place
    function editTask(li, taskId) {
      const span = li.querySelector(".task-text");
      const originalText = span.textContent;

      // Create input for editing
      const input = document.createElement("input");
      input.type = "text";
      input.value = originalText;
      input.style.flexGrow = "1";

      // Replace span with input
      li.replaceChild(input, span);

      // Replace Edit button with Save button
      const editBtn = li.querySelector(".edit-btn");
      editBtn.textContent = "Save";
      editBtn.className = "btn save-btn";

      // On save click
      editBtn.onclick = () => {
        const newText = input.value.trim();
        if (!newText) {
          alert("Task cannot be empty.");
          return;
        }
        const user = auth.currentUser;
        if (!user) return alert("Login first.");

        db.collection("users").doc(user.uid).collection("tasks").doc(taskId).update({
          text: newText
        }).then(() => {
          loadTasks();
        }).catch(err => alert("Update failed: " + err.message));
      };
    }

    // Delete task
    function deleteTask(taskId) {
      const user = auth.currentUser;
      if (!user) return alert("Login first.");
      if (!confirm("Delete this task?")) return;
      db.collection("users").doc(user.uid).collection("tasks").doc(taskId).delete()
        .then(() => loadTasks())
        .catch(err => alert("Delete failed: " + err.message));
    }

    // Automatically check auth state
    auth.onAuthStateChanged(user => {
      const websiteBtn = document.getElementById("websiteBtn");

      if (user) {
        // Logged in
        document.getElementById("loginContainer").classList.add("hidden");
        document.getElementById("todoContainer").classList.remove("hidden");
        document.getElementById("logoutBtn").classList.remove("hidden");
        websiteBtn.classList.remove("hidden"); // ✅ show website button after login

        loadTasks();
      } else {
        // Logged out
        document.getElementById("loginContainer").classList.remove("hidden");
        document.getElementById("todoContainer").classList.add("hidden");
        document.getElementById("logoutBtn").classList.add("hidden");
        document.getElementById("taskList").innerHTML = "";
        websiteBtn.classList.add("hidden"); // ❌ hide website button when logged out
      }
    });
    function loginWithGoogle() {
      const provider = new firebase.auth.GoogleAuthProvider();
      auth.signInWithPopup(provider)
      .then(result => {
        document.getElementById("loginContainer").classList.add("hidden");
        document.getElementById("todoContainer").classList.remove("hidden");
        document.getElementById("bottomBar").classList.remove("hidden");
        loadTasks();
      })
      .catch(error => {
        alert("Google Sign-in failed: " + error.message);
      });
    }