document.addEventListener('DOMContentLoaded', function() {
  // Tab switching
  const tabButtons = document.querySelectorAll('.tab-btn');
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all buttons and content
      document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
      
      // Add active class to clicked button and corresponding content
      button.classList.add('active');
      const tabId = button.getAttribute('data-tab');
      document.getElementById(`${tabId}-form`).classList.add('active');
    });
  });

  // Base URL - adjust if your API is on a different port
  const API_BASE_URL = 'http://localhost:3000/api/auth';
  
  // DOM Elements
  const loginForm = document.getElementById('login');
  const registerForm = document.getElementById('register');
  const protectedSection = document.getElementById('protected-section');
  const jwtTokenDisplay = document.getElementById('jwt-token');
  const apiResponse = document.getElementById('api-response');
  const getProfileBtn = document.getElementById('get-profile');
  const adminActionBtn = document.getElementById('admin-action');
  const logoutBtn = document.getElementById('logout');
  
  // Current JWT token
  let currentToken = localStorage.getItem('jwtToken') || null;
  
  // Check if user is already logged in
  if (currentToken) {
    showProtectedSection(currentToken);
  }
  
  // Login Form Submission
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        currentToken = data.token;
        localStorage.setItem('jwtToken', currentToken);
        showProtectedSection(currentToken);
        displayResponse(data);
        loginForm.reset();
      } else {
        throw new Error(data.error || 'Login failed');
      }
    } catch (error) {
      displayResponse({ error: error.message });
    }
  });
  
  // Register Form Submission
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const userData = {
      username: document.getElementById('reg-username').value,
      email: document.getElementById('reg-email').value,
      password: document.getElementById('reg-password').value,
      first_name: document.getElementById('reg-firstname').value || undefined,
      last_name: document.getElementById('reg-lastname').value || undefined
    };
    
    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        currentToken = data.token;
        localStorage.setItem('jwtToken', currentToken);
        showProtectedSection(currentToken);
        displayResponse(data);
        registerForm.reset();
      } else {
        throw new Error(data.error || 'Registration failed');
      }
    } catch (error) {
      displayResponse({ error: error.message });
    }
  });
  
  // Get Profile Button
  getProfileBtn.addEventListener('click', async () => {
    try {
      const response = await fetch('http://localhost:3000/api/users', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${currentToken}`
        }
      });
      
      const data = await response.json();
      displayResponse(data);
    } catch (error) {
      displayResponse({ error: error.message });
    }
  });
  
  // Admin Action Button
  adminActionBtn.addEventListener('click', async () => {
    try {
      const response = await fetch('http://localhost:3000/api/admin/dashboard', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${currentToken}`
        }
      });
      
      const data = await response.json();
      displayResponse(data);
    } catch (error) {
      displayResponse({ error: error.message });
    }
  });
  
  // Logout Button
  logoutBtn.addEventListener('click', () => {
    currentToken = null;
    localStorage.removeItem('jwtToken');
    protectedSection.style.display = 'none';
    document.querySelector('.tab-btn[data-tab="login"]').click();
    displayResponse({ message: 'Logged out successfully' });
  });
  
  // Helper function to show protected section
  function showProtectedSection(token) {
    protectedSection.style.display = 'block';
    jwtTokenDisplay.value = token;
    document.querySelector('.tab-btn[data-tab="login"]').click();
  }
  
  // Helper function to display API responses
  function displayResponse(data) {
    apiResponse.textContent = JSON.stringify(data, null, 2);
  }
});