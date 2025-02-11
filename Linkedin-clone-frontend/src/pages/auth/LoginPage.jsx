import Login_Img from "../../assets/images/1dhh8rr3wohexkaya6jhn2y8j.svg";
import { LoginForm } from "../../components/auth/LoginForm";


export const LoginPage = () => {
  return (
    <div className="h-9/10 w-full flex bg-[#F4F2EE]">
      <div className=" w-1/2 h-full flex justify-center items-center">
        {/* {Actual Login form} */}
        <div className="w-full flex flex-col justify-center items-start p-24 gap-10">
          <h1 className="text-[#526a6e] text-5xl font-normal w-[90%]">
            Welcome to your professional community
          </h1>
          <LoginForm />
        </div>
      </div>
      <div className="flex items-end justify-center w-1/2 h-full">
        {/* {Image} */}
        <img src={Login_Img} className="h-11/12 w-3/4" alt="" />
      </div>
    </div>
  );
};
