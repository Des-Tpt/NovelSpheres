import { toast } from 'sonner';

export const notifyError = (msg: string) =>
  toast.error(msg, {
    style: {
      backgroundColor: '#fee2e2',
      color: '#991b1b',
      border: '1px solid #ef4444',
    },
  });

export const notifySuccess = (msg: string) =>
  toast.success(msg, {
    style: {
      backgroundColor: '#d1fae5',
      color: '#065f46',
      border: '1px solid #34d399',
    },
  });
