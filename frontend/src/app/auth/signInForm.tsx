import React, { ChangeEvent, FormEvent, useState } from 'react';
import styles from './auth.module.css'; // Assuming you have a CSS module for styling
import { JWT_STORAGE_KEY, SERVER_URL } from '../constants'
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
            const response = await fetch(`${SERVER_URL}/auth/sign-in`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

			if (!response.ok) {
				console.error('Error signing in: ', response.status);
                setError("Incorrect credentials");
				return
			}

			const jwtDto = await response.json();
			localStorage.setItem(JWT_STORAGE_KEY, jwtDto.token)
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
			<h1>Sign In</h1>
			{
                error &&
                <div>
                    Sign In Error: {error}
                </div>
            }
            <form className={styles.authForm} onSubmit={e => handleSignIn(e)}>
                <label htmlFor="userName">User Name</label>
                <input
                    type="text"
                    id="userName"
                    name="userName"
                    value={userName}
                    onChange={handleUserNameChange}
                    required
                />

                <label htmlFor="password">Password</label>
                <input
                    type="password"
                    id="password"
                    name="password"
                    value={password}
                    onChange={handlePasswordChange}
                    required
                />

                <button type="submit" className={styles.signInBtn}>Sign In</button>
            </form>
        </div>
    );
}
