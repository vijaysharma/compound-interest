import React from "react";

const Toast = ({ message, type = "alert" }) => {
  return (
    <div className="toast toast-bottom toast-center">
      <div className={`${type} ${type}-success`}>
        <span>{message}</span>
      </div>
    </div>
  );
};

export default Toast;
