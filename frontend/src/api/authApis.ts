
export async function signIn(userName: string, password: string) {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/auth/sign-in`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            userName,
            password
        }),
        credentials: 'include'
    });

    const message = response.ok
        ? ''
        : response.status === 401 || response.status === 403
            ? `Failed to sign in: invalid credentials`
            : `Failed to sign in: ${response.status} error`;

    return {
        message: message,
        rawResponse: response
    };
}

export async function signUp(userName: string, password: string) {
    const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/auth/sign-up`,
        {
            body: JSON.stringify({
                userName,
                password,
            }),
            credentials: 'include',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
        })

    const message = response.ok
        ? ''
        : response.status === 401 || response.status === 403
            ? `Failed to sign up: invalid credentials`
            : `Failed to sign up: ${response.status} error`;

    return {
        message: message,
        rawResponse: response
    };
}

export async function signOut(): Promise<void> {
    await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/auth/sign-out`,
        {
            method: 'GET',
            credentials: 'include'
        }
    );
}
