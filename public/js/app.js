// API Base URL
const API_URL = 'http://localhost:3000/api';

// Authentication state
let currentUser = null;
let authToken = null;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  setupEventListeners();
});

// Check if user is authenticated
function checkAuth() {
  authToken = localStorage.getItem('authToken');
  const user = localStorage.getItem('currentUser');
  
  if (authToken && user) {
    currentUser = JSON.parse(user);
    showDashboard();
  } else {
    showLogin();
  }
}

// Setup event listeners
function setupEventListeners() {
  document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
  document.getElementById('createRecordForm')?.addEventListener('submit', handleCreateRecord);
  document.getElementById('grantAccessForm')?.addEventListener('submit', handleGrantAccess);
}

// Show/Hide pages
function showLogin() {
  document.getElementById('loginPage').style.display = 'block';
  document.getElementById('dashboardPage').style.display = 'none';
  document.getElementById('navbar').style.display = 'none';
}

function showDashboard() {
  document.getElementById('loginPage').style.display = 'none';
  document.getElementById('dashboardPage').style.display = 'block';
  document.getElementById('navbar').style.display = 'block';
  document.getElementById('userName').textContent = currentUser.fullName;
  
  // Show/hide tabs based on role
  if (currentUser.role === 'doctor') {
    document.getElementById('createRecordTab').style.display = 'block';
    loadMyPatients();
  } else {
    document.getElementById('patientPermissionsSection').style.display = 'block';
    loadAllDoctors();
  }
  
  loadRecords();
  loadPermissions();
  loadAuditLogs();
}

// Handle login
async function handleLogin(e) {
  e.preventDefault();
  
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (data.success) {
      authToken = data.data.token;
      currentUser = data.data.user;
      localStorage.setItem('authToken', authToken);
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      showAlert('Login successful!', 'success');
      showDashboard();
    } else {
      showAlert(data.message || 'Login failed', 'danger');
    }
  } catch (error) {
    showAlert('Connection error. Please try again.', 'danger');
    console.error('Login error:', error);
  }
}

// Logout
function logout() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('currentUser');
  authToken = null;
  currentUser = null;
  showLogin();
  showAlert('Logged out successfully', 'info');
}

