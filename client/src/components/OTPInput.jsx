import React from "react";

export default function OTPInput() {
    return (
        <div className="flex justify-center items-center w-screen h-screen bg-gray-50 text-arial">
          <div className="bg-white px-6 pt-10 pb-9 shadow-xl mx-auto w-full max-w-lg rounded-2xl">
            <div className="mx-auto flex w-full max-w-md flex-col space-y-16">
              <div className="flex flex-col items-center justify-center text-center space-y-2">
                <div className="font-semibold text-3xl">
                  <p>Email Verification</p>
                </div>
                <div className="flex flex-row text-xl text-gray-400">
                  <p>We have sent a code to your email</p>
                </div>
              </div>
    
              <div>
                <form>
                  <div className="flex flex-col space-y-16">
                    <div className="flex flex-row items-center justify-between mx-auto w-full max-w-xs">
                      <div className="w-16 h-16 ">
                        <input
                          maxLength="1"
                          className="w-full h-full flex flex-col items-center justify-center text-center px-5 outline-none rounded-xl border border-gray-200 text-lg bg-white focus:bg-gray-50 focus:ring-1 ring-blue-700"
                          type="text"
                          name=""
                          id=""
                          onChange={(e) =>
                            setOTPinput([
                              e.target.value,
                              OTPinput[1],
                              OTPinput[2],
                              OTPinput[3],
                            ])
                          }
                        ></input>
                      </div>
                      <div className="w-16 h-16 ">
                        <input
                          maxLength="1"
                          className="w-full h-full flex flex-col items-center justify-center text-center px-5 outline-none rounded-xl border border-gray-200 text-lg bg-white focus:bg-gray-50 focus:ring-1 ring-blue-700"
                          type="text"
                          name=""
                          id=""
                          onChange={(e) =>
                            setOTPinput([
                              OTPinput[0],
                              e.target.value,
                              OTPinput[2],
                              OTPinput[3],
                            ])
                          }
                        ></input>
                      </div>
                      <div className="w-16 h-16 ">
                        <input
                          maxLength="1"
                          className="w-full h-full flex flex-col items-center justify-center text-center px-5 outline-none rounded-xl border border-gray-200 text-lg bg-white focus:bg-gray-50 focus:ring-1 ring-blue-700"
                          type="text"
                          name=""
                          id=""
                          onChange={(e) =>
                            setOTPinput([
                              OTPinput[0],
                              OTPinput[1],
                              e.target.value,
                              OTPinput[3],
                            ])
                          }
                        ></input>
                      </div>
                      <div className="w-16 h-16 ">
                        <input
                          maxLength="1"
                          className="w-full h-full flex flex-col items-center justify-center text-center px-5 outline-none rounded-xl border border-gray-200 text-lg bg-white focus:bg-gray-50 focus:ring-1 ring-blue-700"
                          type="text"
                          name=""
                          id=""
                          onChange={(e) =>
                            setOTPinput([
                              OTPinput[0],
                              OTPinput[1],
                              OTPinput[2],
                              e.target.value,
                            ])
                          }
                        ></input>
                      </div>
                    </div>
    
                    <div className="flex flex-col space-y-5">
                      <div>
                        <a
                          //onClick={() => verfiyOTP()}
                          className="flex flex-row cursor-pointer items-center justify-center text-center text-xl w-full border rounded-xl outline-none py-5 bg-[#2d7044] text-white hover:bg-white hover:text-[#2d7044] hover:border-2 hover:border-[#2d7044]   transition-colors duration-300 ease-in-out"
                        >
                          Verify Account
                        </a>
                      </div>
    
                      <div className="flex flex-row items-center justify-center text-center text-xm font-medium space-x-1 text-gray-500">
                        <p>Didn't recieve code?</p>{" "}
                        <a
                          className="flex flex-row items-center"
                          //style={{
                            //color: disable ? "gray" : "blue",
                            //cursor: disable ? "none" : "pointer",
                            //textDecorationLine: disable ? "none" : "underline",
                          //}}
                          //onClick={() => resendOTP()}
                        >
                          {/*disable ? `Resend OTP in ${timerCount}s` : "Resend OTP"*/}
                        </a>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      );
}
