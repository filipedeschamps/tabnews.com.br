export default function HomeOffline() {
  return (
    <div style={{ margin: '20px' }}>
      <h1>Turma, atenção!</h1>
      <p>
        O vídeo de lançamento derrubou a API. Nós estamos utilizando a{' '}
        <strong>menor instância do Banco de Dados</strong> da AWS e ela não deu conta.
      </p>
      <p>
        Dentro dos primeiros <strong>60 minutos</strong> foram mais de <strong>1 Milhão de Requests</strong>, olha isso:
      </p>

      <p>
        <img alt="Requests" src="https://i.imgur.com/pbtnUyr.png" style={{ maxWidth: '800px' }} />
      </p>

      <p>Mas já já a gente volta, combinado? :) então muito obrigado por acessar!</p>
      <p>
        No mais, sugiro acessar o{' '}
        <a href="https://github.com/filipedeschamps/tabnews.com.br">repositório lá no GitHub</a>.
      </p>
      <p>
        Abração e até daqui a pouco ❤️
        <br />
        <strong>Filipe Deschamps</strong>
      </p>
    </div>
  );
}
