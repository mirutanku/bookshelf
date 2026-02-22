import { useState } from 'react'
import api from '../api'

function LoginForm({ onLogin }) {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [isRegistering, setIsRegistering] = useState(false)
    const [error, setError] = useState('')

    async function handleSubmit(e) {
        e.preventDefault()
        setError('')

        try {
            if (isRegistering) {
                await api.post('/api/register', { username, password })
            }
            const response = await api.post('/api/login', { username, password })
            localStorage.setItem('token', response.data.access_token)
            onLogin()
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong')
        }
    }

    return (
        <div className="login-form">
            <h2>{isRegistering ? 'Register' : 'Login'}</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Username</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                {error && <p className="error">{error}</p>}
                <button type="submit">
                    {isRegistering ? 'Register' : 'Login'}
                    </button>
            </form>
            <p>
                {isRegistering ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button
                    type="button"
                    className="link-button"
                    onClick={() => {
                        setIsRegistering(!isRegistering)
                        setError('')
                    }}
                >
                    {isRegistering ? 'Login' : 'Register'}
                </button>
            </p>
        </div>
    )
}

export default LoginForm