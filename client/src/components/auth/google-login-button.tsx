'use client'

import { GoogleLogin } from '@react-oauth/google'
import { useGoogleLogin } from '@/hooks/use-auth'

export function GoogleLoginButton() {
  const googleLoginMutation = useGoogleLogin()

  return (
    <div className="flex justify-center">
      <GoogleLogin
        onSuccess={(credentialResponse) => {
          if (credentialResponse.credential) {
            googleLoginMutation.mutate({ idToken: credentialResponse.credential })
          }
        }}
        onError={() => {
          // Error handled by mutation onError
        }}
        text="signin_with"
        shape="rectangular"
        width="400"
      />
    </div>
  )
}
