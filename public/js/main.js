document.addEventListener('DOMContentLoaded', () => {
  const taskInput = document.querySelector('.task-input');
  const charCount = document.querySelector('.char-count');
  const addTaskForm = document.getElementById('addTaskForm');
  const alarmInput = document.querySelector('.alarm-input');
  const editTaskInput = document.getElementById('editTaskText');
  const charCountEdit = document.querySelector('.char-count-edit');

  // Character counter for add form
  if (taskInput && charCount) {
    taskInput.addEventListener('input', (e) => {
      const length = e.target.value.length;
      charCount.textContent = `${length}/200`;
    });
    taskInput.focus();
  }

  // Character counter for edit form
  if (editTaskInput && charCountEdit) {
    editTaskInput.addEventListener('input', (e) => {
      const length = e.target.value.length;
      charCountEdit.textContent = `${length}/200`;
    });
  }

  // Set minimum datetime to now
  if (alarmInput) {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    alarmInput.min = now.toISOString().slice(0, 16);
  }

  if (document.getElementById('editAlarmTime')) {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    document.getElementById('editAlarmTime').min = now.toISOString().slice(0, 16);
  }

  // Form submission with validation
  if (addTaskForm) {
    addTaskForm.addEventListener('submit', (e) => {
      const text = taskInput.value.trim();
      if (!text) {
        e.preventDefault();
        taskInput.focus();
      }
    });
  }

  const editForm = document.getElementById('editForm');
  if (editForm) {
    editForm.addEventListener('submit', (e) => {
      const text = editTaskInput.value.trim();
      if (!text) {
        e.preventDefault();
        editTaskInput.focus();
      }
    });
  }

  // Initialize alarm checkers
  initializeAlarmCheckers();

  // Update stats dynamically (if needed)
  updateStats();
});

function openEditModal(button) {
  const taskItem = button.closest('.task-item');
  if (!taskItem) return;

  const taskId = taskItem.getAttribute('data-task-id');
  const taskText = taskItem.getAttribute('data-task-text');
  const taskAlarm = taskItem.getAttribute('data-task-alarm');

  const modal = document.getElementById('editModal');
  const editForm = document.getElementById('editForm');
  const editTaskInput = document.getElementById('editTaskText');
  const editAlarmInput = document.getElementById('editAlarmTime');
  const charCountEdit = document.querySelector('.char-count-edit');

  editForm.action = `/edit/${taskId}`;
  editTaskInput.value = taskText;
  editAlarmInput.value = taskAlarm;
  
  if (charCountEdit) {
    charCountEdit.textContent = `${taskText.length}/200`;
  }

  modal.classList.add('active');
  editTaskInput.focus();
  editTaskInput.select();
}

function closeEditModal() {
  const modal = document.getElementById('editModal');
  modal.classList.remove('active');
}

function initializeAlarmCheckers() {
  const alarmBadges = document.querySelectorAll('.alarm-badge');
  
  alarmBadges.forEach(badge => {
    const alarmTime = badge.getAttribute('data-time');
    if (alarmTime) {
      scheduleAlarm(alarmTime, badge);
    }
  });
}
// Parse an ISO-like local datetime ("YYYY-MM-DDTHH:mm[:ss]") into a local Date
function parseLocalDatetimeLocal(alarmTimeString) {
  if (!alarmTimeString) return null;
  // If string contains timezone offset (Z or + or -) let Date handle it
  if (/[zZ]|[+\-]\d{2}:?\d{2}$/.test(alarmTimeString)) {
    const d = new Date(alarmTimeString);
    return isNaN(d.getTime()) ? null : d;
  }

  // Expected formats: "YYYY-MM-DDTHH:mm" or "YYYY-MM-DDTHH:mm:ss"
  const parts = alarmTimeString.split('T');
  if (parts.length !== 2) return null;
  const [datePart, timePart] = parts;
  const dateParts = datePart.split('-').map(Number);
  const timeParts = timePart.split(':').map(Number);
  if (dateParts.length < 3 || timeParts.length < 2) return null;
  const year = dateParts[0];
  const month = dateParts[1] - 1; // JS months 0-based
  const day = dateParts[2];
  const hour = timeParts[0];
  const minute = timeParts[1];
  const second = timeParts[2] || 0;
  return new Date(year, month, day, hour, minute, second);
}

