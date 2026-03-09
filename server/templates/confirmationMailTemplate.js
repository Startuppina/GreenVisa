function generateTemplate(recipient_name, token) {
  return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verifica account Green Visa</title>
            <style>
                body {
                    font-family: Helvetica, Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                    background-color: #f9f9f9;
                }
                .container {
                    max-width: 600px;
                    margin: 50px auto;
                    background-color: #ffffff;
                    padding: 30px;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                }
                .header {
                    text-align: center;
                    padding-bottom: 20px;
                }
                .header img {
                    width: 150px;
                    margin-bottom: 10px;
                }
                .header h1 {
                    font-size: 1.8em;
                    color: #2d7044;
                    margin: 0;
                }
                .body {
                    padding: 20px 10px;
                    text-align: center;
                }
                .body h2 {
                    font-size: 1.4em;
                    color: #333333;
                    margin-bottom: 10px;
                }
                .body p {
                    font-size: 1.1em;
                    line-height: 1.6;
                    color: #555555;
                }
                .cta-button {
                    display: inline-block;
                    background-color: #2d7044;
                    color: white;
                    text-decoration: none;
                    padding: 12px 24px;
                    font-size: 1.2em;
                    font-weight: bold;
                    border-radius: 4px;
                    margin: 20px 0;
                }
                .footer {
                    padding-top: 20px;
                    text-align: center;
                    font-size: 0.9em;
                    color: #888888;
                }
                .footer p {
                    margin: 5px 0;
                }
                @media screen and (max-width: 600px) {
                    .container {
                        width: 100%;
                        padding: 15px;
                    }
                    .header h1 {
                        font-size: 1.6em;
                    }
                    .body h2 {
                        font-size: 1.2em;
                    }
                    .cta-button {
                        font-size: 1em;
                        padding: 10px 20px;
                    }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <img src="${process.env.SERVER_URL}/logo2.png" alt="Green Visa Logo">
                    <h1>Verifica il tuo account</h1>
                </div>
                <div class="body">
                    <h2>Ciao ${recipient_name},</h2>
                    <p>Abbiamo ricevuto una richiesta di verifica per il tuo account Green Visa.</p>
                    <p>Per verificare il tuo account, clicca sul link sottostante:</p>
                    <a class="cta-button" href="${process.env.CLIENT_URL}/AccountVerified?token=${token}">Verifica il tuo account</a>
                </div>
                <div class="footer">
                  <p>Green Visa</p>
                  <p>La sostenibilità con un click!</p>
                </div>
            </div>
        </body>
        </html>`;
}

module.exports = { generateTemplate };
