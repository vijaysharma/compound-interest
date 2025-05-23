import { SetStateAction, useState } from "react";

const Login = ({
  action,
}: {
  action: React.Dispatch<SetStateAction<string>>;
}) => {
  const [at, setAT] = useState("");
  const login = () => {
    if (at === import.meta.env.VITE_ALLOWED_EMAIL) {
      localStorage.setItem("at", import.meta.env.VITE_ACCESS_TOKEN);
      action(import.meta.env.VITE_ACCESS_TOKEN);
    }
  };
  return (
    <>
      <h1 className="title">
        You are not authorized to access this app. Please use your authorized
        email to login.
      </h1>

      <div className="join w-full">
        <input
          className="join-item grow input input-bordered input-primary w-full focus:outline-none"
          placeholder="Email"
          value={at}
          onChange={(e) => setAT(e.target.value)}
        />
        <button
          className="join-item btn-bordered btn-primary btn grow"
          onClick={() => login()}
        >
          Login
        </button>
      </div>
    </>
  );
};

export default Login;
