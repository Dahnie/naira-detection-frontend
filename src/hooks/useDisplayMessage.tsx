import { useEffect, useState } from "react";
import {
  SetToastHandlerType,
  ToastHandlerType,
} from "@models/ToastHandlerTypes";

// Functions
export const handleClearToastMessage = function (
  setErrorHandlerObj?: SetToastHandlerType | null,
  setSuccessHandlerObj?: SetToastHandlerType | null,
  setWarningHandlerObj?: SetToastHandlerType | null
) {
  if (!setErrorHandlerObj && !setSuccessHandlerObj && !setWarningHandlerObj)
    return;
  if (setSuccessHandlerObj)
    setSuccessHandlerObj((prev) => ({ ...prev, show: false }));
  if (setErrorHandlerObj)
    setErrorHandlerObj((prev) => ({ ...prev, show: false }));
  if (setWarningHandlerObj)
    setWarningHandlerObj((prev) => ({ ...prev, show: false }));
};

function useDisplayMessage() {
  // Functions, States and Variables
  // States
  const [errorHandlerObj, setErrorHandlerObj] = useState<ToastHandlerType>({
    show: false,
    message: "",
  });
  const [successHandlerObj, setSuccessHandlerObj] = useState<ToastHandlerType>({
    show: false,
    message: "",
  });
  const [warningHandlerObj, setWarningHandlerObj] = useState<ToastHandlerType>({
    show: false,
    message: "",
  });

  // UseEffects
  useEffect(() => {
    //scroll to page top
    if (successHandlerObj.show) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    if (
      errorHandlerObj.show ||
      successHandlerObj.show ||
      warningHandlerObj.show
    ) {
      // Clear all toast messages after 15 seconds
      const timeout = setTimeout(() => {
        handleClearToastMessage(
          setErrorHandlerObj,
          setSuccessHandlerObj,
          setWarningHandlerObj
        );
      }, 10000);
      return () => {
        clearTimeout(timeout);
      };
    }
  }, [errorHandlerObj, successHandlerObj, warningHandlerObj]);

  // If response is failure, remove success and warning message
  useEffect(() => {
    if (errorHandlerObj.show) {
      setSuccessHandlerObj({ show: false, message: "" });
      setWarningHandlerObj({ show: false, message: "" });
    }
  }, [errorHandlerObj]);

  // If response is success, remove failure and warning message
  useEffect(() => {
    if (successHandlerObj.show) {
      setErrorHandlerObj({ show: false, message: "" });
      setWarningHandlerObj({ show: false, message: "" });
    }
  }, [successHandlerObj]);

  // If response is warning, remove failure and success message
  useEffect(() => {
    if (warningHandlerObj.show) {
      setErrorHandlerObj({ show: false, message: "" });
      setSuccessHandlerObj({ show: false, message: "" });
    }
  }, [warningHandlerObj]);

  return {
    errorHandlerObj,
    successHandlerObj,
    warningHandlerObj,
    setErrorHandlerObj,
    setSuccessHandlerObj,
    setWarningHandlerObj,
  };
}

export default useDisplayMessage;
