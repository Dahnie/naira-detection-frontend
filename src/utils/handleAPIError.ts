/* eslint-disable @typescript-eslint/no-explicit-any */
import { toastHandler } from "./toastHandlerSingleton";

// Handle API Error Fxn
export const handleAPIError = function (err: any) {
  const errMessage = handleSerializeError(err);
  //   Set the error handdler state
  if (errMessage) toastHandler.error(errMessage);
};

export const handleSerializeError = function (err: any): string {
  const errMessage =
    err?.statusText ||
    err?.response?.data?.detail ||
    err?.response?.data?.message ||
    err?.response?.data ||
    err?.data?.message ||
    err?.data ||
    err?.message;
  if (typeof errMessage === "string") {
    return errMessage;
  }
  return "Something Went Wrong. Please Check your Connection and try again";
};