// Load medical records
async function loadRecords() {
  try {
    const response = await fetch(`${API_URL}/records`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    const data = await response.json();
    
    if (data.success) {
      displayRecords(data.data);
    }
  } catch (error) {
    console.error('Load records error:', error);
  }
}

// Display records
function displayRecords(records) {
  const container = document.getElementById('recordsList');
  
  if (records.length === 0) {
    container.innerHTML = '<div class="alert alert-info">No medical records found.</div>';
    return;
  }
  
  container.innerHTML = records.map(record => `
    <div class="card record-card" onclick="viewRecordDetail(${record.id})">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-start">
          <div>
            <h5 class="card-title">
              <i class="bi bi-file-medical text-primary"></i> 
              Record #${record.id}
            </h5>
            <p class="mb-1">
              <strong>${currentUser.role === 'patient' ? 'Doctor' : 'Patient'}:</strong> 
              ${currentUser.role === 'patient' ? record.doctor_name : record.patient_name}
            </p>
            <p class="mb-1"><strong>Diagnosis:</strong> ${record.diagnosis}</p>
            <small class="text-muted">
              <i class="bi bi-calendar"></i> ${new Date(record.created_at).toLocaleString()}
            </small>
          </div>
          <div>
            ${record.blockchain_tx_id ? '<span class="blockchain-badge"><i class="bi bi-shield-check"></i> On Blockchain</span>' : ''}
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

// View record detail
async function viewRecordDetail(recordId) {
  try {
    const response = await fetch(`${API_URL}/records/${recordId}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    const data = await response.json();
    
    if (data.success) {
      const record = data.data;
      const modal = new bootstrap.Modal(document.getElementById('recordDetailModal'));
      
      document.getElementById('recordDetailContent').innerHTML = `
        <div class="mb-3">
          <h6><i class="bi bi-person"></i> Patient Information</h6>
          <p><strong>Name:</strong> ${record.patient_name}</p>
          <p><strong>Email:</strong> ${record.patient_email}</p>
        </div>
        <div class="mb-3">
          <h6><i class="bi bi-person-badge"></i> Doctor Information</h6>
          <p><strong>Name:</strong> ${record.doctor_name}</p>
          <p><strong>Email:</strong> ${record.doctor_email}</p>
        </div>
        <hr>
        <div class="mb-3">
          <h6><i class="bi bi-clipboard-pulse"></i> Medical Details</h6>
          <p><strong>Diagnosis:</strong> ${record.diagnosis}</p>
          <p><strong>Treatment:</strong> ${record.treatment || 'N/A'}</p>
          <p><strong>Medications:</strong> ${record.medications || 'N/A'}</p>
          <p><strong>Notes:</strong> ${record.notes || 'N/A'}</p>
        </div>
        <hr>
        <div class="mb-3">
          <h6><i class="bi bi-shield-check"></i> Verification</h6>
          <p>
            <strong>Hash Status:</strong> 
            <span class="badge ${record.hashValid ? 'badge-valid' : 'badge-invalid'}">
              ${record.hashValid ? 'Valid' : 'Invalid'}
            </span>
          </p>
          <p class="hash-badge"><strong>Hash:</strong> ${record.record_hash}</p>
          <p><strong>Blockchain TX:</strong> ${record.blockchain_tx_id || 'Pending'}</p>
        </div>
        <button class="btn btn-primary btn-sm" onclick="viewAuditTrail(${record.id})">
          <i class="bi bi-clock-history"></i> View Audit Trail
        </button>
      `;
      
      modal.show();
    }
  } catch (error) {
    showAlert('Failed to load record details', 'danger');
    console.error('View record error:', error);
  }
}

// Load my patients (for doctors)
async function loadMyPatients() {
  try {
    const response = await fetch(`${API_URL}/permissions/patients/my`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    const data = await response.json();
    
    if (data.success) {
      const select = document.getElementById('recordPatientId');
      select.innerHTML = '<option value="">Select a patient...</option>' + 
        data.data.map(p => `<option value="${p.id}">${p.full_name} (${p.email})</option>`).join('');
    }
  } catch (error) {
    console.error('Load patients error:', error);
  }
}

// Load all doctors (for patients)
async function loadAllDoctors() {
  try {
    const response = await fetch(`${API_URL}/permissions/doctors/all`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    const data = await response.json();
    
    if (data.success) {
      const select = document.getElementById('grantDoctorId');
      select.innerHTML = '<option value="">Select a doctor...</option>' + 
        data.data.map(d => `<option value="${d.id}">${d.full_name} (${d.email})</option>`).join('');
    }
  } catch (error) {
    console.error('Load doctors error:', error);
  }
}

// Handle create record
async function handleCreateRecord(e) {
  e.preventDefault();
  
  const recordData = {
    patientId: parseInt(document.getElementById('recordPatientId').value),
    diagnosis: document.getElementById('recordDiagnosis').value,
    treatment: document.getElementById('recordTreatment').value,
    medications: document.getElementById('recordMedications').value,
    notes: document.getElementById('recordNotes').value
  };
  
  try {
    const response = await fetch(`${API_URL}/records`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(recordData)
    });
    
    const data = await response.json();
    
    if (data.success) {
      showAlert('Medical record created and stored on blockchain!', 'success');
      document.getElementById('createRecordForm').reset();
      loadRecords();
      
      // Switch to records tab
      document.getElementById('records-tab').click();
    } else {
      showAlert(data.message || 'Failed to create record', 'danger');
    }
  } catch (error) {
    showAlert('Error creating record', 'danger');
    console.error('Create record error:', error);
  }
}

// Load permissions
async function loadPermissions() {
  try {
    const response = await fetch(`${API_URL}/permissions`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    const data = await response.json();
    
    if (data.success) {
      displayPermissions(data.data);
    }
  } catch (error) {
    console.error('Load permissions error:', error);
  }
}

// Display permissions
function displayPermissions(permissions) {
  const container = document.getElementById('permissionsList');
  
  if (permissions.length === 0) {
    container.innerHTML = '<div class="alert alert-info">No permissions found.</div>';
    return;
  }
  
  container.innerHTML = permissions.map(perm => `
    <div class="card permission-card ${!perm.granted ? 'revoked' : ''}">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <h6 class="mb-1">
              ${currentUser.role === 'patient' ? perm.doctor_name : perm.patient_name}
            </h6>
            <small class="text-muted">
              ${currentUser.role === 'patient' ? perm.doctor_email : perm.patient_email}
            </small>
            <p class="mb-0 mt-2">
              <span class="badge ${perm.granted ? 'bg-success' : 'bg-danger'}">
                ${perm.granted ? 'Access Granted' : 'Access Revoked'}
              </span>
            </p>
          </div>
          ${currentUser.role === 'patient' ? `
            <button class="btn btn-sm ${perm.granted ? 'btn-danger' : 'btn-success'}" 
                    onclick="togglePermission(${perm.doctor_id}, ${!perm.granted})">
              <i class="bi ${perm.granted ? 'bi-x-circle' : 'bi-check-circle'}"></i>
              ${perm.granted ? 'Revoke' : 'Grant'}
            </button>
          ` : ''}
        </div>
      </div>
    </div>
  `).join('');
}

// Handle grant access
async function handleGrantAccess(e) {
  e.preventDefault();
  
  const doctorId = parseInt(document.getElementById('grantDoctorId').value);
  
  await togglePermission(doctorId, true);
  
  // Close modal
  bootstrap.Modal.getInstance(document.getElementById('grantAccessModal')).hide();
  document.getElementById('grantAccessForm').reset();
}

// Toggle permission
async function togglePermission(doctorId, granted) {
  try {
    const response = await fetch(`${API_URL}/permissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ doctorId, granted })
    });
    
    const data = await response.json();
    
    if (data.success) {
      showAlert(data.message, 'success');
      loadPermissions();
    } else {
      showAlert(data.message || 'Failed to update permission', 'danger');
    }
  } catch (error) {
    showAlert('Error updating permission', 'danger');
    console.error('Toggle permission error:', error);
  }
}

// Load audit logs
async function loadAuditLogs() {
  try {
    const response = await fetch(`${API_URL}/audit/logs/all`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    const data = await response.json();
    
    if (data.success) {
      displayAuditLogs(data.data);
    }
  } catch (error) {
    console.error('Load audit logs error:', error);
  }
}

// Display audit logs
function displayAuditLogs(logs) {
  const container = document.getElementById('auditLogsList');
  
  if (logs.length === 0) {
    container.innerHTML = '<div class="alert alert-info">No audit logs found.</div>';
    return;
  }
  
  container.innerHTML = logs.map(log => `
    <div class="audit-log ${!log.is_valid ? 'failed' : ''}">
      <div class="d-flex justify-content-between">
        <div>
          <strong>${log.validation_type.toUpperCase()}</strong> validation
          <span class="badge ${log.is_valid ? 'bg-success' : 'bg-danger'} ms-2">
            ${log.is_valid ? 'Valid' : 'Failed'}
          </span>
        </div>
        <small class="text-muted">${new Date(log.created_at).toLocaleString()}</small>
      </div>
      ${log.error_message ? `<p class="text-danger mb-0 mt-1"><small>${log.error_message}</small></p>` : ''}
      ${log.validated_by_name ? `<p class="mb-0 mt-1"><small>By: ${log.validated_by_name}</small></p>` : ''}
    </div>
  `).join('');
}

// View audit trail for specific record
async function viewAuditTrail(recordId) {
  try {
    const response = await fetch(`${API_URL}/audit/${recordId}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert('Audit trail loaded. Check console for details.');
      console.log('Audit Trail:', data.data);
    }
  } catch (error) {
    console.error('View audit trail error:', error);
  }
}

// Show alert notification
function showAlert(message, type = 'info') {
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
  alertDiv.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  
  document.body.appendChild(alertDiv);
  
  setTimeout(() => {
    alertDiv.remove();
  }, 5000);
}
