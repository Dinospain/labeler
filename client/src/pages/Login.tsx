import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi, type Account } from '../api/auth'
import { errorMessage } from '../api/client'
import { getAccountSlug, setAccountSlug, clearAccountSlug } from '../utils/account'

export default function Login() {
    const nav = useNavigate()
    const [accounts, setAccounts] = useState<Account[]>([])
    const [slug, setSlug] = useState<string>(getAccountSlug() || '')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        authApi.accounts()
            .then(setAccounts)
            .catch(() => setAccounts([]))
    }, [])

    const doLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        const s = slug.trim()
        if (!s) { setError('Выберите предприятие или введите slug'); return }
        setLoading(true)
        try {
            await authApi.login(s)
            setAccountSlug(s)
            nav('/') // домой
        } catch (e) {
            setError(errorMessage(e))
        } finally {
            setLoading(false)
        }
    }

    const logout = () => {
        clearAccountSlug()
        setSlug('')
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
            <div className="w-full max-w-md bg-white border rounded-2xl p-6 shadow-sm">
                <h1 className="text-xl font-semibold mb-4">Вход по предприятию</h1>

                <form onSubmit={doLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm mb-1">Выберите предприятие</label>
                        <select
                            className="w-full border rounded-lg px-3 py-2 bg-white"
                            value={slug}
                            onChange={(e) => setSlug(e.target.value)}
                        >
                            <option value="">— Не выбрано —</option>
                            {accounts.map(a => (
                                <option key={a.id} value={a.slug}>{a.name} ({a.slug})</option>
                            ))}
                        </select>
                    </div>

                    <div className="text-center text-sm text-slate-400">или</div>

                    <div>
                        <label className="block text-sm mb-1">Введите slug вручную</label>
                        <input
                            className="w-full border rounded-lg px-3 py-2"
                            placeholder="например: hlebzavod или restaurant"
                            value={slug}
                            onChange={(e) => setSlug(e.target.value)}
                        />
                    </div>

                    {error && <div className="text-rose-600 text-sm">{error}</div>}

                    <div className="flex items-center gap-2">
                        <button
                            type="submit"
                            disabled={loading || !slug.trim()}
                            className="px-4 py-2 rounded-xl bg-sky-300 text-black hover:bg-sky-400 border border-sky-400 disabled:opacity-50"
                        >
                            Войти
                        </button>
                        <button
                            type="button"
                            onClick={logout}
                            className="px-4 py-2 rounded-xl bg-gray-200 text-black hover:bg-gray-300 border border-gray-300"
                        >
                            Сбросить
                        </button>
                    </div>
                </form>

                <div className="text-xs text-slate-400 mt-4">
                    Подготовленные предприятия: <b>Хлебозавод</b> (slug: <code>hlebzavod</code>) и <b>Ресторан</b> (slug: <code>restaurant</code>).
                </div>
            </div>
        </div>
    )
}
