import { ChangeEvent, FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation';

export default function SignUpForm() {

	const router = useRouter();
    const [error, setError] = useState<string>('');
    const [userName, setUserName] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [email, setEmail] = useState<string>('');

    const handleUserNameChange = (e: ChangeEvent<HTMLInputElement>) => {
        setUserName(e.target.value)
    }

    const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value)
    }

    const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value)
    }

    const signUp = async () => {
        const requestBody = {
            userName,
            password,
            email,
        };

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_SERVER_URL}/auth/sign-up`,
                {
                    body: JSON.stringify(requestBody),
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                })

            if (!response.ok) {
                console.error('Failed to sign up: ', response.statusText)
                setError("Incorrect credentials");
                return;
            }

			router.push('/files')
        } catch (e) {
            console.error('Failed to sign up: ', e)
            setError('An unknown error occurred');
        }
    }

    const handleSignUp = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        await signUp();
    }

    return (
        <>
            <h1 className='text-4xl mb-3'>Sign Up</h1>
            {
                error &&
                <p className='text-red-700 bg-red-50 p-3 my-3'>
                    Error: {error}
                </p>
            }
            <form className='flex flex-col' onSubmit={handleSignUp}>
                <label htmlFor='userName'>User Name</label>
                <input
                    className='my-1 p-2 w-full outline-orange-50 border border-gray-300 focus:border-blue-500 rounded-md'
                    type='text'
                    id='userName'
                    name='userName'
                    value={userName}
                    onChange={handleUserNameChange}
                    required />

                <label htmlFor='email'>Email</label>
                <input
                    className='my-1 p-2 w-full outline-orange-50 border border-gray-300 focus:border-blue-500 rounded-md'
                    type='text'
                    id='email'
                    name="email"
                    value={email}
                    onChange={handleEmailChange}
                    required />

                <label htmlFor='password'>Password</label>
                <input
                    className='my-1 p-2 w-full outline-orange-50 border border-gray-300 focus:border-blue-500 rounded-md'
                    type='password'
                    id='password'
                    name='password'
                    value={password}
                    onChange={handlePasswordChange}
                    required />

                <button type="submit" className='bg-blue-700 bg-none border-none text-white p-3 rounded-md mt-2 shadow-md hover:shadow-lg'>
                    Sign Up
                </button>
            </form>
    </>
    )
  }
