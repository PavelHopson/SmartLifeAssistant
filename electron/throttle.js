// Notification throttling + quiet hours enforcement

const THROTTLE_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const MAX_PER_WINDOW = 3;

let recentNotifications = []; // timestamps

function canSendNotification(settings) {
  // Quiet hours check
  if (settings.quietHoursStart && settings.quietHoursEnd) {
    if (isQuietHours(settings.quietHoursStart, settings.quietHoursEnd)) {
      return false;
    }
  }

  // Throttle check
  const now = Date.now();
  recentNotifications = recentNotifications.filter(t => now - t < THROTTLE_WINDOW_MS);
  if (recentNotifications.length >= MAX_PER_WINDOW) {
    return false;
  }

  return true;
}

function recordNotification() {
  recentNotifications.push(Date.now());
}

function isQuietHours(start, end) {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  const currentMinutes = h * 60 + m;

  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const startMinutes = sh * 60 + sm;
  const endMinutes = eh * 60 + em;

  if (startMinutes <= endMinutes) {
    // Same day range: e.g. 22:00 - 23:00
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  } else {
    // Overnight range: e.g. 22:00 - 08:00
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }
}

module.exports = { canSendNotification, recordNotification };
