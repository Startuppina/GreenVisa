import React from "react";
import { useState } from "react";
import { useRecoveryContext } from "../provider/provider";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function OTPInput() {
    const { email, OTP } = useRecoveryContext();
    const [timerCount, setTimer] = useState(300);
    const [OTPinput, setOTPinput] = useState([0, 0, 0, 0]);
    const [disable, setDisable] = useState(true);
    const navigate = useNavigate();

    
    function resendOTP() {
        if (disable) return;
        axios
          .post("http://localhost:5000/send_recovery_email", {
            OTP: OTP,
            recipient_email: email,
          })
          .then(() => setDisable(true))
          .then(() => alert("A new OTP has succesfully been sent to your email."))
          .then(() => setTimer(60))
          .catch(console.log);
      }
    
      function verfiyOTP() {
        if (parseInt(OTPinput.join("")) === OTP) {
          navigate("/Reset");
          return;
        }
        alert(
          "The code you have entered is not correct, try again or re-send the link"
        );
        return;
      }
    
      React.useEffect(() => {
        let interval = setInterval(() => {
          setTimer((lastTimerCount) => {
            lastTimerCount <= 1 && clearInterval(interval);
            if (lastTimerCount <= 1) setDisable(false);
            if (lastTimerCount <= 0) return lastTimerCount;
            return lastTimerCount - 1;
          });
        }, 1000); //each count lasts for a second
        //cleanup the interval on complete
        return () => clearInterval(interval);
      }, [disable]);

    return (
        <div className="flex flex-col justify-center items-center w-screen h-screen bg-gray-50 text-arial">
          <div className="text-center">
            <div className="mb-6">
              <img
                src="img/logo.png"
                alt="logo"
                className="w-[200px] h-[200px] mx-auto"
              />
        </div>
        </div>
          <div className="bg-white px-6 pt-10 pb-9 shadow-xl mx-auto w-full max-w-lg rounded-2xl">
            <div className="mx-auto flex w-full max-w-md flex-col space-y-16">
              <div className="flex flex-col items-center justify-center text-center space-y-2">
                <div className="font-semibold text-3xl">
                  <p>Verifica la tua email</p>
                </div>
                <div className="flex flex-row text-xl text-gray-400">
                  <p>Abbiamo invitato un codice di 4 cifre alla tua email</p>
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
                          onClick={() => verfiyOTP()}
                          className="font-bold flex flex-row cursor-pointer items-center justify-center text-center text-xl w-full border rounded-xl outline-none py-5 bg-[#2d7044] text-white hover:bg-white hover:text-[#2d7044] hover:border-2 hover:border-[#2d7044]   transition-colors duration-300 ease-in-out"
                        >
                          Verifica
                        </a>
                      </div>
    
                      <div className="flex flex-row items-center justify-center text-center text-xm font-medium space-x-1 text-gray-500">
                        <p>Non ha ricevuto il codice?</p>{" "}
                        <a
                          className="flex flex-row items-center"
                          style={{
                            color: disable ? "gray" : "blue",
                            cursor: "pointer",
                            textDecorationLine: disable ? "none" : "underline text-[#2d7044]",
                          }}
                          onClick={() => resendOTP()}
                        >
                          {disable ? `Rinvia tra ${timerCount}s` : "Rinvia"}
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
