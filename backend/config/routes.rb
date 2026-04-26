Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api do
    resources :albums, only: [ :index, :show, :update ], param: :spotify_id
    post  "sync",          to: "sync#create"
    get   "sync/status",   to: "sync#status"
    post  "auth/spotify",  to: "auth#spotify"
  end
end
