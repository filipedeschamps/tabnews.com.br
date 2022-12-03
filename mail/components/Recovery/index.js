export function Recovery({ username, recoverPageEndpoint }) {
  return (
    <p>
      {username}, uma solicitação de recuperação de senha foi solicitada. Caso você não tenha feito esta solicitação,
      ignore esse email. <br />
      <br />
      Caso você tenha feito essa solicitação, clique no link abaixo para definir uma nova senha: <br />
      <br />
      <a href={recoverPageEndpoint}>${recoverPageEndpoint}</a> <br />
      <br />
      Atenciosamente, <br />
      Equipe TabNews <br />
      Rua Antônio da Veiga, 495, Blumenau, SC, 89012-500
    </p>
  );
}
