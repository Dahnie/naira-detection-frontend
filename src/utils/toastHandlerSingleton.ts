type ToastFn = (msg: string) => void;

let globalSuccessToast: ToastFn = () => {};
let globalErrorToast: ToastFn = () => {};
let globalWarningToast: ToastFn = () => {};

export const toastHandler = {
  setSuccess(fn: ToastFn) {
    globalSuccessToast = fn;
  },
  setError(fn: ToastFn) {
    globalErrorToast = fn;
  },
  setWarning(fn: ToastFn) {
    globalWarningToast = fn;
  },
  success(message: string) {
    globalSuccessToast(message);
  },
  error(message: string) {
    globalErrorToast(message);
  },
  warning(message: string) {
    globalWarningToast(message);
  },
};
