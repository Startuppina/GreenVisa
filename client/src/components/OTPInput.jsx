import React, { useState, useEffect, useRef } from "react";
import { useRecoveryContext } from "../provider/provider";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import MessagePopUp from "./messagePopUp";

export default function OTPInput() {
  const { email, OTP } = useRecoveryContext();
  const [timerCount, setTimer] = useState(300);
  const [OTPinput, setOTPinput] = useState(["", "", "", ""]);
  const [disable, setDisable] = useState(true);
  const navigate = useNavigate();
  const [buttonPopup, setButtonPopup] = useState(false);
  const [messagePopup, setMessagePopup] = useState("");

  // Refs for inputs
  const inputRefs = useRef([]);

  useEffect(() => {
    // Focus the first input field on load
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    // Timer logic
    let interval = setInterval(() => {
      setTimer((lastTimerCount) => {
        if (lastTimerCount <= 1) {
          clearInterval(interval);
          setDisable(false);
          return lastTimerCount;
        }
        return lastTimerCount - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [disable]);

  function resendOTP() {
    if (disable) return;

    const recoveryToken = localStorage.getItem("recoveryToken");
    axios
      .post("http://localhost:5000/send_recovery_email", {
        OTP: OTP,
        recipient_email: email,
      }, {
        headers: {
          "Authorization": `Bearer ${recoveryToken}`,
        },
      })
      .then(() => {
        setDisable(true);
        setTimer(60);
        setMessagePopup("A new OTP has successfully been sent to your email.");
        setButtonPopup(true);
      })
      .catch(() => {
        setMessagePopup("Failed to resend OTP");
        setButtonPopup(true);
      });
  }

  function verifyOTP() {
    if (parseInt(OTPinput.join("")) === OTP) {
      navigate("/Reset");
    } else {
      setMessagePopup("OTP non corretto");
      setButtonPopup(true);
    }
  }

  function handleChange(e, index) {
    const { value } = e.target;

    if (value.length > 1) return; // Allow only single character input

    const newOTP = [...OTPinput];
    newOTP[index] = value;

    setOTPinput(newOTP);

    // Move to the next input field if the current field is filled
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(e, index) {
    if (e.key === "Backspace" && !OTPinput[index]) {
      if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  }

  return (
    <>
      <MessagePopUp trigger={buttonPopup} setTrigger={setButtonPopup}>
        {messagePopup}
      </MessagePopUp>
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
                <p>Abbiamo inviato un codice di 4 cifre alla tua email</p>
              </div>
            </div>

            <div>
              <form>
                <div className="flex flex-col space-y-16">
                  <div className="flex flex-row items-center justify-between mx-auto w-full max-w-xs">
                    {OTPinput.map((value, index) => (
                      <div key={index} className="w-16 h-16">
                        <input
                          ref={(el) => inputRefs.current[index] = el}
                          maxLength="1"
                          className="w-full h-full flex flex-col items-center justify-center text-center px-5 outline-none rounded-xl border border-gray-200 text-lg bg-white focus:bg-gray-50 focus:ring-1 ring-blue-700"
                          type="text"
                          value={value}
                          onChange={(e) => handleChange(e, index)}
                          onKeyDown={(e) => handleKeyDown(e, index)}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col space-y-5">
                    <div>
                      <a
                        onClick={() => verifyOTP()}
                        className="font-bold flex flex-row cursor-pointer items-center justify-center text-center text-xl w-full border rounded-xl outline-none py-5 bg-[#2d7044] text-white hover:bg-white hover:text-[#2d7044] hover:border-2 hover:border-[#2d7044] transition-colors duration-300 ease-in-out"
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
                          cursor: disable ? "default" : "pointer",
                          textDecorationLine: disable
                            ? "none"
                            : "underline text-[#2d7044]",
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
    </>
  );
}
