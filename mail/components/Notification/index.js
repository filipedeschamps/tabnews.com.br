export function BaseNotification({ username, bodyReplyLine, childContendUrl }) {
  return (
    <p>
      Olá, {username}! <br />
      <br />
      {bodyReplyLine} <br />
      <br />
      <a href={childContendUrl}>{childContendUrl}</a> <br />
      <br />
      Atenciosamente, <br />
      Equipe TabNews <br />
      Rua Antônio da Veiga, 495, Blumenau, SC, 89012-500
    </p>
  );
}
