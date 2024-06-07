"use client"

import { useEffect, useState } from 'react'
import SignUpForm from "./signUpForm";
import SignInForm from "./signInForm";

export default function Page() {
  	const [useSignUp, setUseSignUp] = useState<boolean>(false);
  	const toggleUseSignUp = () => { setUseSignUp(!useSignUp) };

	useEffect(() => {
		localStorage.removeItem('Jwt');
		fetch(
			`${process.env.NEXT_PUBLIC_SERVER_URL}/auth/sign-out`,
			{
				method: 'GET',
				credentials: 'include'
			}
		);
	}, [])

  return (
	  <main className='flex flex-col items-center rounded-md xl:w-2/5 md-x-3/5 m-auto p-8'>
		{
			useSignUp
			?
				<div className='w-4/5'>
					<SignUpForm></SignUpForm>
					<div className='flex flex-col items-end mt-3'>
						<p>Already have an account?</p>
							<button
								className='border-none text-blue-700 p-3 font-bold'
								onClick={toggleUseSignUp}>
								Sign In
							</button>
					</div>
				</div>
			:
				<div className='w-4/5'>
					<SignInForm></SignInForm>
					<div className='flex flex-col items-end mt-3'>
						<p>Haven&apos;t got an account?</p>
							<button
								className='border-none text-blue-700 p-3 font-bold'
								onClick={toggleUseSignUp}>
								Sign Up
							</button>
					</div>
				</div>
		}
	</main>
  )
}
