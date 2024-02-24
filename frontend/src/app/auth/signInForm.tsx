import React, { ChangeEvent, FormEvent, useState } from 'react';
import { JWT_STORAGE_KEY } from '../constants'
import { useRouter } from 'next/navigation';

export default function SignInForm() {
	const router = useRouter();

    const [error, setError] = useState<string>('');
    const [userName, setUserName] = useState<string>('');
    const [password, setPassword] = useState<string>('');

    const handleUserNameChange = (e: ChangeEvent<HTMLInputElement>) => {
        setUserName(e.target.value);
    }

    const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value);
	}

	const signIn = async () => {
		const requestBody = {
            userName,
            password
        };

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/auth/sign-in`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody),
                credentials: 'include'
            });

			if (!response.ok) {
				console.error('Error signing in: ', response.status);
                setError("Incorrect credentials");
				return
			}

			console.log('Successfully signed in');
			router.push('/files')
        } catch (e) {
            console.error('Error signing in: ', e);
            setError("Unknown Error");
        }
	}

	const handleSignIn = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		await signIn()
    }

    return (
        <div>
			<h1 className='text-4xl mb-3'>Sign In</h1>
			{
                error &&
                <p className='text-red-700 bg-red-50 p-3 my-3'>
                    Error: {error}
                </p>
            }
            <form className='flex flex-col' onSubmit={handleSignIn}>
                <label htmlFor="userName">User Name</label>
                <input
                    className='my-1 p-2 w-full outline-orange-50 border border-gray-300 focus:border-blue-500 rounded-md'
                    type="text"
                    id="userName"
                    name="userName"
                    value={userName}
                    onChange={handleUserNameChange}
                    required />

                <label htmlFor="password">Password</label>
                <input
                    className='my-1 p-2 w-full outline-orange-50 border border-gray-300 focus:border-blue-500 rounded-md'
                    type="password"
                    id="password"
                    name="password"
                    value={password}
                    onChange={handlePasswordChange}
                    required />

                <button type="submit" className='bg-blue-700 bg-none border-none text-white p-3 rounded-md mt-2 shadow-md hover:shadow-lg'>
                    Sign In
                </button>
            </form>
        </div>
    );
}
