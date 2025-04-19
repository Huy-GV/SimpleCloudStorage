"use client"

import { useEffect, useState } from 'react'
import SignUpForm from "./signUpForm";
import SignInForm from "./signInForm";
import { signOut } from '@/api/authApis';

export default function Page() {
  	const [useSignUp, setUseSignUp] = useState<boolean>(false);
  	const toggleUseSignUp = () => { setUseSignUp(!useSignUp) };

	useEffect(() => {
		signOut();
	}, [])

  	return (
	  	<main className='flex flex-col items-center rounded-md w-full sm:w-3/5 md:w-2/5 m-auto p-8'>
		{
			useSignUp
			?
				<div className='w-full'>
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
				<div className='w-full'>
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
