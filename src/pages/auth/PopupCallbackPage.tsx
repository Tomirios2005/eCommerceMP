import { useEffect } from "react";

export default function PopupCallbackPage() {
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace("#", "?"));
    const params = new URLSearchParams();

    for (const [key, value] of searchParams.entries()) {
      params.set(key, value);
    }
    for (const [key, value] of hashParams.entries()) {
      params.set(key, value);
    }

    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    const closePopup = () => {
      window.close();
      if (!window.closed) {
        window.open("", "_self");
        window.close();
      }
    };

    if (window.opener && accessToken) {
      console.log('Notificando tokens a la ventana principal...');

      window.opener.postMessage(
        {
          type: 'google-login-success',
          tokens: {
            access_token: accessToken,
            refresh_token: refreshToken,
          },
        },
        window.location.origin
      );
    }

    closePopup();
  }, []);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'sans-serif' }}>
      <p>Sincronizando sesión de forma segura...</p>
    </div>
  );
}