function scheduleAlarm(alarmTimeString, element) {
  // Avoid scheduling same element multiple times
  if (!element || element.dataset.alarmScheduled === 'true') return;

  const alarmDate = parseLocalDatetimeLocal(alarmTimeString);
  if (!alarmDate) return;

  const now = new Date();
  const timeDiff = alarmDate.getTime() - now.getTime();

  console.log('[alarm] scheduling:', alarmTimeString, 'parsed:', alarmDate.toString(), 'now:', now.toString(), 'diffMs:', timeDiff);

  // If alarm is more than 24 days in future, skip (setTimeout limit), but still mark scheduled
  const MAX_TIMEOUT = 2147483647; // ~24.8 days

  if (timeDiff <= 0 && timeDiff >= -60000) {
    // it's right now (within 60s in the past) -> trigger immediately
    triggerAlarm(element);
    element.dataset.alarmScheduled = 'triggered';
    return;
  }

  if (timeDiff < -60000) {
    // already long past
    console.log('[alarm] alarm in past, skipping');
    return;
  }

  // Schedule exact timeout (cap to MAX_TIMEOUT) and set a backup check if capped
  const toMs = Math.min(timeDiff, MAX_TIMEOUT);
  element.dataset.alarmScheduled = 'true';
  const timerId = setTimeout(() => {
    triggerAlarm(element);
    element.dataset.alarmScheduled = 'triggered';
  }, toMs);

  // If we capped the timeout, set an interval to re-schedule later
  if (timeDiff > MAX_TIMEOUT) {
    const intervalId = setInterval(() => {
      const now2 = new Date();
      const remaining = alarmDate.getTime() - now2.getTime();
      if (remaining <= MAX_TIMEOUT) {
        clearInterval(intervalId);
        clearTimeout(timerId);
        element.dataset.alarmScheduled = 'false';
        scheduleAlarm(alarmTimeString, element);
      }
    }, 1000 * 60 * 60); // check hourly
  }
}

function triggerAlarm(element) {
  const taskItem = element.closest('.task-item');
  if (!taskItem) return;
  
  const taskText = taskItem.querySelector('.task-text')?.textContent || 'Task';
  const alarmTime = element.getAttribute('data-time');
  const alarmDate = new Date(alarmTime);
  
  // Format time to 12-hour with AM/PM
  let hours = alarmDate.getHours();
  const mins = String(alarmDate.getMinutes()).padStart(2, '0');
  const day = String(alarmDate.getDate()).padStart(2, '0');
  const month = String(alarmDate.getMonth() + 1).padStart(2, '0');
  const year = alarmDate.getFullYear();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  const display12h = String(hours).padStart(2, '0');
  
  // Show modal
  const modal = document.getElementById('alarmModal');
  const modalTaskText = document.getElementById('alarmTaskText');
  const alarmTimeDisplay = document.getElementById('alarmTimeDisplay');
  
  modalTaskText.textContent = taskText;
  alarmTimeDisplay.textContent = `Scheduled for ${day}/${month}/${year} at ${display12h}:${mins} ${ampm}`;
  
  // Store current task ID for marking as done
  modal.dataset.taskId = taskItem.getAttribute('data-task-id');
  
  modal.classList.add('active');
  
  // Play notification sound
  playNotificationSound();
}

function closeAlarmModal() {
  const modal = document.getElementById('alarmModal');
  modal.classList.remove('active');
  delete modal.dataset.taskId;
}

function completeAlarmTask() {
  const modal = document.getElementById('alarmModal');
  const taskId = modal.dataset.taskId;
  
  if (taskId) {
    // Find and submit the toggle form for this task
    const taskItem = document.querySelector(`[data-task-id="${taskId}"]`);
    if (taskItem) {
      const form = taskItem.querySelector('.toggle-form');
      if (form) {
        form.requestSubmit();
      }
    }
  }
  
  closeAlarmModal();
}

function playNotificationSound() {
  // Create a simple beep sound using Web Audio API
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (e) {
    console.log('Audio not supported');
  }
}

// Close modal when clicking outside
document.addEventListener('click', (e) => {
  const alarmModal = document.getElementById('alarmModal');
  const editModal = document.getElementById('editModal');
  
  if (e.target === alarmModal) {
    closeAlarmModal();
  }
  if (e.target === editModal) {
    closeEditModal();
  }
});

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const editModal = document.getElementById('editModal');
    if (editModal.classList.contains('active')) {
      closeEditModal();
    } else {
      closeAlarmModal();
    }
  }
});

function updateStats() {
  const totalTasks = document.getElementById('totalTasks');
  const completedTasks = document.getElementById('completedTasks');
  const pendingTasks = document.getElementById('pendingTasks');

  if (totalTasks && completedTasks && pendingTasks) {
    const tasks = document.querySelectorAll('.task-item');
    const completed = document.querySelectorAll('.task-item.completed').length;
    const total = tasks.length;
    const pending = total - completed;

    totalTasks.textContent = total;
    completedTasks.textContent = completed;
    pendingTasks.textContent = pending;
  }
}

// Smooth animations
window.addEventListener('load', () => {
  const items = document.querySelectorAll('.task-item, .stat, .add-task-section, .header');
  items.forEach((item, index) => {
    item.style.animation = `fadeInUp 0.5s ease ${index * 0.05}s backwards`;
  });
});

// Add animation keyframes dynamically
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;
document.head.appendChild(style);

