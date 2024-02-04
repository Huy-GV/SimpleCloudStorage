"use client"

import { useState } from "react"
import SignUpForm from "./signUpForm";
import SignInForm from "./signInForm";
import styles from "./auth.module.css"

export default function Page() {
  const [useSignUp, setUseSignUp] = useState<boolean>(false);
  const toggleUseSignUp = () => { setUseSignUp(!useSignUp) };

  return (
      <main className={styles.main}>
        {
            useSignUp
            ?
            <div className={styles.formContainer}>
                <SignUpForm></SignUpForm>
                <div>
                    <p>Already have an account?</p>
                    <button onClick={toggleUseSignUp}>Sign In</button>
                </div>
            </div>
            :
            <div className={styles.formContainer}>
                <SignInForm></SignInForm>
                <div>
                    <p>Haven't got an account?</p>
                    <button onClick={toggleUseSignUp}>Sign Up</button>
                </div>
            </div>
        }
    </main>
  )
}
