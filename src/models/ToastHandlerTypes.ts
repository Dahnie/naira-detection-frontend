export interface ToastHandlerType {
  show: boolean;
  message: string;
}

export type SetToastHandlerType = React.Dispatch<
  React.SetStateAction<ToastHandlerType>
>;

export interface IToastHandlerContextType {
  errorHandlerObj: ToastHandlerType;
  successHandlerObj: ToastHandlerType;
  warningHandlerObj: ToastHandlerType;
  setErrorHandlerObj: SetToastHandlerType;
  setSuccessHandlerObj: SetToastHandlerType;
  setWarningHandlerObj: SetToastHandlerType;
}
