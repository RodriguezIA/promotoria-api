export const getPromoterPasswordResetCodeTemplate = (
  userName: string,
  code: string,
): string => {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Código para restablecer tu contraseña</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .container { background-color: #f4f4f4; border-radius: 10px; padding: 30px; }
        .header { background-color: #2F7654; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background-color: white; padding: 30px; border-radius: 0 0 10px 10px; }
        .code { display: block; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2F7654; margin: 24px 0; padding: 16px; background: #ECFDF5; border-radius: 8px; }
        .footer { text-align: center; color: #888; font-size: 12px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header"><h1>Promotoria</h1></div>
        <div class="content">
          <p>Hola ${userName},</p>
          <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta de promotor. Usa este código en la app para continuar:</p>
          <span class="code">${code}</span>
          <p>Este código expira en 15 minutos. Si tú no solicitaste esto, puedes ignorar este correo — tu contraseña actual sigue funcionando.</p>
        </div>
      </div>
      <div class="footer">Promotoria</div>
    </body>
    </html>
  `
}

export const getPasswordResetTemplate = (
  userName: string,
  resetLink: string,
  _token: string,
): string => {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Recuperar Contraseña</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .container {
          background-color: #f4f4f4;
          border-radius: 10px;
          padding: 30px;
        }
        .header {
          background-color: #4CAF50;
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .content {
          background-color: white;
          padding: 30px;
          border-radius: 0 0 10px 10px;
        }
        .button {
          display: inline-block;
          padding: 12px 30px;
          background-color: #4CAF50;
          color: white;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
          font-weight: bold;
        }
        .button:hover {
          background-color: #45a049;
        }
        .footer {
          text-align: center;
          margin-top: 20px;
          font-size: 12px;
          color: #666;
        }
        .token-box {
          background-color: #f0f0f0;
          padding: 15px;
          border-left: 4px solid #4CAF50;
          margin: 20px 0;
          word-break: break-all;
        }
        .warning {
          color: #d32f2f;
          font-weight: bold;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Recuperar Contraseña</h1>
        </div>
        <div class="content">
          <h2>Hola ${userName},</h2>
          <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta.</p>
          <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>

          <div style="text-align: center;">
            <a href="${resetLink}" class="button">Restablecer Contraseña</a>
          </div>

          <p>O copia y pega este enlace en tu navegador:</p>
          <div class="token-box">
            ${resetLink}
          </div>

          <p class="warning">⚠️ Este enlace expirará en 1 hora por seguridad.</p>

          <p>Si no solicitaste restablecer tu contraseña, puedes ignorar este correo de forma segura.</p>

          <div class="footer">
            <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
            <p>&copy; ${new Date().getFullYear()} Tu Empresa. Todos los derechos reservados.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const getPasswordChangedTemplate = (userName: string): string => {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Contraseña Actualizada</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .container {
          background-color: #f4f4f4;
          border-radius: 10px;
          padding: 30px;
        }
        .header {
          background-color: #2196F3;
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .content {
          background-color: white;
          padding: 30px;
          border-radius: 0 0 10px 10px;
        }
        .success-icon {
          text-align: center;
          font-size: 48px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Contraseña Actualizada</h1>
        </div>
        <div class="content">
          <div class="success-icon">✅</div>
          <h2>Hola ${userName},</h2>
          <p>Tu contraseña ha sido actualizada exitosamente.</p>
          <p>Si no realizaste este cambio, contacta con soporte inmediatamente.</p>
          <div class="footer">
            <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
            <p>&copy; ${new Date().getFullYear()} Tu Empresa. Todos los derechos reservados.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const getWelcomeUserTemplate = (
  userName: string,
  clientName: string,
  userEmail: string,
  setupPasswordLink: string,
): string => {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bienvenido a Promotoria</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #1f2937;
          max-width: 520px;
          margin: 0 auto;
          padding: 40px 20px;
          background-color: #f9fafb;
        }
        .container {
          background-color: #ffffff;
          border-radius: 12px;
          padding: 40px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .logo {
          text-align: center;
          margin-bottom: 32px;
        }
        .logo h1 {
          font-size: 24px;
          font-weight: 700;
          color: #111827;
          margin: 0;
        }
        .logo span {
          color: #3b82f6;
        }
        h2 {
          font-size: 20px;
          font-weight: 600;
          color: #111827;
          margin: 0 0 16px 0;
        }
        p {
          margin: 0 0 16px 0;
          color: #4b5563;
        }
        .client-badge {
          display: inline-block;
          background-color: #eff6ff;
          color: #1d4ed8;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 24px;
        }
        .credentials {
          background-color: #f9fafb;
          border-radius: 8px;
          padding: 20px;
          margin: 24px 0;
        }
        .credentials p {
          margin: 0;
          font-size: 14px;
        }
        .credentials strong {
          color: #111827;
        }
        .button {
          display: block;
          width: 100%;
          padding: 14px 24px;
          background-color: #111827;
          color: #ffffff !important;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 500;
          text-align: center;
          margin: 24px 0;
          box-sizing: border-box;
        }
        .link-fallback {
          font-size: 12px;
          color: #6b7280;
          word-break: break-all;
          margin-top: 16px;
        }
        .divider {
          height: 1px;
          background-color: #e5e7eb;
          margin: 32px 0;
        }
        .footer {
          text-align: center;
          font-size: 12px;
          color: #9ca3af;
        }
        .footer p {
          margin: 4px 0;
          color: #9ca3af;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">
          <h1>Promotor<span>ia</span></h1>
        </div>

        <h2>¡Bienvenido, ${userName}!</h2>
        
        <div class="client-badge">
          ${clientName}
        </div>

        <p>Tu cuenta ha sido creada exitosamente. Ahora formas parte del equipo en la plataforma Promotoria.</p>

        <div class="credentials">
          <p><strong>Tu correo de acceso:</strong> ${userEmail}</p>
        </div>

        <p>Para comenzar, configura tu contraseña haciendo clic en el siguiente botón:</p>

        <a href="${setupPasswordLink}" class="button">Configurar mi contraseña</a>

        <p class="link-fallback">
          Si el botón no funciona, copia este enlace: ${setupPasswordLink}
        </p>

        <div class="divider"></div>

        <div class="footer">
          <p>Este enlace expirará en 24 horas.</p>
          <p>&copy; ${new Date().getFullYear()} Promotoria. Todos los derechos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};