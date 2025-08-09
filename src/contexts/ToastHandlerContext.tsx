import React, { createContext, useEffect } from "react";
import { toastHandler } from "@utils/toastHandlerSingleton";
import { IToastHandlerContextType } from "@models/ToastHandlerTypes";
import useDisplayMessage from "@hooks/useDisplayMessage";

interface IToastHandlerProviderProps {
  children: React.ReactNode;
}

export const ToastHandlerContext = createContext<IToastHandlerContextType>({
  errorHandlerObj: { show: false, message: "" },
  successHandlerObj: { show: false, message: "" },
  warningHandlerObj: { show: false, message: "" },
  setErrorHandlerObj: () => {},
  setSuccessHandlerObj: () => {},
  setWarningHandlerObj: () => {},
});

function ToastHandlerContextProvider({ children }: IToastHandlerProviderProps) {
  const {
    errorHandlerObj,
    successHandlerObj,
    warningHandlerObj,
    setErrorHandlerObj,
    setSuccessHandlerObj,
    setWarningHandlerObj,
  } = useDisplayMessage();

  useEffect(() => {
    toastHandler.setSuccess((msg) => {
      setSuccessHandlerObj({ show: true, message: msg });
    });

    toastHandler.setError((msg) => {
      setErrorHandlerObj({ show: true, message: msg });
    });

    toastHandler.setWarning((msg) => {
      setWarningHandlerObj({ show: true, message: msg });
    });
  }, []);
  return (
    <ToastHandlerContext.Provider
      value={{
        errorHandlerObj,
        successHandlerObj,
        warningHandlerObj,
        setErrorHandlerObj,
        setSuccessHandlerObj,
        setWarningHandlerObj,
      }}
    >
      {children}
    </ToastHandlerContext.Provider>
  );
}

export default ToastHandlerContextProvider;
