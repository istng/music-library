module Api
  class AuthController < ApplicationController
    def spotify
      SpotifyCredentialService.store(
        access_token:  params.require(:accessToken),
        refresh_token: params.require(:refreshToken),
        expires_at:    params.require(:expiresAt)
      )
      head :ok
    end
  end
end
