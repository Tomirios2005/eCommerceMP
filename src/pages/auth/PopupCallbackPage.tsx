import { useEffect } from "react";
import { supabase } from "../../lib/supabase";

export default function PopupCallbackPage() {
    useEffect(() => {
        const finishLogin=async () => {
            await supabase.auth.getSession()
        if(window.opener) {
            console.log('Notificando a la ventana principal del éxito del login'+window.location.origin);
            window.opener?.postMessage({ type: 'google-login-success' }, window.location.origin);
        }
        window.close();
    }
    finishLogin();
    }, []);
    return <p>ingresando...</p>;
}