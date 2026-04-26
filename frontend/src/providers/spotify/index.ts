import type { MusicProvider, SyncItem } from '../types'
import { initiateAuth, exchangeCode, refreshAccessToken, type TokenData } from './auth'
import { fetchSavedAlbumsRaw } from './api'

const TOKEN_KEY = 'spotify_token'

export class SpotifyProvider implements MusicProvider {
  private token: TokenData | null = null

  constructor(
    private readonly clientId: string,
    private readonly redirectUri: string,
  ) {
    const stored = localStorage.getItem(TOKEN_KEY)
    if (stored) this.token = JSON.parse(stored) as TokenData
  }

  isAuthenticated(): boolean {
    return this.token !== null
  }

  async authenticate(): Promise<void> {
    await initiateAuth(this.clientId, this.redirectUri)
  }

  async handleCallback(params: URLSearchParams): Promise<void> {
    const code = params.get('code')
    if (!code) throw new Error('No auth code in callback URL')
    this.token = await exchangeCode(code, this.clientId, this.redirectUri)
    localStorage.setItem(TOKEN_KEY, JSON.stringify(this.token))
  }

  async getSyncBatch(offset: number, limit: number): Promise<{ items: SyncItem[]; total: number; hasMore: boolean }> {
    const token = await this.getAccessToken()
    const data = await fetchSavedAlbumsRaw(token, offset, limit)
    return {
      items: data.items as unknown as SyncItem[],
      total: data.total,
      hasMore: data.hasMore,
    }
  }

  private async getAccessToken(): Promise<string> {
    if (!this.token) throw new Error('Not authenticated')
    if (Date.now() >= this.token.expiresAt - 60_000) {
      this.token = await refreshAccessToken(this.token.refreshToken, this.clientId)
      localStorage.setItem(TOKEN_KEY, JSON.stringify(this.token))
    }
    return this.token.accessToken
  }
}
