const Toast = ({
  message,
  type = "alert",
}: {
  message: string;
  type: "info" | "alert" | "success";
}) => {
  return (
    <div className="toast toast-bottom toast-center">
      <div className={`${type} ${type}-success`}>
        <span>{message}</span>
      </div>
    </div>
  );
};

export default Toast;
