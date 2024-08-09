import { ChangeEvent, FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation';
import { signUp } from '../../api/authApis';

export default function SignUpForm() {

	const router = useRouter();
    const [error, setError] = useState<string>('');
    const [userName, setUserName] = useState<string>('');
    const [password, setPassword] = useState<string>('');

    const handleUserNameChange = (e: ChangeEvent<HTMLInputElement>) => {
        setUserName(e.target.value)
    }

    const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value)
    }

    const handleSignUp = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const result = await signUp(userName, password);
        if (!result.rawResponse?.ok) {
			setError(result.message);
        } else {
            router.push('/files');
        }
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
