export function ActivationByToken({ username, activationPageEndpoint }) {
  return (
    <p>
      {username}, clique no link abaixo para ativar seu cadastro no TabNews: <br />
      <br />
      <a href={activationPageEndpoint}>{activationPageEndpoint}</a> <br />
      <br />
      Caso você não tenha feito esta requisição, ignore esse email. <br />
      <br />
      Atenciosamente, <br />
      Equipe TabNews <br />
      Rua Antônio da Veiga, 495, Blumenau, SC, 89012-500
    </p>
  );
}
