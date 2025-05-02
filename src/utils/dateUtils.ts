
import { format, subDays, isToday, isYesterday, isSameWeek } from 'date-fns';

export const formatDate = (date: Date): string => {
  if (isToday(date)) {
    return 'Today';
  }
  if (isYesterday(date)) {
    return 'Yesterday';
  }
  if (isSameWeek(date, new Date())) {
    return format(date, 'EEEE'); // Day name
  }
  return format(date, 'MMM d, yyyy'); // May 1, 2023
};

export const formatTime = (date: Date): string => {
  return format(date, 'h:mm a'); // 3:30 PM
};

export const getDateRange = (days: number): Date[] => {
  const dates: Date[] = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    dates.push(subDays(today, i));
  }
  
  return dates;
};

export const getDateRangeLabel = (days: number): string => {
  switch (days) {
    case 1:
      return 'Today';
    case 7:
      return 'This Week';
    case 30:
      return 'This Month';
    default:
      return `Last ${days} Days`;
  }
};
