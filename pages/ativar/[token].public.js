import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function ActiveUser() {
  const {query} = useRouter();
  const [userActivated, setUserActivated] = useState('');

  async function handleActivate(token) {
    try{
    const response = await fetch(`./api/v1/activate/${token}`, { 
      method: 'POST',
     })
     if(response.status === 200){
       setUserActivated('Usuário Ativado com Sucesso!');
      }else{
        setUserActivated('Erro ao Ativar Usuário!');
     }
    }catch (error) {
      console.log(error);
   }
  }

  useEffect(() => {
    handleActivate(query.token)
  }, [query.token]);

return (
  <h1>{userActivated}</h1>
)
}


