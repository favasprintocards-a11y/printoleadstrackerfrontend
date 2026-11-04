/**
 * Format phone string to pure digits for whatsapp/tel links
 */
export function cleanDigitsOnly(phone) {
  if (!phone) return '';
  return String(phone).replace(/\D/g, '');
}

/**
 * Returns call url (tel:...)
 */
export function getCallUrl(phone) {
  if (!phone) return '#';
  const clean = cleanDigitsOnly(phone);
  return `tel:${clean.startsWith('+') ? clean : '+' + clean}`;
}

/**
 * Returns WhatsApp click-to-chat URL
 */
export function getWhatsAppUrl(phone, leadName = '') {
  if (!phone) return '#';
  let clean = cleanDigitsOnly(phone);
  // Default to 91 if 10 digit Indian number without country code
  if (clean.length === 10) {
    clean = '91' + clean;
  }
  const text = encodeURIComponent(
    leadName
      ? `Hello ${leadName}, this is regarding your recent inquiry. How can we assist you today?`
      : `Hello, this is regarding your recent inquiry. How can we assist you today?`
  );
  return `https://wa.me/${clean}?text=${text}`;
}

/**
 * Format ISO or YYYY-MM-DD date string
 */
export function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

/**
 * Format Date & Time for activity timeline
 */
export function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateStr;
  }
}

/**
 * Status color configurations - Printo Brand Color System
 */
export const STATUS_CONFIG = {
  'New': {
    bg: 'bg-[#EBE8E3] text-[#2B2B2B] border-[#E2DDD6]',
    dot: 'bg-[#2B2B2B]',
    border: 'border-[#2B2B2B]'
  },
  'Contacted': {
    bg: 'bg-[#FDF1EB] text-[#E8622C] border-[#F8DCD0]',
    dot: 'bg-[#E8622C]',
    border: 'border-[#E8622C]'
  },
  'Interested': {
    bg: 'bg-[#F4F8E8] text-[#55750C] border-[#D6E6B0]',
    dot: 'bg-[#A8C93C]',
    border: 'border-[#A8C93C]'
  },
  'Follow-up': {
    bg: 'bg-[#FDF7EA] text-[#B9801C] border-[#F6E2B6]',
    dot: 'bg-[#D89C2B]',
    border: 'border-[#D89C2B]'
  },
  'Quotation Sent': {
    bg: 'bg-[#FDF1EB] text-[#D0521F] border-[#F8DCD0]',
    dot: 'bg-[#D0521F]',
    border: 'border-[#D0521F]'
  },
  'Won': {
    bg: 'bg-[#F0F6EB] text-[#5C8A3A] border-[#D3E5C7]',
    dot: 'bg-[#5C8A3A]',
    border: 'border-[#5C8A3A]'
  },
  'Lost': {
    bg: 'bg-[#FBF0EF] text-[#B23A2E] border-[#E8BDB8]',
    dot: 'bg-[#B23A2E]',
    border: 'border-[#B23A2E]'
  },
  'Not Reachable': {
    bg: 'bg-[#FAF8F5] text-[#8C8782] border-[#E2DDD6]',
    dot: 'bg-[#8C8782]',
    border: 'border-[#8C8782]'
  },
  'Already Customer': {
    bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    dot: 'bg-indigo-600',
    border: 'border-indigo-600'
  }
};

/**
 * Determine follow-up urgency status
 */
export function getFollowUpStatus(followUpDate, leadStatus) {
  if (!followUpDate) return { type: 'none', label: 'No date', badgeClass: 'text-[#8C8782]' };
  if (['Won', 'Lost', 'Already Customer'].includes(leadStatus)) {
    return { type: 'closed', label: formatDate(followUpDate), badgeClass: 'text-[#8C8782]' };
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const targetDateStr = String(followUpDate).split('T')[0];

  if (targetDateStr === todayStr) {
    return {
      type: 'today',
      label: 'Today',
      fullDate: formatDate(followUpDate),
      badgeClass: 'bg-[#FDF7EA] text-[#B9801C] border-[#F6E2B6] font-semibold'
    };
  }

  if (targetDateStr < todayStr) {
    return {
      type: 'overdue',
      label: 'Overdue',
      fullDate: formatDate(followUpDate),
      badgeClass: 'bg-[#FBF0EF] text-[#B23A2E] border-[#E8BDB8] font-semibold pulse-urgent'
    };
  }

  return {
    type: 'upcoming',
    label: formatDate(followUpDate),
    fullDate: formatDate(followUpDate),
    badgeClass: 'bg-[#EBE8E3] text-[#2B2B2B] border-[#E2DDD6]'
  };
}

/**
 * Format group date heading with relative day labels (Today, Yesterday, etc.)
 */
export function formatGroupDateHeading(dateStr) {
  if (!dateStr) return 'Date Not Recorded';
  try {
    const target = new Date(dateStr);
    if (isNaN(target.getTime())) return dateStr;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const targetZero = new Date(target);
    targetZero.setHours(0, 0, 0, 0);

    const diffMs = today.getTime() - targetZero.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    const options = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
    const dateFormatted = targetZero.toLocaleDateString('en-US', options);

    if (diffDays === 0) {
      return `Today • ${dateFormatted}`;
    } else if (diffDays === 1) {
      return `Yesterday • ${dateFormatted}`;
    } else if (diffDays > 1 && diffDays < 7) {
      return `${diffDays} days ago • ${dateFormatted}`;
    } else {
      return dateFormatted;
    }
  } catch {
    return dateStr;
  }
}

/**
 * Group array of leads by upload/created_at date
 */
export function groupLeadsByDate(leadsList = []) {
  const groups = [];
  const map = new Map();

  for (const lead of leadsList) {
    let dateKey = 'unknown';
    if (lead.created_at) {
      const d = new Date(lead.created_at);
      if (!isNaN(d.getTime())) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        dateKey = `${year}-${month}-${day}`;
      }
    }

    if (!map.has(dateKey)) {
      map.set(dateKey, {
        dateKey,
        rawDate: lead.created_at,
        leads: []
      });
      groups.push(map.get(dateKey));
    }

    map.get(dateKey).leads.push(lead);
  }

  return groups;
}

