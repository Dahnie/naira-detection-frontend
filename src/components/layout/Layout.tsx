import ErrorHandler from "@components/toast-handler-components/error-handler/ErrorHandler";
import SuccessHandler from "@components/toast-handler-components/success-handler/SuccessHandler";
import WarningHandler from "@components/toast-handler-components/warning-handler/WarningHandler";
import { handleClearToastMessage } from "@hooks/useDisplayMessage";
import { ToastHandlerContext } from "@contexts/ToastHandlerContext";
import React, { useContext, useEffect } from "react";

// Interfaces
interface ILayoutProps {
  children: React.ReactNode;
}

function Layout({ children }: ILayoutProps) {
  // Functions, States and Variables
  const locationPathname = window.location.pathname;
  const {
    errorHandlerObj,
    successHandlerObj,
    warningHandlerObj,
    setErrorHandlerObj,
    setSuccessHandlerObj,
    setWarningHandlerObj,
  } = useContext(ToastHandlerContext);

  useEffect(() => {
    // Clear the toast message on component unmount
    return () => {
      handleClearToastMessage(
        setErrorHandlerObj,
        setSuccessHandlerObj,
        setWarningHandlerObj
      );
    };
  }, [locationPathname]);

  return (
    <div className="app_page_container">
      {/* Error handler component */}
      <ErrorHandler errorHandlerObj={errorHandlerObj} />

      {/* Success handler component */}
      <SuccessHandler successHandlerObj={successHandlerObj} />

      {/* Warning handler component */}
      <WarningHandler warningHandlerObj={warningHandlerObj} />

      {children}
    </div>
  );
}

export default Layout;
