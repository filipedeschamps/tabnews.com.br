export function EmailConfirmation({ username, emailConfirmationPageEndpoint }) {
  return (
    <p>
      {username}, uma alteração de email foi solicitada. <br />
      <br />
      Clique no link abaixo para confirmar esta alteração: <br />
      <br />
      <a href={emailConfirmationPageEndpoint}>{emailConfirmationPageEndpoint}</a> <br />
      <br />
      Atenciosamente, <br />
      Equipe TabNews <br />
      Rua Antônio da Veiga, 495, Blumenau, SC, 89012-500
    </p>
  );
}
